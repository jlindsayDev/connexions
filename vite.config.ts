import build from "@hono/vite-build/bun";
import devServer from "@hono/vite-dev-server";
import { type ConfigEnv, defineConfig } from "vite";

export default defineConfig((_configEng: ConfigEnv) => {
    return {
        build: {
            target: "esnext",
        },
        esbuild: {
            jsxImportSource: "hono/jsx/dom",
        },
        server: {
            allowedHosts: ["confident_antonelli.orb.local", "airmac.local"],
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
