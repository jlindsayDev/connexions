import { Dexie, type EntityTable } from "dexie";
import dexieCloud from "dexie-cloud-addon";
import { exportDB, importDB } from "dexie-export-import";

import * as models from "./models";

import { fromBase64, pad, toBase64 } from "./utils";

const INDEXED_DB = new Dexie("PuzzlesDatabase", {
  addons: [dexieCloud],
}) as Dexie & {
  puzzles: EntityTable<models.PuzzleModel, "id">;
  cards: EntityTable<models.CardModel, "id">;
  categories: EntityTable<models.CategoryModel, "id">;
  guesses: EntityTable<models.GuessModel, "id">;
};

// https://dexie.org/docs/Version/Version.stores()#detailed-schema-syntax
INDEXED_DB.version(1).stores({
  puzzles: "++id, &print_date",
  categories: "++id, puzzle_id",
  cards: "++id, puzzle_id, category_id",
  guesses: "++id, puzzle_id",
});

INDEXED_DB.cloud.configure({
  databaseUrl: "https://zvi8bk2b6.dexie.cloud",
  requireAuth: true, // optional
});

export const fetchDaysDownloaded = async (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const puzzles = await INDEXED_DB.puzzles
    .where("print_date")
    .startsWith(`${year}-${pad(month + 1)}-`)
    .toArray();
  const days = puzzles.map(({ print_date, status }) => [
    Number.parseInt(print_date.substring(8), 10),
    status,
  ]);
  return Object.fromEntries(days);
};

export const fetchGameState = async ({
  puzzle_id,
  print_date,
}: {
  puzzle_id?: number;
  print_date?: string;
}): Promise<models.GameState | null> => {
  const puzzle = await (puzzle_id
    ? INDEXED_DB.puzzles.get(puzzle_id)
    : INDEXED_DB.puzzles.get({ print_date }));
  if (!puzzle) {
    return null;
  }

  const cards = await INDEXED_DB.cards
    .where({ puzzle_id: puzzle.id })
    .toArray();
  const categories = await INDEXED_DB.categories
    .where({ puzzle_id: puzzle.id })
    .toArray();

  const decodedCards = cards.map((c) => ({
    ...c,
    content: fromBase64(c.content),
  }));
  const decodedCategories = categories.map((c) => ({
    ...c,
    title: fromBase64(c.title),
  }));

  return { puzzle, cards: decodedCards, categories: decodedCategories };
};

export const addGameState = async ({
  puzzle,
  cards,
  categories,
}: models.GameState): Promise<number> => {
  const validCards = cards && cards.length === 16;
  const validCategories = categories && categories.length === 4;
  const isValid = validCards && validCategories;

  const puzzle_id = await INDEXED_DB.puzzles.add({
    print_date: puzzle.print_date,
    status: isValid
      ? models.PuzzleStatusEnum.NotAttempted
      : models.PuzzleStatusEnum.Broken,
  });

  if (!isValid) {
    return puzzle_id;
  }

  const cardMapping = Map.groupBy(cards, ({ category_id }) => category_id);

  const categoryPromises = categories.map(async ({ title, id }, i) => {
    const category_id = await INDEXED_DB.categories.add({
      puzzle_id,
      difficulty: i,
      title: toBase64(title),
    });
    const cards = cardMapping.get(id) || [];
    const categoryCards = cards.map(({ position, content }) => ({
      position,
      content: toBase64(content),
      category_id,
      puzzle_id,
    }));

    await INDEXED_DB.cards.bulkAdd(categoryCards, { allKeys: true });
  });

  // block on promises
  await Promise.all(categoryPromises);

  return puzzle_id;
};

export const addGuess = async (
  { id: puzzle_id }: models.PuzzleModel,
  guess: string,
  category_id: number | null = null,
): Promise<models.GuessModel> => {
  const guess_id = await INDEXED_DB.guesses.add({
    puzzle_id,
    category_id,
    guess,
  });
  const guessObj = await INDEXED_DB.guesses.get(guess_id);
  if (!guessObj) {
    throw new Error("Guess was not properly added");
  }
  return guessObj;
};

export const getGuess = async (
  { id: puzzle_id }: models.PuzzleModel,
  guess: string,
): Promise<models.GuessModel | undefined> => {
  return await INDEXED_DB.guesses.where({ puzzle_id, guess }).first();
};

export const getGuesses = async ({
  id: puzzle_id,
}: models.PuzzleModel): Promise<models.GuessModel[]> => {
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
  download(blob, `connexions-${dateStr}.dexie.json.gz`);

  blob = await exportDB(INDEXED_DB, {
    skipTables: ["puzzles", "categories", "cards"],
  });
  download(blob, `guesses-${dateStr}.dexie.json.gz`);
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
