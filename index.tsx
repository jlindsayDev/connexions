import { Hono } from "hono";
import { Style } from "hono/css";
import { html } from "hono/html";
import { bodyCss } from "./src/styles";

const swPath = "/sw.ts";
const swScope = "/";
const swScript = html`
    <script type="text/javascript">
        if ("serviceWorker" in navigator) {
            const sw = navigator.serviceWorker;
            window.addEventListener("load", async () => {
                (await sw.getRegistrations()).forEach((r) => r.unregister());
                await sw.register("${swPath}", {scope: "${swScope}", type: "module"});
            });
        }
    </script>
`;
const clientScriptPath = "./client.tsx";

export default new Hono().get("/", (c) =>
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
                    {/* <link rel="manifest" href="manifest.json" /> */}
                    <script type="module" src={clientScriptPath} />
                    <Style>{bodyCss}</Style>
                </head>
                <body>
                    <div id="root" />
                    {swScript}
                </body>
            </html>
        </>,
    ),
);

// export default app;

// export const DB = new Database("connexions.db", {
//     readonly: true,
//     strict: true,
// });

// const apiRoutes = app.get("/api/puzzle/:date", async (c) => {
//     const date = c.req.param("date");

//     try {
//         return c.json(fetchGameState(DB, date));
//     } catch (e) {
//         // const url = `https://www.nytimes.com/svc/connections/v2/${date}.json`;
//         // const json = await (await fetch(url)).json();
//         // const gameState = parseSourceJson(json);
//         return c.json({ ok: false, message: `${e}` }, 404);
//     }
// });
// export type AppType = typeof apiRoutes;
