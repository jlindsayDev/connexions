import build from "@hono/vite-build/bun";
import devServer from "@hono/vite-dev-server";
import { type ConfigEnv, defineConfig } from "vite";

export default defineConfig((_configEng: ConfigEnv) => {
    return {
        filenameHashing: false,
        build: {
            target: "esnext",
            minify: false,
            cssMinify: false,
            terserOptions: {
                compress: false,
                mangle: false,
            },
        },
        esbuild: {
            jsxImportSource: "hono/jsx/dom",
        },
        server: {
            allowedHosts: [".orb.local"],
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
