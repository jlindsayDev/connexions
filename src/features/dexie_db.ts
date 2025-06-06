import { Dexie, type EntityTable } from "dexie";

interface Guess {
    id: number;
    print_date: string;
    num: number;
    guess: string;
}

enum PuzzleStatus {
    NotAttempted = 0,
    Attempted = 1,
    Solved = 2,
    New = 3,
}

interface Puzzle {
    id: number;
    print_date: string;
    status: PuzzleStatus;
}

const INDEXED_DB = new Dexie("PuzzlesDatabase") as Dexie & {
    guesses: EntityTable<Guess, "id">;
    puzzles: EntityTable<Puzzle, "id">;
};

// Schema declaration:
INDEXED_DB.version(2).stores({
    guesses: "++id, *print_date, num",
});

export { INDEXED_DB };

export type { Guess, Puzzle, PuzzleStatus };
