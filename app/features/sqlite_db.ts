import type { Database } from "bun:sqlite";
import type { Card, Category, Puzzle } from "models";

export const findPuzzleByDate = (db: Database, dateStr: string): Puzzle => {
    const stmt = db.prepare<Puzzle, string[]>(
        "SELECT * FROM puzzles WHERE print_date = ?",
    );

    const puzzle = stmt.get(dateStr);
    if (!puzzle) {
        throw `no puzzle for ${dateStr}`;
    }

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

    const encodedCards = cards.map((c) => ({
        ...c,
        content: btoa(c.content),
    }));

    return encodedCards;
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

    const encodedCategories = categories.map((c) => ({
        ...c,
        category: btoa(c.category),
    }));

    return encodedCategories;
};
