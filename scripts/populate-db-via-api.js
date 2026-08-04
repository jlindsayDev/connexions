import process from "node:process";
import { fromBase64, toBase64 } from "../src/utils.js";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!ACCOUNT_ID) {
  process.stderr.write("Missing Cloudflare account ID in env vars");
  process.exit(1);
}
if (!DATABASE_ID) {
  process.stderr.write("Missing Cloudflare database ID in env vars");
  process.exit(2);
}
if (!API_TOKEN) {
  process.stderr.write("Missing Cloudflare API token in env vars");
  process.exit(3);
}

const D1_API_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;
const FIRST_DATE = "2023-06-12";

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

const getNextDate = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

const fetchPuzzleFromSource = async (date) => {
  const ENCODED_URL =
    "aHR0cHM6Ly93d3cubnl0aW1lcy5jb20vc3ZjL2Nvbm5lY3Rpb25zL3YyLw==";
  const dateStr = date.toISOString().slice(0, 10);
  const url = `${fromBase64(ENCODED_URL)}${dateStr}.json`;
  console.info(`HTTP GET ${url}`);
  return await (await fetch(url)).json();
};

async function* puzzleIterator(startDate) {
  let date = startDate;
  while (true) {
    try {
      yield await fetchPuzzleFromSource(date);
    } catch (err) {
      const dateStr = date.toISOString().slice(0, 10);
      process.stderr.write(`Error occurred fetching date ${dateStr}`, err);
      return;
    }
    date = getNextDate(date);
  }
}

let startDate = FIRST_DATE;
if (process.argv[2]) {
  startDate = new Date(process.argv[2]);
}

const puzzleIter = puzzleIterator(startDate);
for (const puzzle of puzzleIter) {
  const d1Puzzle = await executeD1(
    "INSERT INTO puzzles (print_date, nyt_id) VALUES (?, ?) RETURNING id;",
    [puzzle.print_date, Number.parseInt(puzzle.id, 10)],
  );
  const puzzleId = d1Puzzle[0].id;

  const puzzleCategories = puzzle.categories.map((category, difficulty) => [
    puzzleId,
    difficulty,
    toBase64(category.title),
  ]);

  let placeholders;
  placeholders = puzzleCategories.map((_) => "(?, ?, ?)").join(", ");
  const d1Categories = await executeD1(
    `INSERT INTO categories (puzzle_id, difficulty, content) VALUES ${categoryPlaceholders} RETURNING id;`,
    puzzleCategories,
  );

  const puzzleCards = puzzle.categories.flatMap(({ cards }, i) =>
    cards.map((card) => [
      d1Categories[i].id,
      card.position,
      toBase64(card.content),
    ]),
  );

  placeholders = puzzleCards.map((_) => "(?, ?, ?)").join(", ");
  const _d1Cards = await executeD1(
    `INSERT INTO cards (category_id, position, content) VALUES ${placeholders};`,
    puzzleCards,
  );
}
