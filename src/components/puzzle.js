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
  #date;
  #gameState;
  #cards;
  #guesses;
  #guessedCategories = [];
  #selected = new Set();

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.addEventListener("change", this.tryToggle.bind(this));
  }

  set date(value) {
    this.#date = value;
  }

  async connectedCallback() {
    await this.initialize(this.#date);
    this.#gameState = await fetchFreshPuzzle(this.#date);
    this.#guesses = await db.getGuesses(this.#gameState);
    this.#cards = this.#gameState.categories.flatMap(({ cards }) => cards);

    this.#guesses
      .filter((guess) => guess.category_id)
      .forEach((guess) => {
        if (!guess.category_id) return;
        const guessedCategory = this.#gameState.categories.find(
          (category) => category.id === guess.category_id,
        );
        this.#guessedCategories.push(guessedCategory);
        this.#cards = this.#cards.filter(
          (card) => card.categoryId !== guess.category_id,
        );
      });

    this.render();
  }

  render() {
    const categoriesHtml = this.#guessedCategories
      .map(
        (category) => `
          <div class="category-${category.difficulty}">
            <h4>${fromBase64(category.title)}</h4>
            <h5>${category.cards.map(({ content }) => fromBase64(content)).join(", ")}</h5>
          </div>`,
      )
      .join("");

    const cardsHtml = this.#cards
      .toSorted(({ position: a }, { position: b }) => a - b)
      .map(
        (card) => `
          <label>
            <input
              type="checkbox"
              name="cards"
              value="${card.id}"
              ${this.#selected.has(card) ? "checked" : ""}
            />
            ${fromBase64(card.content)}
          </label>`,
      )
      .join("");

    this.shadowRoot.innerHTML = `
      <style>${puzzleCss}</style>
      <div id="puzzleContainer">
        <span>${this.#gameState.printDate}</span>
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

    if (this.#selected.delete(target)) {
      target.checked = false;
    } else {
      target.checked = this.#selected.size < 4 && !!this.#selected.add(target);
    }
  }

  async tryGuess(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!this.#gameState || this.#selected.size !== 4) return;

    const selectedElements = Array.from(this.#selected);
    const guessStr = selectedElements
      .map(({ value }) => value)
      .sort()
      .join(",");

    const alreadyGuessed = await db.getGuess(this.#gameState, guessStr);
    if (alreadyGuessed) {
      console.debug("ALREADY GUESSED");
      return;
    }

    const guessMap = Map.groupBy(selectedElements, ({ value }) => {
      const cardId = Number.parseInt(value, 10);
      return this.#cards.find(({ id }) => id === cardId).categoryId;
    });

    if (guessMap.size === 1) {
      const categoryId = guessMap.keys().next().value;
      const guessedCategory = this.#gameState.categories.find(
        ({ id }) => categoryId === id,
      );
      console.debug("CORRECT", guessedCategory);

      this.#guessedCategories.push(guessedCategory);
      this.#cards = this.#cards.filter(
        ({ categoryId }) => guessedCategory.id !== categoryId,
      );
      selectedElements.map((el) => el.parentNode.remove());
      this.#selected.clear();

      return await db.addGuess(this.#gameState, guessStr, categoryId);
    }

    if (guessMap.size === 2) {
      const singleton = guessMap.values().find((v) => v.length === 1);
      if (singleton) {
        console.debug("ONE AWAY", singleton.parentNode);
      } else {
        console.debug("EVEN SPLIT");
      }
    } else if (guessMap.size === 4) {
      console.debug("ALL WRONG! That's quite impressive");
    } else {
      console.debug("JUST WRONG, yo");
    }

    return await db.addGuess(this.#gameState, guessStr);
  }
}

customElements.define("puzzle-component", Puzzle);
