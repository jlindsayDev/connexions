"use strict";

import {
  css,
  html,
  LitElement,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

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
  `;

  static properties = {
    month: { state: true, type: Number },
    year: { state: true, type: Number },
  };

  constructor() {
    super();
    this.month = 2;
    this.year = 2026;
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

  _select(e) {
    if (e.target.className === "day") {
      const day = Number.parseInt(e.target.textContent, 10);
      console.log(day);
    }
  }
}

customElements.define("calendar-component", Calendar);
