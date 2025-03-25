import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const plugins = [
  react(),
  runtimeErrorOverlay(),
  themePlugin(),
];

export default defineConfig({
  root: "client", // ✅ Ensure Vite starts in `client/`
  server: {
    proxy: {
      "/api": "https://your-backend-service.onrender.com", // ✅ API proxy for development
    },
  },
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"), // ✅ Keep alias for src
    },
  },
  build: {
    outDir: path.resolve(__dirname, "client/dist"), // ✅ Build inside `client/dist`
    emptyOutDir: true,
  },
});
