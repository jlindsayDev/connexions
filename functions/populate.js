import { batchedIterator } from "../src/lib/api.js";
import { toBase64 } from "../src/lib/utils.js";

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

const batchInsert = async (db, table, columns, records) => {
  const statements = [];
  query = `INSERT INTO ${table} (${columns.join(", ")})
    VALUES ${placeholders}
    RETURNING id, ${columns.join(", ")}`;

  for (const record of records) {
    statements.push(db.prepare(query).bind(record));
  }
  return await db.batch(statements);
};

export const onRequestGet = async (context) => {
  const dateStr = context.params.date || START_DATE_STR;

  for await (const puzzles of batchedIterator(dateStr, 10)) {
    let records = puzzles.flatMap((p) => [
      p.print_date,
      Number.parseInt(p.id, 10),
    ]);

    const d1Puzzles = await batchInsert(
      context.env.DB,
      "puzzles",
      ["print_date", "nyt_id"],
      records,
    );

    records = puzzles.flatMap((p) => {
      const nytId = Number.parseInt(p.id, 10);
      const puzzle = d1Puzzles.results.find(({ nyt_id }) => nytId === nyt_id);
      return p.categories.flatMap((category, difficulty) => [
        puzzle.id,
        difficulty,
        toBase64(category.title),
      ]);
    });

    const d1Categories = await batchInsert(
      context.env.DB,
      "categories",
      ["puzzle_id", "difficulty", "content"],
      records,
    );

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

    const _d1Cards = await batchInsert(
      context.env.DB,
      "cards",
      ["category_id", "position", "content"],
      records,
    );
  }

  const response = Response.json({ success: true });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
};
