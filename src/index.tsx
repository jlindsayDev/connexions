import { Hono } from "hono";
import { Style } from "hono/css";
import { html } from "hono/html";
import { bodyCss } from "./styles";
import { fromBase64 } from "./utils";

export default new Hono()
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
                        <script type="module" src="/src/client.tsx" />
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
        return c.json(await response.json());
    });
