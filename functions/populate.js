import { fromBase64, toBase64 } from "../src/utils.js";

const START_DATE_STR = "2024-04-27"; // "2023-06-12";

export const onRequestOptions = async (_context) => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Max-Age": "86400",
    },
  });
};

const getNextDate = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

const fetchPuzzleFromSource = async (date) => {
  const ENCODED_URL =
    "aHR0cHM6Ly93d3cubnl0aW1lcy5jb20vc3ZjL2Nvbm5lY3Rpb25zL3YyLw==";
  const dateStr = date.toISOString().slice(0, 10);
  const url = `${fromBase64(ENCODED_URL)}${dateStr}.json`;
  const response = await fetch(url);
  console.info(`HTTP GET [${response.status}] ${url}`);
  return await response.json();
};

async function* puzzleIterator(startDateStr) {
  let date = new Date(startDateStr);
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

async function* batched(iterable, size = 5) {
  let items = [];
  while (true) {
    for await (const item of iterable) {
      items.push(item);
      if (items.length >= size) {
        yield items;
        items = [];
      }
    }
    break;
  }

  // while (true) {
  //   const { value, done } = await iter.next();
  //   if (done) {
  //     break;
  //   }

  //   yield async function* () {
  //     yield value;
  //     yield* await iter.take(size - 1);
  //   };
  // }
}

export const onRequestGet = async (context) => {
  const dateStr = context.params.date || START_DATE_STR;

  for await (const puzzles of batched(puzzleIterator(dateStr), 10)) {
    let records;
    let placeholders;

    records = puzzles.flatMap((p) => [p.print_date, Number.parseInt(p.id, 10)]);
    placeholders = Array.from({ length: puzzles.length }, () => "(?, ?)").join(
      ", ",
    );

    const d1Puzzles = await context.env.DB.prepare(
      `
      INSERT INTO puzzles (print_date, nyt_id) VALUES ${placeholders}
      RETURNING id, print_date, nyt_id;`,
    )
      .bind(...records)
      .run();

    records = puzzles.flatMap((p) => {
      const nytId = Number.parseInt(p.id, 10);
      const puzzle = d1Puzzles.results.find(({ nyt_id }) => nytId === nyt_id);
      return p.categories.flatMap((category, difficulty) => [
        puzzle.id,
        difficulty,
        toBase64(category.title),
      ]);
    });
    placeholders = Array.from(
      { length: puzzles.length * 4 },
      () => "(?, ?, ?)",
    ).join(", ");

    const d1Categories = await context.env.DB.prepare(
      `
      INSERT INTO categories (puzzle_id, difficulty, content) VALUES ${placeholders}
      RETURNING id, puzzle_id, difficulty;`,
    )
      .bind(...records)
      .run();

    records = puzzles.flatMap((p) => {
      const nytId = Number.parseInt(p.id, 10);
      const d1Puzzle = d1Puzzles.results.find(({ nyt_id }) => nytId === nyt_id);

      return p.categories.flatMap((category, difficulty) => {
        const d1Category = d1Categories.results.find(
          (c) => c.puzzle_id === d1Puzzle.id && c.difficulty === difficulty,
        );

        return category.cards.flatMap((card) => [
          d1Category.id,
          card.position,
          toBase64(card.content),
        ]);
      });
    });
    placeholders = Array.from(
      { length: puzzles.length * 4 * 4 },
      () => "(?, ?, ?)",
    ).join(", ");

    await context.env.DB.prepare(
      `INSERT INTO cards (category_id, position, content) VALUES ${placeholders};`,
    )
      .bind(...records)
      .run();
  }

  const response = Response.json({ success: true });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
};
