import fs from "node:fs/promises";
import process from "node:process";
import { fetchPuzzlesFromSource } from "../src/api.js";
import { toBase64 } from "../src/utils.js";

if (process.argv.length < 3) {
  process.stderr.write(
    `Usage: ${process.argv[0]} ${process.argv[1]} outfile startdate numdays`,
  );
  process.exit(2);
}

const outFile = process.argv[2];
const startDate = process.argv[3];
const numDays = Number.parseInt(process.argv[4], 10);

const puzzleValues = [];
const categoryValues = [];
const cardValues = [];

let fields;

let puzzlesFromJson;
try {
  puzzlesFromJson = await fetchPuzzlesFromSource(startDate, numDays);
} catch (err) {
  process.stderr.write("Error occurred fetching puzzles", err);
  process.exit(5);
}

for (const puzzle of puzzlesFromJson) {
  fields = [`'${puzzle.print_date}'`, Number.parseInt(puzzle.id, 10)];
  puzzleValues.push(`(${fields.join(", ")})`);

  const tempPuzzleId = Date.parse(puzzle.print_date);
  for (const difficulty in puzzle.categories) {
    const category = puzzle.categories[difficulty];
    fields = [tempPuzzleId, difficulty, `'${toBase64(category.title)}'`];
    categoryValues.push(`(${fields.join(", ")})`);

    const tempCategoryId = Number.parseInt(`${tempPuzzleId}${difficulty}`, 10);
    for (const card of category.cards) {
      fields = [
        tempPuzzleId,
        tempCategoryId,
        card.position,
        `'${toBase64(card.content)}'`,
      ];
      cardValues.push(`(${fields.join(", ")})`);
    }
  }
}

const sql = `
  PRAGMA defer_foreign_keys = true;

  INSERT INTO puzzles (print_date, nyt_id) VALUES
    ${puzzleValues.join(",\n    ")}
  RETURNING id, print_date;

  INSERT INTO categories (puzzle_id, difficulty, content) VALUES
    ${categoryValues.join(",\n    ")}
  RETURNING id, puzzle_id, difficulty;

  INSERT INTO cards (puzzle_id, category_id, position, content) VALUES
    ${cardValues.join(",\n    ")}
  RETURNING id, puzzle_id, category_id, position;
`;

try {
  await fs.writeFile(outFile, sql);
} catch (err) {
  process.stderr.write(`Error occurred writing SQL to ${outFile}`, err);
  process.exit(13);
}

console.info(`Wrote ${puzzleValues.length} puzzles`);
console.info(`Wrote ${categoryValues.length} categories`);
console.info(`Wrote ${cardValues.length} cards`);
