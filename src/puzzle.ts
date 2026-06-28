import type { CardModel, CategoryModel, GameState, GuessModel } from "./models";

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

class Puzzle extends HTMLElement {
  private _guesses: GuessModel[] = [];
  private _categories: CategoryModel[] = [];
  private _guessedCategories: CategoryModel[] = [];
  private _cards: CardModel[] = [];
  private _selected: Set<number> = new Set();

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot?.addEventListener("change", this.tryToggle.bind(this));
  }

  connectedCallback() {
    this.render();
  }

  private render() {
    if (!this.shadowRoot) return;

    const categoryToHtml = (category: CategoryModel, i: number) => `
      <div class="category-${category.difficulty}" data-key="${i}">
        <h4>${category.title}</h4>
        <h5>WORDS, WORDS, WORDS, WORDS</h5>
      </div>`;

    const cardToHtml = (card: CardModel) => `
      <label data-key="${card.id}">
        <input
          type="checkbox"
          name="cards"
          value="${card.position}"
          ${this._selected.has(card.position) ? "checked" : ""}
        />
        ${card.content}
      </label>`;

    const categoriesHtml = this._guessedCategories.map(categoryToHtml).join("");
    const cardsHtml = this._cards
      .toSorted(({ position: a }, { position: b }) => a - b)
      .map(cardToHtml)
      .join("");

    this.shadowRoot.innerHTML = `
      <style>${puzzleCss}</style>
      <div id="puzzleContainer">
        <section id="categories">${categoriesHtml}</section>
        <form id="form">
          <section id="cards">${cardsHtml}</section>
          <input type="submit" value="GUESS"/>
        </form>
      </div>
    `;

    this.shadowRoot
      .getElementById("form")
      ?.addEventListener("submit", this.tryGuess);
  }

  private tryGuess(e: SubmitEvent) {
    e.preventDefault();
  }

  private tryToggle(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.name !== "cards") return;

    const value = Number.parseInt(target.value, 10);

    if (this._selected.delete(value)) {
      target.checked = false;
    } else {
      target.checked = this._selected.size < 4 && !!this._selected.add(value);
    }
  }

  public initialize(gameState: GameState, guesses: GuessModel[]) {
    this._guesses = guesses;

    this._categories = gameState.categories;
    this._cards = gameState.cards;

    guesses
      .filter(({ category_id }) => category_id)
      .forEach(({ category_id: guessCategoryId }) => {
        const guessedCategory = gameState.categories.find(
          ({ id }) => guessCategoryId === id,
        );

        if (guessedCategory) {
          this._guessedCategories.push(guessedCategory);
          this._cards = [
            ...this._cards.filter(
              ({ category_id: id }) => guessCategoryId !== id,
            ),
          ];
        }
      });
  }
}

customElements.define("puzzle-component", Puzzle);

declare global {
  interface HTMLElementTagNameMap {
    "puzzle-component": Puzzle;
  }
}
