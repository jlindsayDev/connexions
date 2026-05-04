import { type CSSResultGroup, css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("calendar-component")
export class Calendar extends LitElement {
  static styles = css`
    nav {
      text-align: center;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0rem;
    }

    #calendar {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.5rem;

      .dow {
        text-align: center;
      }

      .day {
        border: 1px solid #ddd;
        border-radius: 10px;
        text-align: center;
        align-items: center;
        justify-content: center;

        padding: 15%;
      }
    }
  ` as CSSResultGroup;

  @property({ state: true, type: Number })
  month: number = 0;

  @property({ state: true, type: Number })
  year: number = 0;

  constructor() {
    super();
    this.month = 0;
    this.year = 0;
  }

  render() {
    const firstDay = new Date(this.year, this.month, 1);
    const firstDayIndex = firstDay.getDay();
    const monthName = firstDay.toLocaleString("default", { month: "long" });
    const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();

    const header = ["Su", "M", "Tu", "W", "Th", "F", "Sa"].map(
      (day) => html`<div class="dow">${day}</div>`,
    );

    const calendar = Array(7).fill(html`<div class="empty"></div>`);
    const days = Array.from({ length: daysInMonth }, (_, i) => i);
    const calendarDays = days.map(
      (day) => html`<button class="day">${day + 1}</button>`,
    );
    calendar.splice(firstDayIndex, 0, ...calendarDays);

    return html`
      <nav>
        <button @click=${this._decrement}>&larr;</button>
        <span>${monthName} ${this.year}</span>
        <button @click=${this._increment}>&rarr;</button>
      </nav>

      <section id="calendar" @click=${this._select}>
        ${header} ${calendar}
      </section>
    `;
  }

  _decrement() {
    this.month--;
    if (this.month % 12 < 0) {
      this.month = 11;
      this.year--;
    }
  }

  _increment() {
    this.month++;
    if (this.month % 12 <= 0) {
      this.month = 0;
      this.year++;
    }
  }

  async _select(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.className === "day") {
      const day = Number.parseInt(target.textContent, 10);
      const puzzleComponent = await initializePuzzle(
        `${this.year}-${this.month}-${day}`,
      );

      console.log("made puzzle", puzzleComponent);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "calendar-component": Calendar;
  }
}
