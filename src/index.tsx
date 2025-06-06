import { Database } from "bun:sqlite";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { Style } from "hono/css";
import { html } from "hono/html";
import {
    findCardsForPuzzle,
    findCategoriesForPuzzle,
    findPuzzleByDate,
} from "./features/sqlite";

const app = new Hono();

export const DB = new Database("connections.db", {
    readonly: true,
    strict: true,
});

app.get("/", (c) => {
    const clientScript = import.meta.env["PROD"] ? (
        <script type="module" src="/static/client.js" />
    ) : (
        <script type="module" src="/src/client.tsx" />
    );

    return c.html(html`
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    content="width=device-width, initial-scale=1"
                    name="viewport"
                />
                ${clientScript}
                ${<Style />}
            </head>
            <body>
                <div id="root" />
            </body>
        </html>`);
});

const routes = app.get("/api/puzzle/:date", (c) => {
    const date = c.req.param("date");

    const puzzle = findPuzzleByDate(DB, date);
    if (!puzzle) {
        return c.json({ ok: false, message: "nope" }, 404);
    }
    const cards = findCardsForPuzzle(DB, puzzle);
    const categories = findCategoriesForPuzzle(DB, puzzle);

    return c.json({ puzzle, cards, categories });
});

app.use("/favicon.ico", serveStatic({ path: "./public/favicon.ico" }));

export type AppType = typeof routes;

export default app;

// IF I WANT TO REVERT TO A FULL-STACK APP

// interface LayoutProps extends PropsWithChildren {
//     title: string;
// }

// const Layout: FC<LayoutProps> = ({ title, children }) => (
//     <>
//         {html`<!doctype html>`}
//         <html lang="en">
//             <head>
//                 <meta charset="UTF-8" />
//                 <meta
//                     name="viewport"
//                     content="width=device-width, initial-scale=1.0"
//                 />
//                 <title>{title}</title>
//                 <link rel="stylesheet" href="src/style.css" />
//             </head>
//             <body>{children}</body>
//         </html>
//     </>
// );

// app.get("/", (c) => {
//     const date = new Date();
//     const calendar = (
//         <Calendar month={date.getMonth()} year={date.getFullYear()} />
//     );

//     return c.render(<Layout title={"Puzzle Explorer"}>{calendar}</Layout>);
// });

// app.get("/puzzle/:date", (c) => {
//     const { date } = c.req.param<"/:date">();

//     const dateObj = new Date(date);
//     const prevDateStr = new Date(dateObj.getFullYear(), dateObj.getMonth() - 1)
//         .toISOString()
//         .substring(0, 10);
//     const nextDateStr = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1)
//         .toISOString()
//         .substring(0, 10);

//     const db = new Database("connections.db");
//     const puzzle = findPuzzleByDate(db, date);
//     const cards = findCardsForPuzzle(db, puzzle);
//     const categories = findCategoriesForPuzzle(db, puzzle);

//     return c.render(
//         <Layout title={date}>
//             <h1>Puzzle {puzzle.id}</h1>

//             <nav>
//                 <a href={`/puzzle/${prevDateStr}`} rel="prev">
//                     &larr;
//                 </a>

//                 <span class="date">{puzzle.print_date}</span>

//                 <a href={`/puzzle/${nextDateStr}`} rel="next">
//                     &rarr;
//                 </a>
//             </nav>

//             <Puzzle
//                 date={puzzle.print_date}
//                 guesses={[]}
//                 cards={cards}
//                 categories={categories}
//             />
//         </Layout>,
//     );
// });

// RANDOM UTILITY FUNCTION

// export const partition = (
//     arr: Array<any>,
//     partitionFn: (arg0: any) => boolean,
// ) =>
//     arr.reduce(
//         (acc, v) => {
//             acc[partitionFn(v) ? 0 : 1].push(v);
//             return acc;
//         },
//         [[], []],
//     );
