import { fromBase64, getNextDate, toBase64 } from "./utils.js";

export const fetchPuzzleFromSource = async (dateStr) => {
  const ENCODED_URL =
    "aHR0cHM6Ly93d3cubnl0aW1lcy5jb20vc3ZjL2Nvbm5lY3Rpb25zL3YyLw==";
  const url = `${fromBase64(ENCODED_URL)}${dateStr}.json`;
  const response = await fetch(url);
  console.info(`HTTP GET [${response.status}] ${url}`);
  return await response.json();
};

export const fetchPuzzlesFromSource = async (startDateStr, numDays) => {
  const startDate = new Date(startDateStr);

  const puzzles = [];
  for (let i = 0; i < numDays; ++i) {
    const dateStr = getNextDate(startDate, i).toISOString().slice(0, 10);
    const responseJson = await fetchPuzzleFromSource(dateStr);
    puzzles.push(responseJson);
  }
  return puzzles;
};

async function* puzzleIterator(startDate) {
  for (let date = startDate; ; date = getNextDate(date)) {
    const dateStr = date.toISOString().slice(0, 10);
    try {
      yield await fetchPuzzleFromSource(dateStr);
    } catch (err) {
      process.stderr.write(`Error occurred fetching date ${dateStr}`, err);
      return;
    }
  }
}

export function* batchedIterator(startDate, batchSize = 10) {
  const iter = puzzleIterator(startDate);
  while (true) {
    yield iter.take(batchSize);
  }
}

export const insertPuzzles = async (db, puzzles) => {
  const d1Puzzles = await bulkInsert(
    db,
    "puzzles",
    ["print_date", "source_id"],
    puzzles.map(({ print_date, source_id }) => [
      print_date,
      Number.parseInt(source_id, 10),
    ]),
  );

  const d1Categories = await bulkInsert(
    db,
    "categories",
    ["puzzle_id", "difficulty", "title"],
    puzzles.flatMap(({ source_id, categories }) => {
      const sourceId = Number.parseInt(source_id, 10);
      const puzzle = d1Puzzles.results.find(
        ({ source_id }) => sourceId === source_id,
      );
      return categories.map((category, difficulty) => [
        puzzle.id,
        difficulty,
        toBase64(category.title),
      ]);
    }),
  );

  const d1Cards = await bulkInsert(
    db,
    "cards",
    ["category_id", "position", "content"],
    puzzles.flatMap(({ source_id, categories }) => {
      const sourceId = Number.parseInt(source_id, 10);
      const d1Puzzle = d1Puzzles.results.find(
        ({ source_id }) => sourceId === source_id,
      );

      return categories.flatMap(({ difficulty, cards }) => {
        const d1Category = d1Categories.results.find(
          (c) => c.puzzle_id === d1Puzzle.id && c.difficulty === difficulty,
        );

        return cards.map((card) => [
          d1Category.id,
          card.position,
          toBase64(card.content),
        ]);
      });
    }),
  );

  return { puzzles: d1Puzzles, categories: d1Categories, cards: d1Cards };
};

const executeD1 = async (sql, params = []) => {
  const response = await fetch(D1_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(`D1 Query Failed: ${JSON.stringify(data)}`);
  }
  return data.result[0].results;
};

const bulkInsert = async (db, table, columns, records) => {
  const binding = `(${columns.map(() => "?").join(", ")})`;
  const recordPlaceholders = records.map(() => binding).join(", ");
  const query = `
    INSERT INTO ${table} (${columns.join(", ")})
    VALUES ${recordPlaceholders}
    RETURNING id, ${columns.join(", ")}`;
  return await db
    .prepare(query)
    .bind(...records.flat())
    .run();
};

const batchInsert = async (db, table, columns, records) => {
  const placeholders = columns.map(() => "?").join(", ");
  const statements = [];
  query = `
    INSERT INTO ${table} (${columns.join(", ")})
    VALUES ${placeholders}
    RETURNING id, ${columns.join(", ")}`;
  for (const record of records) {
    statements.push(db.prepare(query).bind(record));
  }
  return await db.batch(statements);
};
