import { html } from "hono/html";
import type { FC, PropsWithChildren } from "hono/jsx";

interface LayoutProps extends PropsWithChildren {
    title: string;
    clientScript: string;
}

const Layout: FC<LayoutProps> = ({ title, children, clientScript }) => {
    const prodScript = import.meta.env["PROD"] ? (
        <script type="module" src="/static/client.js" />
    ) : (
        <script type="module" src="/src/client.tsx" />
    );
    const clientBody = clientScript ? (
        prodScript
    ) : (
        <>
            <title>{title}</title>
            <link rel="stylesheet" href="src/style.css" />
        </>
    );
    return (
        <>
            {html`<!doctype html>`}
            <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1.0"
                    />
                    {clientBody}
                </head>
                <body>{children ?? <div id="root" />}</body>
            </html>
        </>
    );
};

export default Layout;
