import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import "./puzzle"; // Ensure the custom element is imported and registered
import type { GameState, GuessModel } from "../src/models";

describe("puzzle-component", () => {
  let element: HTMLElement & {
    initialize: (gs: GameState, g: GuessModel[]) => void;
    cards: any[];
  };

  beforeEach(() => {
    element = document.createElement("puzzle-component") as any;
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  test("attaches open shadow root", () => {
    expect(element.shadowRoot).not.toBeNull();
    expect(element.shadowRoot?.mode).toBe("open");
  });

  test("initializes game state and renders categories", () => {
    const mockGameState: GameState = {
      categories: [
        { id: "c1", title: "FRUITS", difficulty: 1 },
        { id: "c2", title: "COLORS", difficulty: 2 },
      ],
    };

    const mockGuesses: GuessModel[] = [{ category_id: "c1" }];

    element.initialize(mockGameState, mockGuesses);

    const shadowHtml = element.shadowRoot?.innerHTML || "";
    expect(shadowHtml).toContain("FRUITS");
    expect(shadowHtml).toContain("category-1");
  });

  test("toggles checkboxes and enforces maximum selection of 4", () => {
    const mockGameState: GameState = { categories: [] };
    const mockGuesses: GuessModel[] = [];

    element.initialize(mockGameState, mockGuesses);

    // Inject cards directly for testing DOM interaction
    (element as any).cards = [
      { id: "1", position: 1, content: "A", category_id: "c2" },
      { id: "2", position: 2, content: "B", category_id: "c2" },
      { id: "3", position: 3, content: "C", category_id: "c2" },
      { id: "4", position: 4, content: "D", category_id: "c2" },
      { id: "5", position: 5, content: "E", category_id: "c2" },
    ];

    // Trigger internal render
    (element as any).render();

    const checkboxes = element.shadowRoot?.querySelectorAll<HTMLInputElement>(
      "input[name='cards']",
    );

    expect(checkboxes?.length).toBe(5);

    if (!checkboxes) return;

    // Click all 5 checkboxes
    for (let i = 0; i < 5; i++) {
      checkboxes[i].click();
    }

    const checkedBoxes = Array.from(checkboxes).filter((cb) => cb.checked);
    expect(checkedBoxes.length).toBe(4);

    // Uncheck the first one
    checkboxes[0].click();
    expect(checkboxes[0].checked).toBe(false);

    const remainingChecked = Array.from(checkboxes).filter((cb) => cb.checked);
    expect(remainingChecked.length).toBe(3);
  });
});
