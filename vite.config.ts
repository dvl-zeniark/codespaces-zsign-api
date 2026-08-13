import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { zsignApiPlugin } from "./server/vite-plugin.ts";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), zsignApiPlugin()],
  resolve: {
    alias: {
      "@": root,
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-dom/client", "@tanstack/react-query"],
  },
  server: {
    host: true,
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: Number(process.env.PORT) || 5173,
    allowedHosts: true,
  },
});
