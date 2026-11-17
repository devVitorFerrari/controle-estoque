import { defineConfig } from "vite";

export default defineConfig({
  server: { proxy: { "/api": "http://localhost:5080" } },
  build: { outDir: "../backend/wwwroot", emptyOutDir: true },
});
