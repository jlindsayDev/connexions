import type { CardModel, CategoryModel, GameState, GuessModel } from "./models";

class Puzzle extends HTMLElement {
  private gameState?: GameState;
  private guesses: GuessModel[] = [];
  private categories: CategoryModel[] = [];
  private cards: CardModel[] = [];
  private selected: Set<number> = new Set();

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

    const categoriesHtml = this.categories
      .map(
        (category, i) => `
        <div class="category-${category.difficulty}" data-key="${i}">
          <h4>${category.title}</h4>
          <h5>WORDS, WORDS, WORDS, WORDS</h5>
        </div>
      `,
      )
      .join("");

    const cardsHtml = this.cards
      .toSorted(({ position: a }, { position: b }) => a - b)
      .map(
        (card) => `
        <label data-key="${card.id}">
          <input
            type="checkbox"
            name="cards"
            value="${card.position}"
            ${this.selected.has(card.position) ? "checked" : ""}
          />
          ${card.content}
        </label>
      `,
      )
      .join("");

    this.shadowRoot.innerHTML = `
      <style></style>
      <form action="{}">
        <div id="puzzle">
          <section id="categories">${categoriesHtml}</section>
          <section id="cards">${cardsHtml}</section>
          <section>
            <input type="submit" value="GUESS" />
          </section>
        </div>
      </form>
    `;
  }

  private tryToggle(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.name !== "cards") return;

    const value = Number.parseInt(target.value, 10);

    if (this.selected.delete(value)) {
      target.checked = false;
    } else {
      target.checked = this.selected.size < 4 && !!this.selected.add(value);
    }
  }

  public initialize(gameState: GameState, guesses: GuessModel[]) {
    this.gameState = gameState;
    this.guesses = guesses;

    guesses
      .filter(({ category_id }) => category_id)
      .forEach(({ category_id: guessCategoryId }) => {
        const guessedCategory = gameState.categories.find(
          ({ id }) => guessCategoryId === id,
        );

        if (guessedCategory) {
          this.categories.push(guessedCategory);
          this.cards = [
            ...this.cards.filter(
              ({ category_id: id }) => guessCategoryId !== id,
            ),
          ];
        }
      });

    this.render();
  }
}

customElements.define("puzzle-component", Puzzle);

declare global {
  interface HTMLElementTagNameMap {
    "puzzle-component": Puzzle;
  }
}
