import { Database } from "bun:sqlite";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { Style } from "hono/css";
import { html } from "hono/html";
import { fetchPuzzle } from "./db";

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

    try {
        return c.json(fetchPuzzle(DB, date));
    } catch (e) {
        return c.json({ ok: false, message: `${e}` }, 404);
    }
});

app.use("/favicon.ico", serveStatic({ path: "./public/favicon.ico" }));

export type AppType = typeof routes;

export default app;
