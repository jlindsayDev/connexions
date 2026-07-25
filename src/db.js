import { fromBase64, pad, toBase64 } from "./utils";

const DB_NAME = "PuzzlesDatabase";
const DB_VERSION = 1;

let dbInstance = null;

const getDB = () => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

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
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => reject(event.target.error);
  });
};

const toPromise = (request) => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const fetchDaysDownloaded = async (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const prefix = `${year}-${pad(month + 1)}-`;
  const range = IDBKeyRange.bound(prefix, `${prefix}\uffff`);

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

export const fetchGameState = async ({ puzzle_id, print_date }) => {
  const db = await getDB();
  const tx = db.transaction(["puzzles", "cards", "categories"], "readonly");
  const puzzleStore = tx.objectStore("puzzles");

  let puzzleReq;
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

export const addGameState = async ({ puzzle, cards, categories }) => {
  const validCards = cards && cards.length === 16;
  const validCategories = categories && categories.length === 4;
  const isValid = validCards && validCategories;

  const db = await getDB();
  const tx = db.transaction(["puzzles", "categories", "cards"], "readwrite");

  const puzzle_id = await toPromise(
    tx.objectStore("puzzles").add({
      print_date: puzzle.print_date,
      status: isValid
        ? models.PuzzleStatusEnum.NotAttempted
        : models.PuzzleStatusEnum.Broken,
    }),
  );

  if (!isValid) return puzzle_id;

  const cardMapping = Map.groupBy(cards, ({ category_id }) => category_id);

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    if (!category) {
      continue;
    }

    const category_id = await toPromise(
      tx.objectStore("categories").add({
        puzzle_id,
        difficulty: i,
        title: toBase64(category.title),
      }),
    );

    const catCards = cardMapping.get(category.id) || [];
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
  { id: puzzle_id },
  guess,
  category_id = null,
) => {
  const db = await getDB();
  const tx = db.transaction("guesses", "readwrite");
  const store = tx.objectStore("guesses");

  const guess_id = await toPromise(
    store.add({ puzzle_id, category_id, guess }),
  );
  const guessObj = await toPromise(store.get(guess_id));

  if (!guessObj) throw new Error("Guess was not properly added");
  return guessObj;
};

export const getGuess = async ({ id: puzzle_id }, guess) => {
  const db = await getDB();
  const tx = db.transaction("guesses", "readonly");
  return toPromise(
    tx.objectStore("guesses").index("puzzle_guess").get([puzzle_id, guess]),
  );
};

export const getGuesses = async ({ id: puzzle_id }) => {
  const db = await getDB();
  const tx = db.transaction("guesses", "readonly");
  return toPromise(
    tx.objectStore("guesses").index("puzzle_id").getAll(puzzle_id),
  );
};

export const resetData = async () => {
  if (confirm("Delete all data?")) {
    const db = await getDB();
    const tx = db.transaction(db.objectStoreNames, "readwrite");
    for (let i = 0; i < db.objectStoreNames.length; i++) {
      tx.objectStore(db.objectStoreNames.item(i) ?? "").clear();
    }
  }
};

const exportStores = async (db, storeNames) => {
  const data = {};
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

const download = async (blob, filename, compress = true) => {
  let blobUrl;

  if (compress) {
    const compressedStream = blob
      .stream()
      .pipeThrough(new CompressionStream("gzip"));
    const compressedBlob = await new Response(compressedStream).blob();
    blobUrl = URL.createObjectURL(compressedBlob);
  } else {
    blobUrl = URL.createObjectURL(blob);
  }

  const aElem = document.createElement("a");
  aElem.href = blobUrl;
  aElem.download = filename;
  aElem.type = "application/json";
  document.body.appendChild(aElem);
  aElem.click();
  document.body.removeChild(aElem);
  URL.revokeObjectURL(blobUrl);
};

export const upload = async (blob) => {
  const decompressionStream = blob
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
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

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
