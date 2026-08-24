import { fetchFreshPuzzle } from "../lib/client.js";
import * as db from "../lib/db.js";
import { fromBase64 } from "../lib/utils.js";

const puzzleCss = `
  #puzzleContainer {
    display: flex;
    flex-direction: column;
  }

  #categories {
    display: flex;
    text-align: center;
    flex-direction: column;
  }

  #cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 1fr;
    gap: 0.5rem;
  }

  input[type="checkbox"] {
    appearance: none;
  }

  label {
    box-sizing: border-box;
    border: 1px solid #ddd;
    border-radius: 10px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    padding: 2rem 0rem;
    font-weight: bold;
    font-size: clamp(0.5rem, 0.9rem, 2rem);
    text-align: center;
    word-wrap: break-word;
    word-break: break-word;
  }

  label:has(input[type="checkbox"]:checked) {
    background-color: blanchedalmond;
  }

  @media (prefers-color-scheme: light) {
    .category-0 { background-color: rgb(84, 146, 255); }
    .category-1 { background-color: rgb(105, 227, 82); }
    .category-2 { background-color: rgb(251, 212, 0); }
    .category-3 { background-color: rgb(223, 123, 234); }
  }

  @media (prefers-color-scheme: dark) {
    .category-0 { background-color: rgb(27, 59, 112); }
    .category-1 { background-color: rgb(30, 126, 10); }
    .category-2 { background-color: rgb(123, 110, 34); }
    .category-3 { background-color: rgb(106, 8, 117); }
  }
`;

export class Puzzle extends HTMLElement {
  _year = 0;
  _month = 0;
  _day = 0;

  _gameState;
  _guesses;
  _guessedCategories = [];
  _cards = [];
  _selected = new Set();

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.addEventListener("change", this.tryToggle.bind(this));
  }

  async connectedCallback() {
    this._gameState = await fetchFreshPuzzle(
      this._year,
      this._month,
      this._day,
    );
    this._guesses = await db.getGuesses(this._gameState);
    this._cards = this._gameState.categories.flatMap(({ cards }) => cards);

    this._guesses
      .filter(({ category_id }) => category_id)
      .forEach(({ category_id: guessCategoryId }) => {
        const guessedCategory = this._gameState.categories.find(
          ({ id }) => guessCategoryId === id,
        );

        if (guessedCategory) {
          this._guessedCategories.push(guessedCategory);
          this._cards = this._cards.filter(
            ({ categoryId }) => guessCategoryId !== categoryId,
          );
        }
      });

    this.render();
  }

  set year(value) {
    this._year = value;
    this.setAttribute("year", String(value));
  }

  set month(value) {
    this._month = value;
    this.setAttribute("month", String(value));
  }

  set day(value) {
    this._day = value;
    this.setAttribute("day", String(value));
  }

  render() {
    if (!this.shadowRoot) return;

    const categoriesHtml = this._guessedCategories
      .map(
        (category) => `
          <div class="category-${category.difficulty}">
            <h4>${fromBase64(category.title)}</h4>
            <h5>${category.cards.map(({ content }) => fromBase64(content)).join(", ")}</h5>
          </div>`,
      )
      .join("");

    const cardsHtml = this._cards
      .toSorted(({ position: a }, { position: b }) => a - b)
      .map(
        (card) => `
          <label id="${card.id}">
            <input
              type="checkbox"
              name="cards"
              value="${card.id}"
              ${this._selected.has(card) ? "checked" : ""}
            />
            ${fromBase64(card.content)}
          </label>`,
      )
      .join("");

    this.shadowRoot.innerHTML = `
      <style>${puzzleCss}</style>
      <div id="puzzleContainer">
        <span>${this._gameState.printDate}</span>
        <section id="categories">${categoriesHtml}</section>
        <form id="form">
          <section id="cards">${cardsHtml}</section>
          <input type="submit" value="GUESS"/>
        </form>
      </div>
    `;

    this.shadowRoot
      .getElementById("form")
      .addEventListener("submit", this.tryGuess.bind(this));
  }

  tryToggle(e) {
    const { target } = e;
    if (target.name !== "cards") return;

    if (this._selected.delete(target)) {
      target.checked = false;
    } else {
      target.checked = this._selected.size < 4 && !!this._selected.add(target);
    }
  }

  async tryGuess(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!this._gameState || this._selected.size !== 4) return;

    const selectedElements = Array.from(this._selected);
    const guessStr = selectedElements
      .map(({ value }) => value)
      .sort()
      .join(",");

    const alreadyGuessed = await db.getGuess(this._gameState, guessStr);
    if (alreadyGuessed) {
      console.debug(`Already tried guess: ${guessStr}`);
      return;
    }

    const guessMap = Map.groupBy(selectedElements, ({ value }) => {
      const cardId = Number.parseInt(value, 10);
      return this._cards.find(({ id }) => id === cardId).categoryId;
    });

    if (guessMap.size === 1) {
      const categoryId = guessMap.keys().next().value;
      const guessedCategory = this._gameState.categories.find(
        ({ id }) => categoryId === id,
      );
      console.debug("CORRECT", guessedCategory);

      this._guessedCategories.push(guessedCategory);
      this._cards = this._cards.filter(
        ({ categoryId }) => guessedCategory.id !== categoryId,
      );
      selectedElements.map((el) => el.parentNode.remove());
      this._selected.clear();

      return await db.addGuess(this._gameState, guessStr, categoryId);
    }

    if (guessMap.size === 2) {
      const singleton = guessMap.values().find((v) => v.length === 1);
      if (singleton) {
        console.debug("ONE AWAY", singleton.parentNode);
      } else {
        console.debug("EVEN SPLIT");
      }
    } else if (guessMap.size === 4) {
      console.debug("ALL WRONG! That's most impressive");
    } else {
      console.debug("JUST WRONG, yo");
    }

    return await db.addGuess(this._gameState, guessStr);
  }
}

customElements.define("puzzle-component", Puzzle);
