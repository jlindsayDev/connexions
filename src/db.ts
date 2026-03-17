import { Dexie, type EntityTable } from "dexie";
import dexieCloud from "dexie-cloud-addon";

import type {
  PuzzleModel,
  CardModel,
  CategoryModel,
  GuessModel,
  GameState,
} from "./models";

import { fromBase64, pad, toBase64 } from "./utils";
import { PuzzleStatusEnum } from "./models";

const INDEXED_DB = new Dexie("PuzzlesDatabase", {
  addons: [dexieCloud],
}) as Dexie & {
  puzzles: EntityTable<PuzzleModel, "id">;
  cards: EntityTable<CardModel, "id">;
  categories: EntityTable<CategoryModel, "id">;
  guesses: EntityTable<GuessModel, "id">;
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
}): Promise<GameState | null> => {
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
}: GameState): Promise<number> => {
  const isValid =
    cards && cards.length == 16 && categories && categories.length == 4;
  const puzzle_id = await INDEXED_DB.puzzles.add({
    print_date: puzzle.print_date,
    status: isValid ? PuzzleStatusEnum.NotAttempted : PuzzleStatusEnum.Broken,
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
    const categoryCards = cardMapping.get(id)!.map(({ position, content }) => ({
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
