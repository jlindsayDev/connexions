import { Hono } from "hono";
import { Style } from "hono/css";
import { html } from "hono/html";
import { bodyCss } from "./styles";

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
                    <Style>{bodyCss}</Style>
                </head>
                <body>
                    <div id="root" />
                    <script type="module" src="/src/client.tsx" />
                </body>
            </html>
        </>,
    ),
);
