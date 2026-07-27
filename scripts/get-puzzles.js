import fs from "node:fs/promises";
import process from "node:process";
import { fromBase64, toBase64 } from "../src/utils.js";

const fetchPuzzlesFromSource = async (startDateStr, numDays) => {
  const startDate = new Date(startDateStr);
  const ENCODED_URL =
    "aHR0cHM6Ly93d3cubnl0aW1lcy5jb20vc3ZjL2Nvbm5lY3Rpb25zL3YyLw==";

  const puzzles = [];
  for (let i = 0; i < numDays; ++i) {
    const date = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + 1 + i,
    );
    const dateStr = date.toISOString().slice(0, 10);
    const url = `${fromBase64(ENCODED_URL)}${dateStr}.json`;

    console.info(`HTTP GET ${url}`);
    const responseJson = await (await fetch(url)).json();
    puzzles.push(responseJson);
  }
  return puzzles;
};

const _parseResponseJson = async (json, encrypt = true) => {
  const puzzle = {
    nyt_id: json.id,
    print_date: json.print_date,
  };

  const categories = json.categories.map(({ title, cards }, i) => ({
    difficulty: i,
    title: encrypt ? toBase64(title) : title,
    cards: cards.map(({ position, content }) => ({
      position,
      content: encrypt ? toBase64(content) : content,
    })),
  }));

  return { puzzle, categories };
};

if (process.argv.length < 3) {
  process.stderr.write(
    `Usage: ${process.argv[0]} ${process.argv[1]} outfile startdate numdays`,
  );
  process.exit(2);
}

const outFile = process.argv[2];
const startDate = process.argv[3];
const numDays = Number.parseInt(process.argv[4], 10);

let puzzles;
try {
  puzzles = await fetchPuzzlesFromSource(startDate, numDays);
} catch (err) {
  process.stderr.write("Error occurred fetching puzzles", err);
  process.exit(5);
}

const puzzleValues = puzzles.map(
  (puzzle) => `  ('${puzzle.print_date}', ${Number.parseInt(puzzle.id, 10)})`,
);

const sqlfile = `
PRAGMA defer_foreign_keys = true;
INSERT INTO puzzles (print_date, nyt_id) VALUES
${puzzleValues.join(",\n")}
RETURNING print_date, id;
`;

try {
  await fs.writeFile(outFile, sqlfile);
} catch (err) {
  process.stderr.write(`Error occurred writing to ${outFile}`, err);
}
