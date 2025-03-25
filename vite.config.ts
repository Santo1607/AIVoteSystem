import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const plugins = [
  react(),
  runtimeErrorOverlay(),
  themePlugin(),
];

// Optional: Load Replit plugin only when running on Replit
if (process.env.NODE_ENV !== "production" && process.env.REPL_ID) {
  import("@replit/vite-plugin-cartographer").then((m) =>
    plugins.push(m.cartographer())
  );
}

export default defineConfig({
  server: {
    proxy: {
      "/api": "https://your-backend-service.onrender.com",
    },
  },
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});
