import * as models from "./models";
import { fromBase64, pad, toBase64 } from "./utils";

const DB_NAME = "PuzzlesDatabase";
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

const getDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("puzzles")) {
        const store = db.createObjectStore("puzzles", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("print_date", "print_date", { unique: true });
      }
      if (!db.objectStoreNames.contains("categories")) {
        const store = db.createObjectStore("categories", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("puzzle_id", "puzzle_id", { unique: false });
      }
      if (!db.objectStoreNames.contains("cards")) {
        const store = db.createObjectStore("cards", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("puzzle_id", "puzzle_id", { unique: false });
        store.createIndex("category_id", "category_id", { unique: false });
      }
      if (!db.objectStoreNames.contains("guesses")) {
        const store = db.createObjectStore("guesses", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("puzzle_id", "puzzle_id", { unique: false });
        store.createIndex("puzzle_guess", ["puzzle_id", "guess"], {
          unique: false,
        });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) =>
      reject((event.target as IDBOpenDBRequest).error);
  });
};

const toPromise = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const fetchDaysDownloaded = async (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const prefix = `${year}-${pad(month + 1)}-`;
  const range = IDBKeyRange.bound(prefix, prefix + "\uffff");

  const db = await getDB();
  const tx = db.transaction("puzzles", "readonly");
  const puzzles = await toPromise(
    tx.objectStore("puzzles").index("print_date").getAll(range),
  );

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
  const db = await getDB();
  const tx = db.transaction(["puzzles", "cards", "categories"], "readonly");
  const puzzleStore = tx.objectStore("puzzles");

  let puzzleReq: IDBRequest;
  if (puzzle_id !== undefined) {
    puzzleReq = puzzleStore.get(puzzle_id);
  } else if (print_date !== undefined) {
    puzzleReq = puzzleStore.index("print_date").get(print_date);
  } else {
    return null;
  }

  const puzzle = await toPromise(puzzleReq);
  if (!puzzle) return null;

  const cards = await toPromise(
    tx.objectStore("cards").index("puzzle_id").getAll(puzzle.id),
  );
  const categories = await toPromise(
    tx.objectStore("categories").index("puzzle_id").getAll(puzzle.id),
  );

  const decodedCards = cards.map((c: any) => ({
    ...c,
    content: fromBase64(c.content),
  }));
  const decodedCategories = categories.map((c: any) => ({
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

  const db = await getDB();
  const tx = db.transaction(["puzzles", "categories", "cards"], "readwrite");

  const puzzle_id = (await toPromise(
    tx.objectStore("puzzles").add({
      print_date: puzzle.print_date,
      status: isValid
        ? models.PuzzleStatusEnum.NotAttempted
        : models.PuzzleStatusEnum.Broken,
    }),
  )) as number;

  if (!isValid) return puzzle_id;

  const cardMapping = Map.groupBy(cards, ({ category_id }) => category_id);

  for (let i = 0; i < categories.length; i++) {
    const category_id = (await toPromise(
      tx.objectStore("categories").add({
        puzzle_id,
        difficulty: i,
        title: toBase64(categories[i].title),
      }),
    )) as number;

    const catCards = cardMapping.get(categories[i].id) || [];
    for (const card of catCards) {
      await toPromise(
        tx.objectStore("cards").add({
          position: card.position,
          content: toBase64(card.content),
          category_id,
          puzzle_id,
        }),
      );
    }
  }

  return puzzle_id;
};

export const addGuess = async (
  { id: puzzle_id }: models.PuzzleModel,
  guess: string,
  category_id: number | null = null,
): Promise<models.GuessModel> => {
  const db = await getDB();
  const tx = db.transaction("guesses", "readwrite");
  const store = tx.objectStore("guesses");

  const guess_id = (await toPromise(
    store.add({ puzzle_id, category_id, guess }),
  )) as number;
  const guessObj = await toPromise(store.get(guess_id));

  if (!guessObj) throw new Error("Guess was not properly added");
  return guessObj;
};

export const getGuess = async (
  { id: puzzle_id }: models.PuzzleModel,
  guess: string,
): Promise<models.GuessModel | undefined> => {
  const db = await getDB();
  const tx = db.transaction("guesses", "readonly");
  return toPromise(
    tx.objectStore("guesses").index("puzzle_guess").get([puzzle_id, guess]),
  );
};

export const getGuesses = async ({
  id: puzzle_id,
}: models.PuzzleModel): Promise<models.GuessModel[]> => {
  const db = await getDB();
  const tx = db.transaction("guesses", "readonly");
  return toPromise(
    tx.objectStore("guesses").index("puzzle_id").getAll(puzzle_id),
  );
};

export const resetData = async (): Promise<void> => {
  if (confirm("Delete all data?")) {
    const db = await getDB();
    const tx = db.transaction(db.objectStoreNames, "readwrite");
    for (let i = 0; i < db.objectStoreNames.length; i++) {
      tx.objectStore(db.objectStoreNames[i]).clear();
    }
  }
};

const exportStores = async (db: IDBDatabase, storeNames: string[]) => {
  const data: Record<string, any[]> = {};
  const tx = db.transaction(storeNames, "readonly");
  for (const name of storeNames) {
    data[name] = await toPromise(tx.objectStore(name).getAll());
  }
  return JSON.stringify(data);
};

export const exportData = async () => {
  const dateStr = new Date().toISOString().substring(0, 10);
  const db = await getDB();

  const mainData = await exportStores(db, ["puzzles", "categories", "cards"]);
  const mainBlob = new Blob([mainData], { type: "application/json" });
  await download(mainBlob, `connexions-${dateStr}.idb.json.gz`);

  const guessData = await exportStores(db, ["guesses"]);
  const guessBlob = new Blob([guessData], { type: "application/json" });
  await download(guessBlob, `guesses-${dateStr}.idb.json.gz`);
};

const download = async (blob: Blob, filename: string, compress = true) => {
  let blobUrl: string;

  if (compress) {
    const compressedStream = blob
      .stream()
      .pipeThrough(
        new CompressionStream("gzip") as unknown as ReadableWritablePair,
      );
    const compressedBlob = await new Response(compressedStream).blob();
    blobUrl = URL.createObjectURL(compressedBlob);
  } else {
    blobUrl = URL.createObjectURL(blob);
  }

  const aElem: HTMLAnchorElement = document.createElement("a");
  aElem.href = blobUrl;
  aElem.download = filename;
  aElem.type = "application/json";
  document.body.appendChild(aElem);
  aElem.click();
  document.body.removeChild(aElem);
  URL.revokeObjectURL(blobUrl);
};

export const upload = async (blob: Blob) => {
  const decompressionStream = blob
    .stream()
    .pipeThrough(
      new DecompressionStream("gzip") as unknown as ReadableWritablePair,
    );
  const decompressedBlob = await new Response(decompressionStream).blob();
  const text = await decompressedBlob.text();
  const data = JSON.parse(text);

  const db = await getDB();
  const storeNames = Object.keys(data).filter((name) =>
    db.objectStoreNames.contains(name),
  );

  if (storeNames.length === 0) return;

  const tx = db.transaction(storeNames, "readwrite");
  for (const storeName of storeNames) {
    const store = tx.objectStore(storeName);
    for (const item of data[storeName]) {
      store.put(item);
    }
  }

  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
