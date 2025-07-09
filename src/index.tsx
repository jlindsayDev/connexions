// import { CompressionStream } from "@ungap/compression-stream";
import { Database } from "bun:sqlite";
import { Hono } from "hono";
import { Style } from "hono/css";
import { html } from "hono/html";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type * as models from "./models";
import { bodyCss } from "./styles";
import { fromBase64, toBase64 } from "./utils";

const fetchGames = (year: string, month: string): models.GameState[] => {
    const dateStr = `${year}-${month}-%`;

    const DB = new Database("connexions.db", {
        readonly: true,
        strict: true,
    });

    const puzzles = DB.prepare<models.PuzzleModel, string>(
        "SELECT * FROM puzzles WHERE print_date LIKE ?",
    ).all(dateStr);
    const puzzleIdsStr = puzzles.map(({ id }) => id);

    const categories = DB.prepare<models.CategoryModel, number[]>(
        `SELECT * FROM categories WHERE puzzle_id IN (${puzzleIdsStr})`,
    )
        .all()
        .map((c) => ({ ...c, category: toBase64(c.category) }));

    const cards = DB.prepare<models.CardModel, number[]>(
        `SELECT * FROM cards WHERE puzzle_id IN (${puzzleIdsStr})`,
    )
        .all()
        .map((c) => ({ ...c, content: toBase64(c.content) }));

    const categoriesByPuzzleId = Object.groupBy(
        categories,
        ({ puzzle_id }) => puzzle_id,
    );

    const cardsByPuzzleId = Object.groupBy(cards, ({ puzzle_id }) => puzzle_id);

    return puzzles.map((puzzle) => ({
        puzzle,
        categories: categoriesByPuzzleId[puzzle.id]!,
        cards: cardsByPuzzleId[puzzle.id]!,
    }));
};

const app = new Hono()
    .get("/", (c) =>
        c.html(
            <>
                {html`<!DOCTYPE html>`}
                <html lang="en">
                    <head>
                        <meta charSet="utf-8" />
                        <meta
                            content="width=device-width, initial-scale=1"
                            name="viewport"
                        />
                        <Style>{bodyCss}</Style>
                    </head>
                    <body>
                        <div id="root" />
                        <script defer type="module" src="/src/client.tsx" />
                    </body>
                </html>
            </>,
        ),
    )
    .get("/puzzle/:date", async (c) => {
        const date = c.req.param("date");
        const ENCODED_URL =
            "aHR0cHM6Ly93d3cubnl0aW1lcy5jb20vc3ZjL2Nvbm5lY3Rpb25zL3YyLw==";
        const url = `${fromBase64(ENCODED_URL)}${date}.json`;
        const response = await fetch(url);
        return c.json(
            await response.json(),
            response.status as ContentfulStatusCode,
        );
    })
    .get("/calendar/:year/:month", (c) => {
        const year = c.req.param("year");
        const month = c.req.param("month");
        const games = fetchGames(year, month);
        return c.json(games);
    });

export type ApiRoutes = typeof app;
export default app;
