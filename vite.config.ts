// Change the import to use your runtime specific build
import build from "@hono/vite-build/bun";
import devServer from "@hono/vite-dev-server";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

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
                        // dir: "dist",
                        entryFileNames: "client.js",
                        minify: false,
                    },
                },
            },
        };
    }

    if (mode === "sw") {
        return {
            esbuild: {
                jsxImportSource: "hono/jsx/dom", // Optimized for hono/jsx/dom
            },
            build: {
                rollupOptions: {
                    input: "./src/sw.ts",
                    output: {
                        entryFileNames: "public/sw.js",
                        minify: false,
                    },
                },
            },
            plugins: [
                VitePWA({
                    mode: "development",
                    minify: false,
                    registerType: "autoUpdate",
                    injectRegister: false,
                    manifest: {
                        name: "Connexions",
                        short_name: "Connexions",
                        start_url: "/sw",
                        display: "standalone",
                        background_color: "#FF0000",
                    },
                }),
            ],
        };
    }

    return {
        server: {
            allowedHosts: ["musing_boyd.orb.local"],
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
});
