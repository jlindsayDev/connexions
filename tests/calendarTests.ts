import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import type { Calendar } from "../src/calendar";

describe("CalendarComponent", () => {
  let element: Calendar;

  beforeEach(() => {
    element = document.createElement("calendar-component") as Calendar;
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it("initializes with default values", () => {
    expect(element.month).toBe(0);
    expect(element.year).toBe(0);
  });

  it("updates properties when attributes change", () => {
    element.setAttribute("month", "5");
    element.setAttribute("year", "2023");

    expect(element.month).toBe(5);
    expect(element.year).toBe(2023);
  });

  it("updates attributes when properties change", () => {
    element.month = 8;
    element.year = 2025;

    expect(element.getAttribute("month")).toBe("8");
    expect(element.getAttribute("year")).toBe("2025");
  });

  it("increments month and rolls over year", () => {
    element.month = 11;
    element.year = 2023;

    const nextBtn = element.shadowRoot?.getElementById("btn-next");
    nextBtn?.click();

    expect(element.month).toBe(0);
    expect(element.year).toBe(2024);
  });

  it("decrements month and rolls over year", () => {
    element.month = 0;
    element.year = 2024;

    const prevBtn = element.shadowRoot?.getElementById("btn-prev");
    prevBtn?.click();

    expect(element.month).toBe(11);
    expect(element.year).toBe(2023);
  });

  it("renders the correct number of days for the given month", () => {
    element.month = 1;
    element.year = 2024;

    const days = element.shadowRoot?.querySelectorAll(".day");
    expect(days?.length).toBe(29);
  });

  it("triggers selection logic when a day is clicked", () => {
    const consoleSpy = spyOn(console, "debug");

    element.month = 0;
    element.year = 2024;

    const firstDayBtn = element.shadowRoot?.querySelector(
      ".day",
    ) as HTMLElement;
    firstDayBtn?.click();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Clicked initializePuzzle"),
    );

    consoleSpy.mockRestore();
  });
});
