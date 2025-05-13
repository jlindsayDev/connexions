// app/routes/_renderer.tsx
import { jsxRenderer } from "hono/jsx-renderer";
import { Link, Script } from "honox/server";

export default jsxRenderer(({ children, title }) => {
    return (
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <Link href="/app/style.css" rel="stylesheet" />
                <Script src="/app/client.ts" />
                {title ? <title>{title}</title> : <></>}
            </head>
            <body>{children}</body>
        </html>
    );
});
