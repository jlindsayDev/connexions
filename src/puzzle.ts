import { type CSSResultGroup, css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import type {
  CardModel,
  CategoryModel,
  GuessModel,
  GameState,
} from "./models";

@customElement("puzzle-component")
class Puzzle extends LitElement {
  static styles = css`` as CSSResultGroup;

  @property({ type: Object })
  gameState: GameState;

  @property({ state: true, type: Array })
  guesses: GuessModel[];

  @property({ state: true, type: Array })
  categories: CategoryModel[] = [];

  @property({ state: true, type: Array })
  cards: CardModel[] = [];

  @property({ state: true, type: Set<number> })
  selected: Set<number> = new Set();

  constructor() {
    super();
  }

  initializeState(guesses: GuessModel[]) {
    guesses
      .filter(({ category_id }) => category_id)
      .forEach(({ category_id: guessCategoryId }) => {
        const guessedCategory = this.gameState.categories.find(
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
  }

  render() {
    const categoryElement = (
      { difficulty, title }: CategoryModel,
      i: number,
    ) => {
      const elem = html`
        <div class="category-${difficulty}" key=${i}>
          <h4>${title}</h4>
          <h5>WORDS, WORDS, WORDS, WORDS</h5>
        </div>
      `;
      return elem;
    };
    const categories = this.categories.map(categoryElement);

    const cardElement = (card: CardModel) => html`
      <label key=${card.id}>
        <input
          type="checkbox"
          name="cards"
          value=${card.position}
          onChange=${this.tryToggle}
        />
        ${card.content}
      </label>
    `;
    const cards = this.cards
      .toSorted(({ position: a }, { position: b }) => a - b)
      .map(cardElement);

    return html`
      <form action="{}">
        <div id="puzzle">
          <section id="categories">${categories}</section>
          <section id="cards">${cards}</section>
          <section>
            <input type="submit" value="GUESS" />
          </section>
        </div>
      </form>
    `;
  }

  tryToggle(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = Number.parseInt(target.value, 10);

    if (this.selected.delete(value)) {
      target.checked = false;
    } else {
      target.checked = this.selected.size < 4 && !!this.selected.add(value);
    }
  }

  initialize() {}
}

declare global {
  interface HTMLElementTagNameMap {
    "puzzle-component": Puzzle;
  }
}
