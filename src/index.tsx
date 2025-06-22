import { Database } from "bun:sqlite";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { css, Style } from "hono/css";
import { html } from "hono/html";
import { fetchGameState } from "./db";

export const DB = new Database("connexions.db", {
    readonly: true,
    strict: true,
});

const bodyCss = css`
    body {
        @media (prefers-color-scheme: light) {
            color: black;
            background-color: #CCC;
        }

        @media (prefers-color-scheme: dark) {
            color: #EEE;
            background-color: #222;
        }
    }
`;

const app = new Hono();
app.use("/favicon.ico", serveStatic({ path: "./public/favicon.ico" }));
app.get("/", (c) => {
    const clientScript = import.meta.env["PROD"] ? (
        <script type="module" src="/static/client.js" />
    ) : (
        <script type="module" src="/src/client.tsx" />
    );

    const swScript = import.meta.env["PROD"] ? (
        <script type="module" src="/static/main.js" />
    ) : (
        <script type="module" src="/src/main.tsx" />
    );

    return c.html(
        <>
            {html`<!DOCTYPE html>`}
            <html lang="en">
                <head>
                    <meta charSet="utf-8" />
                    <meta
                        content="width=device-width, initial-scale=1"
                        name="viewport"
                    />
                    {clientScript}
                    {swScript}
                    <Style>{bodyCss}</Style>
                </head>
                <body>
                    <div id="root" />
                </body>
            </html>
        </>,
    );
});

const apiRoutes = app.get("/api/puzzle/:date", async (c) => {
    const date = c.req.param("date");

    try {
        return c.json(fetchGameState(DB, date));
    } catch (e) {
        // const url = `https://www.nytimes.com/svc/connections/v2/${date}.json`;
        // const json = await (await fetch(url)).json();
        // const gameState = parseSourceJson(json);
        return c.json({ ok: false, message: `${e}` }, 404);
    }
});
export type AppType = typeof apiRoutes;

export default app;
