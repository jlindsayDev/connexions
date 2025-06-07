import type { Database } from "bun:sqlite";
import { Dexie, type EntityTable } from "dexie";
import { toBase64 } from "./utils";

enum PuzzleStatus {
    NotAttempted = 0,
    Attempted = 1,
    Solved = 2,
    New = 3,
}

type PuzzleModel = {
    id: number;
    print_date: string;
    status: PuzzleStatus | null;
};

export type CategoryModel = {
    id: number;
    puzzle_id: number;
    difficulty: number;
    category: string;
    hint_card_id: number | null;
};

export type CardModel = {
    id: number;
    puzzle_id: number;
    category_id: number;
    position: number;
    content: string;
};

export type GuessModel = {
    id: number;
    puzzle_id: number;
    guess: string;
};

export type GameState = {
    puzzle: PuzzleModel;
    categories: CategoryModel[];
    cards: CardModel[];
    guesses: GuessModel[];
};

export const fetchGameState = (db: Database, date: string): GameState => {
    let stmt;

    stmt = db.prepare<PuzzleModel, string>(
        "SELECT * FROM puzzles WHERE print_date = ?",
    );

    const puzzle = stmt.get(date);
    if (!puzzle) {
        throw `no puzzle for date ${date}`;
    }

    stmt = db.prepare<CardModel, number>(
        "SELECT * FROM cards WHERE puzzle_id = ?",
    );

    const cards = stmt.all(puzzle.id);
    if (!cards || cards.length == 0) {
        throw `no cards for puzzle ${puzzle.id}`;
    }

    const encodedCards = cards.map((c) => ({
        ...c,
        content: toBase64(c.content),
    }));

    stmt = db.prepare<CategoryModel, number>(
        "SELECT * FROM categories WHERE puzzle_id = ?",
    );

    const categories = stmt.all(puzzle.id);
    if (!categories || categories.length == 0) {
        throw `no categories for puzzle ${puzzle.id}`;
    }

    const encodedCategories = categories.map((c) => ({
        ...c,
        category: toBase64(c.category),
    }));

    return {
        puzzle,
        cards: encodedCards,
        categories: encodedCategories,
        guesses: [],
    };
};

export const INDEXED_DB = new Dexie("PuzzlesDatabase") as Dexie & {
    puzzles: EntityTable<PuzzleModel, "id">;
    cards: EntityTable<CardModel, "id">;
    categories: EntityTable<CategoryModel, "id">;
    guesses: EntityTable<GuessModel, "id">;
};

// Schema declaration:
INDEXED_DB.version(2).stores({
    puzzles: "++id, *print_date",
    categories: "++id, *puzzle_id",
    cards: "++id, *puzzle_id, *category_id",
    guesses: "++id, *puzzle_id",
});

export const getGameState = async (
    DB: typeof INDEXED_DB,
    print_date: string,
): Promise<GameState | null> => {
    const puzzle = await DB.puzzles.get({ print_date });
    if (!puzzle) {
        return null;
    }

    const cards = await DB.cards.where({ puzzle_id: puzzle.id }).toArray();
    const categories = await DB.categories
        .where({ puzzle_id: puzzle.id })
        .toArray();

    const guesses = await DB.guesses.where({ puzzle_id: puzzle.id }).toArray();

    return { puzzle, cards, categories, guesses };
};

export const addGameState = async (
    DB: typeof INDEXED_DB,
    { puzzle, cards, categories, guesses }: GameState,
): Promise<boolean> => {
    const puzzle_id = await DB.puzzles.add({
        ...puzzle,
        status: PuzzleStatus.NotAttempted,
    });

    const cardMapping = Map.groupBy(cards, ({ category_id }) => category_id);

    const categoryRecords = categories.map((c) => ({ ...c, puzzle_id }));

    categoryRecords.forEach(async (category) => {
        const category_id = await DB.categories.add(category);
        const categoryCards =
            cardMapping.get(category.id)?.map((c) => ({
                ...c,
                category_id,
                puzzle_id,
            })) ?? [];
        await DB.cards.bulkAdd(categoryCards);
    });

    await DB.guesses.bulkAdd(guesses);

    return true;
};

export const addGuess = async (
    DB: typeof INDEXED_DB,
    puzzle_id: number,
    guess: string,
): Promise<GuessModel> => {
    const guess_id = await DB.guesses.add({
        puzzle_id,
        guess,
    });
    const guessModel = await DB.guesses.get(guess_id);
    if (!guessModel) {
        throw `Guess somehow did not insert: puzzle_id=${puzzle_id} guess=${guess}`;
    }
    return guessModel;
};

export const getGuesses = async (
    DB: typeof INDEXED_DB,
    { id }: PuzzleModel,
): Promise<GuessModel[]> => {
    return await DB.guesses.where({ puzzle_id: id }).toArray();
    // const guesses = guessPromise.map(
    //     (g) => new Set(g.guess.split(",").map(parseInt)), // Promise<Set<number>[]>
    //     // (g) => g.guess,
    // );
    // return guesses;
};

export const resetData = async (DB: typeof INDEXED_DB): Promise<void> => {
    if (confirm("Delete all data?")) {
        await DB.tables.map((t) => t.clear());
        alert("all done...");
    }
};
