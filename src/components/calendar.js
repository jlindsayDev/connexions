import { getGuesses } from "../db.js";
import { padNums } from "../utils.js";

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
  _month = 0;
  _year = 0;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const d = new Date();
    this._year = d.getFullYear();
    this._month = d.getMonth();
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ["month", "year"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === "month") this._month = Number(newValue);
    if (name === "year") this._year = Number(newValue);
    this.render();
  }

  get month() {
    return this._month;
  }

  set month(value) {
    this._month = value;
    this.setAttribute("month", String(value));
  }

  get year() {
    return this._year;
  }

  set year(value) {
    this._year = value;
    this.setAttribute("year", String(value));
  }

  decrement = () => {
    this._month--;
    if (this._month < 0) {
      this._month = 11;
      this._year--;
    }
    this.render();
  };

  increment = () => {
    this._month++;
    if (this._month > 11) {
      this._month = 0;
      this._year++;
    }
    this.render();
  };

  handleSelect = async (e) => {
    const target = e.target;
    if (target.classList.contains("day")) {
      const day = Number.parseInt(target.textContent || "0", 10);
      const gameState = await fetchFreshPuzzle(this._year, this._month, day);
      const guesses = await getGuesses(gameState.puzzle);

      const puzzle = document.createElement("puzzle-component");
      puzzle.initialize(gameState, guesses);
      document.getElementById("puzzle")?.replaceChildren(puzzle);
    }
  };

  render() {
    if (!this.shadowRoot) return;

    const firstDay = new Date(this._year, this._month, 1);
    const firstDayIndex = firstDay.getDay();
    const monthName = firstDay.toLocaleString("default", { month: "long" });
    const daysInMonth = new Date(this._year, this._month + 1, 0).getDate();

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
          <span>${monthName} ${this._year}</span>
          <button id="btn-next">&rarr;</button>
        </section>

        <section id="calendar">
          ${headers}
          ${emptyCells}
          ${days}
        </section>
      </div>
    `;

    this.shadowRoot
      .getElementById("btn-prev")
      ?.addEventListener("click", this.decrement);
    this.shadowRoot
      .getElementById("btn-next")
      ?.addEventListener("click", this.increment);
    this.shadowRoot
      .getElementById("calendar")
      ?.addEventListener("click", this.handleSelect);
  }
}

const fetchFreshPuzzle = async (year, month, day) => {
  const printDate = `/day/${padNums(year, month + 1, day)}`;
  const puzzleResponse = await fetch(printDate);
  // TODO: error handling
  return (await puzzleResponse.json());
};

customElements.define("calendar-component", Calendar);
