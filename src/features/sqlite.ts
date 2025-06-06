import type { Database } from "bun:sqlite";
import type { Card, Category, Puzzle } from "models";
import { toBase64 } from "../utils";

export const findPuzzleByDate = (
    db: Database,
    dateStr: string,
): Puzzle | null => {
    const stmt = db.prepare<Puzzle, string[]>(
        "SELECT * FROM puzzles WHERE print_date = ?",
    );

    const puzzle = stmt.get(dateStr);
    return puzzle;
};

export const findCardsForPuzzle = (db: Database, puzzle: Puzzle): Card[] => {
    const stmt = db.prepare<Card, number>(
        "SELECT * FROM cards WHERE puzzle_id = ?",
    );

    const cards = stmt.all(puzzle.id);
    if (!cards || cards.length == 0) {
        throw `no cards for puzzle ${puzzle}`;
    }

    try {
        const encodedCards = cards.map((c) => ({
            ...c,
            content: toBase64(c.content),
        }));
        return encodedCards;
    } catch (e) {
        console.error(cards.map((c) => c.content));
        return [];
    }
};

export const findCategoriesForPuzzle = (
    db: Database,
    puzzle: Puzzle,
): Category[] => {
    const stmt = db.prepare<Category, number>(
        "SELECT * FROM categories WHERE puzzle_id = ?",
    );

    const categories = stmt.all(puzzle.id);
    if (!categories || categories.length == 0) {
        throw `no categories for puzzle ${puzzle}`;
    }

    try {
        const encodedCategories = categories.map((c) => ({
            ...c,
            content: toBase64(c.category),
        }));
        return encodedCategories;
    } catch (e) {
        console.error(categories.map((c) => c.category));
        return [];
    }
};
