// Change the import to use your runtime specific build
import build from "@hono/vite-build/bun";
import devServer from "@hono/vite-dev-server";
import { type ConfigEnv, defineConfig } from "vite";

export default defineConfig((_configEng: ConfigEnv) => {
    return {
        esbuild: {
            jsxImportSource: "hono/jsx/dom",
        },
        server: {
            allowedHosts: ["musing_boyd.orb.local"],
        },
        // build: {
        //     rollupOptions: {
        //         input: ["./client.tsx", "./sw.ts"],
        //         output: {
        //             // dir: "dist",
        //             // entryFileNames: ["client.js", "sw.js"],
        //             minify: false,
        //         },
        //     },
        // },
        plugins: [
            build({
                entry: "index.tsx",
                minify: false,
            }),
            devServer({
                entry: "index.tsx",
            }),
        ],
    };
});
