import { padNums } from "../lib/utils.js";

const calendarCss = `
  #calendarContainer {

  }

  #nav {
    display: flex;
    text-align: center;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0rem;
  }

  #calendar {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
  }

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
    cursor: pointer;
    background: none;
  }
`;

export class Calendar extends HTMLElement {
  #year = 0;
  #month = 0;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    if (!this.#year || !this.#month) {
      const d = new Date();
      this.#year = d.getFullYear();
      this.#month = d.getMonth();
    }
    this.render();
  }

  set month(value) {
    this.#month = value;
  }

  set year(value) {
    this.#year = value;
  }

  decrement = () => {
    this.#month--;
    if (this.#month < 0) {
      this.#month = 11;
      this.#year--;
    }
    this.render();
  };

  increment = () => {
    this.#month++;
    if (this.#month > 11) {
      this.#month = 0;
      this.#year++;
    }
    this.render();
  };

  handleSelect = async (e) => {
    const target = e.target;
    if (target.classList.contains("day")) {
      const day = Number.parseInt(target.textContent || "0", 10);
      const puzzle = document.createElement("puzzle-component");
      puzzle.date = padNums(this.#year, this.#month + 1, day);
      this.shadowRoot.getElementById("puzzleContainer").replaceChildren(puzzle);
    }
  };

  render() {
    const firstDay = new Date(this.#year, this.#month, 1);
    const firstDayIndex = firstDay.getDay();
    const monthName = firstDay.toLocaleString("default", { month: "long" });
    const daysInMonth = new Date(this.#year, this.#month + 1, 0).getDate();

    const headers = ["Su", "M", "Tu", "W", "Th", "F", "Sa"]
      .map((day) => `<div class="dow">${day}</div>`)
      .join("");

    const emptyCells = Array(firstDayIndex)
      .fill(`<div class="empty"></div>`)
      .join("");

    const days = Array.from({ length: daysInMonth }, (_, i) => i)
      .map((day) => `<button class="day">${day + 1}</button>`)
      .join("");

    this.shadowRoot.innerHTML = `
      <style>${calendarCss}</style>
      <div id="calendarContainer">
        <section id="nav">
          <button id="btn-prev">&larr;</button>
          <span>${monthName} ${this.#year}</span>
          <button id="btn-next">&rarr;</button>
        </section>

        <section id="calendar">
          ${headers}
          ${emptyCells}
          ${days}
        </section>
      </div>
      <div id="puzzleContainer"></div>
    `;

    this.shadowRoot
      .getElementById("btn-prev")
      .addEventListener("click", this.decrement);
    this.shadowRoot
      .getElementById("btn-next")
      .addEventListener("click", this.increment);
    this.shadowRoot
      .getElementById("calendar")
      .addEventListener("click", this.handleSelect);
  }
}

customElements.define("calendar-component", Calendar);
