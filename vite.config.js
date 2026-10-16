import { defineConfig } from "vite";
// 相対パスで書き出す：GitHub Pages の下位パスでも、試作の公開ページでもそのまま動く
export default defineConfig({ assetsInclude: ["**/*.glb"], base: "./", build: { outDir: "dist", assetsInlineLimit: 0, chunkSizeWarningLimit: 2500 } });
