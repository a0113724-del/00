import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Static build for GitHub Pages. Shared UI + AI logic are imported from ../web/src (single source of truth).
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "../web/src") },
    dedupe: ["react", "react-dom", "lucide-react"],
  },
  server: { fs: { allow: [".."] } },
});
