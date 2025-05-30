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

const db = new Dexie("PuzzlesDatabase") as Dexie & {
    guesses: EntityTable<Guess, "id">;
    puzzles: EntityTable<Puzzle, "id">;
};

// Schema declaration:
db.version(2).stores({
    guesses: "++id, *print_date, num",
});

const addGuess = async (
    print_date: string,
    num: number,
    guess: Set<number>,
) => {
    const guessStr = guess.values().toArray().join(",");
    await db.guesses.add({ print_date, num, guess: guessStr });
};

const getGuesses = async (print_date: string): Promise<string[]> => {
    const guessPromise = await db.guesses.where({ print_date }).toArray();
    const guesses = guessPromise.map(
        // (g) => new Set(g.guess.split(",").map(parseInt)), // Promise<Set<number>[]>
        (g) => g.guess,
    );
    return guesses;
};

export { addGuess, db, getGuesses };
export type { Guess, Puzzle, PuzzleStatus };
