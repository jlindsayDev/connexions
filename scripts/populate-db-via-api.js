import process from "node:process";
import { batchedIterator } from "../src/lib/api.js";
import { toBase64 } from "../src/lib/utils.js";

const req = (envvar, name) => {
  if (!envvar) {
    process.stderr.write(`Environment variable ${name} not set`);
    process.exit(1);
  }
  return envvar;
};

const ACCOUNT_ID = req(
  process.env.CLOUDFLARE_ACCOUNT_ID,
  "CLOUDFLARE_ACCOUNT_ID",
);
const DATABASE_ID = req(
  process.env.CLOUDFLARE_DATABASE_ID,
  "CLOUDFLARE_DATABASE_ID",
);
const API_TOKEN = req(process.env.CLOUDFLARE_API_TOKEN, "CLOUDFLARE_API_TOKEN");
const D1_API_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;

let startDate = "2023-06-12";
if (process.argv[2]) {
  startDate = new Date(process.argv[2]);
}

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

const insertPuzzles = async (puzzles) => {
  let records = puzzles.map((p) => [p.print_date, Number.parseInt(p.id, 10)]);
  let placeholders = records.map(() => "(?, ?)").join(", ");

  const d1Puzzles = await executeD1(
    `INSERT INTO puzzles (print_date, source_id)
    VALUES ${placeholders}
    RETURNING id, print_date, source_id;`,
    records,
  );

  records = puzzles.flatMap((p) => {
    const sourceId = Number.parseInt(p.id, 10);
    const puzzleId = d1Puzzles.find(({ source_id }) => sourceId === source_id);
    return p.categories.map((category, difficulty) => [
      puzzleId,
      difficulty,
      toBase64(category.title),
    ]);
  });
  placeholders = records.map((_) => "(?, ?, ?)").join(", ");

  const d1Categories = await executeD1(
    `INSERT INTO categories (puzzle_id, difficulty, content)
    VALUES ${categoryPlaceholders}
    RETURNING id, puzzle_id, difficulty;`,
    records,
  );

  records = puzzles
    .map((p) => {
      const sourceId = Number.parseInt(p.id, 10);
      const puzzleId = d1Puzzles.find(
        ({ source_id }) => sourceId === source_id,
      );
      return [puzzleId, p.categories];
    })
    .flatMap((puzzleId, { cards }, i) => {
      const category = d1Categories.find(
        (c) => c.puzzle_id === puzzleId && c.difficulty === i,
      );
      return cards.map((card) => [
        category.id,
        card.position,
        toBase64(card.content),
      ]);
    });
  placeholders = records.map((_) => "(?, ?, ?)").join(", ");

  const d1Cards = await executeD1(
    `INSERT INTO cards (category_id, position, content) VALUES ${placeholders};`,
    puzzleCards,
  );

  return { puzzles: d1Puzzles, categories: d1Categories, cards: d1Cards };
};

for (const puzzles of batchedIterator(startDate)) {
  insertPuzzles(puzzles);
}
