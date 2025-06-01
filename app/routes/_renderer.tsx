import { css, Style } from "hono/css";
import { StrictMode } from "hono/jsx";
import { jsxRenderer } from "hono/jsx-renderer";
import { Link, Script } from "honox/server";

const bodyClass = css`
    background-color: rgb(229 231 235);
`;

export default jsxRenderer(({ children }) => (
    <StrictMode>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <Link href="/app/style.css" rel="stylesheet" />
                <Style />
                <Script src="/app/client.ts" />
                {/* {title ? <title>{title}</title> : <></>} */}
            </head>
            <body class={bodyClass}>
                <main>{children}</main>
            </body>
        </html>
    </StrictMode>
));
