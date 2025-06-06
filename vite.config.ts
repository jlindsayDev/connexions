// Change the import to use your runtime specific build
import build from "@hono/vite-build/bun";
import devServer from "@hono/vite-dev-server";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
    // https://github.com/honojs/examples/blob/main/hono-vite-jsx/vite.config.ts
    if (mode === "client") {
        return {
            esbuild: {
                jsxImportSource: "hono/jsx/dom", // Optimized for hono/jsx/dom
            },
            build: {
                rollupOptions: {
                    input: "./src/client.tsx",
                    output: {
                        entryFileNames: "static/client.js",
                    },
                },
            },
        };
    }

    return {
        server: {
            allowedHosts: ["musing-boyd.orb.local"],
        },
        plugins: [
            build({
                entry: "src/index.tsx",
                minify: false,
            }),
            devServer({
                entry: "src/index.tsx",
            }),
        ],
    };

    // return {
    //     ssr: {
    //         external: ["dexie"],
    //     },
    //     plugins: [
    //         devServer({ entry: "./src/index.tsx" }),
    //         // VitePWA({
    //         //     registerType: "autoUpdate",
    //         //     manifest: {
    //         //         name: "Counter App",
    //         //         short_name: "Counter",
    //         //         start_url: "/",
    //         //         display: "standalone",
    //         //         background_color: "#ffffff",
    //         //         icons: [
    //         //             {
    //         //                 src: "/icons/icon-192.png",
    //         //                 sizes: "192x192",
    //         //                 type: "image/png",
    //         //             },
    //         //             {
    //         //                 src: "/icons/icon-512.png",
    //         //                 sizes: "512x512",
    //         //                 type: "image/png",
    //         //             },
    //         //         ],
    //         //     },
    //         // }),
    //     ],
    // };
});
