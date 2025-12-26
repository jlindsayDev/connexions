import build from "@hono/vite-build/bun";
import devServer from "@hono/vite-dev-server";
import { defineConfig } from "vite";

export default defineConfig({
    build: {
        target: "esnext",
        minify: false,
        cssMinify: false,
    },
    server: {
        allowedHosts: [".orb.local"],
    },
    plugins: [
        build({
            entry: "src/services/api.ts",
            minify: false,
        }),
        devServer({
            entry: "src/services/api.ts",
        }),
    ],
});

// import build from "@hono/vite-build/bun";
// import devServer from "@hono/vite-dev-server";
// import { defineConfig } from "vite";

// // inspiration from https://github.com/alex-moon/mesh/blob/main/vite.config.ts
// export default defineConfig({
//     base: "/",
//     publicDir: "src/assets",
//     // filenameHashing: false,
//     build: {
//         outDir: "",
//         emptyOutDir: true,
//         manifest: true,

//         rolldownOptions: {
//             input: {
//                 main: "src/main.ts",
//                 styles: "src/main.scss",
//                 app: "src/components/app/app.scss",
//                 board: "src/components/board/board.scss",
//                 column: "src/components/column/column.scss",
//                 card: "src/components/card/card.scss",
//             },
//             output: {
//                 entryFileNames: "js/[name].[hash].js",
//                 chunkFileNames: "js/[name].[hash].js",
//                 assetFileNames: (assetInfo: any) => {
//                     const originalFileName = assetInfo.originalFileName || "";
//                     if (originalFileName.match(/.*css/)) {
//                         if (originalFileName.match(/components/)) {
//                             return "css/components/[name][extname]";
//                         }
//                         return "css/[name].[hash][extname]";
//                     }
//                     return "assets/[name][extname]";
//                 },
//             },
//         },

//         target: "esnext",
//         minify: false,
//         cssMinify: false,
//         // terserOptions: {
//         //     compress: false,
//         //     mangle: false,
//         // },
//     },
//     // esbuild: {
//     //     jsxImportSource: "hono/jsx/dom",
//     // },
//     server: {
//         allowedHosts: [".orb.local"],
//     },
//     plugins: [
//         build({
//             entry: "src/index.tsx",
//             minify: false,
//         }),
//         devServer({
//             entry: "src/index.tsx",
//         }),
//     ],
// });
