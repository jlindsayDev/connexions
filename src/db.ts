import { Dexie, type EntityTable } from "dexie";
import { exportDB, importDB } from "dexie-export-import";
import {
    type CardModel,
    type CategoryModel,
    type GameState,
    type GuessModel,
    type PuzzleModel,
    type PuzzleResponseModel,
    PuzzleStatus,
} from "./models";
import { toBase64 } from "./utils";

const INDEXED_DB = new Dexie("PuzzlesDatabase") as Dexie & {
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
    print_date: string,
): Promise<GameState | null> => {
    const puzzle = await INDEXED_DB.puzzles.get({ print_date });
    if (!puzzle) {
        return null;
    }
    const cards = await INDEXED_DB.cards
        .where({ puzzle_id: puzzle.id })
        .toArray();
    const categories = await INDEXED_DB.categories
        .where({ puzzle_id: puzzle.id })
        .toArray();

    return { puzzle, cards, categories };
};

export const addStateFromJson = async (
    json: PuzzleResponseModel,
): Promise<GameState> => {
    const puzzleAttrs = {
        print_date: json.print_date,
        status: PuzzleStatus.NotAttempted,
    };
    const puzzle_id = await INDEXED_DB.puzzles.add(puzzleAttrs);
    const puzzle: PuzzleModel = { ...puzzleAttrs, id: puzzle_id };

    const categoryPromises = json.categories.map(async (categoryJson, i) => {
        const categoryAttrs = {
            puzzle_id,
            difficulty: i,
            category: toBase64(categoryJson.title),
            hint_card_id: null,
        };
        const category_id = await INDEXED_DB.categories.add(categoryAttrs);
        const category: CategoryModel = { ...categoryAttrs, id: category_id };

        const cardPromises = categoryJson.cards.map(async (cardJson) => {
            const cardAttrs = {
                position: cardJson.position,
                content: toBase64(cardJson.content),
                puzzle_id,
                category_id,
            };
            const card_id = await INDEXED_DB.cards.add(cardAttrs);
            const card: CardModel = { ...cardAttrs, id: card_id };
            return card;
        });

        return { category, cards: await Promise.all(cardPromises) };
    });

    const pairs = await Promise.all(categoryPromises);
    const categories: CategoryModel[] = pairs.map(({ category }) => category);
    const cards: CardModel[] = pairs.flatMap(({ cards }) => cards);

    const gameState: GameState = { puzzle, categories, cards };
    return gameState;
};

export const addGameState = async ({
    puzzle,
    cards,
    categories,
}: GameState): Promise<boolean> => {
    const puzzle_id = await INDEXED_DB.puzzles.add({
        ...puzzle,
        status: PuzzleStatus.NotAttempted,
    });

    const cardMapping = Map.groupBy(cards, ({ category_id }) => category_id);

    const categoryRecords = categories.map((c) => ({ ...c, puzzle_id }));

    categoryRecords.forEach(async (category) => {
        const category_id = await INDEXED_DB.categories.add(category);
        const categoryCards = cardMapping.get(category.id)!.map((c) => ({
            ...c,
            category_id,
            puzzle_id,
        }));
        await INDEXED_DB.cards.bulkAdd(categoryCards);
    });

    return true;
};

export const addGuess = async (
    { id: puzzle_id }: PuzzleModel,
    guess: string,
    category_id: number | null = null,
): Promise<GuessModel> => {
    const guess_id = await INDEXED_DB.guesses.add({
        puzzle_id,
        category_id,
        guess,
    });
    return (await INDEXED_DB.guesses.get(guess_id))!;
};

export const getGuess = async (
    { id: puzzle_id }: PuzzleModel,
    guess: string,
): Promise<GuessModel | undefined> => {
    return await INDEXED_DB.guesses.where({ puzzle_id, guess }).first();
};

export const getGuesses = async ({
    id: puzzle_id,
}: PuzzleModel): Promise<GuessModel[]> => {
    return await INDEXED_DB.guesses.where({ puzzle_id }).toArray();
};

export const resetData = (): void => {
    if (confirm("Delete all data?")) {
        INDEXED_DB.tables.map(async (t) => await t.clear());
    }
};

export const exportData = async () => {
    const dateStr = new Date().toISOString().substring(0, 10);

    let blob = await exportDB(INDEXED_DB, { skipTables: ["guesses"] });
    download(blob, `connexions-${dateStr}.json.gz`);

    blob = await exportDB(INDEXED_DB, {
        skipTables: ["puzzles", "categories", "cards"],
    });
    download(blob, `guesses-${dateStr}.json.gz`);
};

const download = async (blob: Blob, filename: string, compress = true) => {
    let blobUrl: string;

    if (compress) {
        const compressedStream = blob
            .stream()
            .pipeThrough(new CompressionStream("gzip") as ReadableWritablePair);
        const compressedBlob = await new Response(compressedStream).blob();
        blobUrl = URL.createObjectURL(compressedBlob);
    } else {
        blobUrl = URL.createObjectURL(blob);
    }

    const aElem: HTMLAnchorElement = document.createElement("a");
    aElem.href = blobUrl;
    aElem.download = filename;
    aElem.type = "text/json";
    document.body.appendChild(aElem);
    aElem.click();
    document.body.removeChild(aElem);
    URL.revokeObjectURL(blobUrl);
};

export const upload = async (blob: Blob) => {
    const decompressionStream = blob
        .stream()
        .pipeThrough(new DecompressionStream("gzip") as ReadableWritablePair);
    const decompressedBlob = await new Response(decompressionStream).blob();

    importDB(decompressedBlob);
};
