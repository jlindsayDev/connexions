import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import "fake-indexeddb/auto";

import {
  addGameState,
  addGuess,
  fetchDaysDownloaded,
  fetchGameState,
  getGuess,
  getGuesses,
  resetData,
} from "../src/db";
import { PuzzleStatusEnum } from "../src/models";

const originalConfirm = globalThis.confirm;
globalThis.confirm = () => true;

describe("PuzzlesDatabase", () => {
  beforeEach(async () => {
    await resetData();
  });

  afterAll(() => {
    globalThis.confirm = originalConfirm;
  });

  const mockPuzzle = {
    print_date: "2026-05-28",
    status: PuzzleStatusEnum.NotAttempted,
  };

  const mockCategories = Array.from({ length: 4 }, (_, i) => ({
    id: i + 1,
    title: btoa(`Category ${i}`),
    difficulty: i,
  }));

  const mockCards = Array.from({ length: 16 }, (_, i) => ({
    id: i + 1,
    content: btoa(`Word ${i}`),
    position: i,
    category_id: Math.floor(i / 4) + 1,
  }));

  test("adds and fetches game state", async () => {
    const puzzleId = await addGameState({
      puzzle: mockPuzzle as any,
      categories: mockCategories as any,
      cards: mockCards as any,
    });

    expect(puzzleId).toBeGreaterThan(0);

    const gameState = await fetchGameState({ puzzle_id: puzzleId });

    expect(gameState).not.toBeNull();
    expect(gameState?.puzzle.print_date).toBe("2026-05-28");
    expect(gameState?.categories).toHaveLength(4);
    expect(gameState?.cards).toHaveLength(16);
  });

  test("adds and retrieves guesses", async () => {
    const puzzleId = await addGameState({
      puzzle: mockPuzzle as any,
      categories: mockCategories as any,
      cards: mockCards as any,
    });

    const puzzleModel = {
      id: puzzleId,
      print_date: "2026-05-28",
      status: PuzzleStatusEnum.NotAttempted,
    };

    await addGuess(puzzleModel, "Word 0,Word 1,Word 2,Word 3");
    await addGuess(puzzleModel, "Word 4,Word 5,Word 6,Word 7", 2);

    const singleGuess = await getGuess(
      puzzleModel,
      "Word 0,Word 1,Word 2,Word 3",
    );
    expect(singleGuess).toBeDefined();
    expect(singleGuess?.puzzle_id).toBe(puzzleId);
    expect(singleGuess?.guess).toBe("Word 0,Word 1,Word 2,Word 3");

    const allGuesses = await getGuesses(puzzleModel);
    expect(allGuesses).toHaveLength(2);
  });

  test("fetches days downloaded", async () => {
    await addGameState({
      puzzle: mockPuzzle as any,
      categories: mockCategories as any,
      cards: mockCards as any,
    });

    const date = new Date("2026-05-28T12:00:00Z");
    const daysDownloaded = await fetchDaysDownloaded(date);

    expect(daysDownloaded).toHaveProperty("28");
    expect(daysDownloaded[28]).toBe(PuzzleStatusEnum.NotAttempted);
  });
});
