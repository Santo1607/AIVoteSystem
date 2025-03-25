import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url"; // ✅ Fix for __dirname in ES Modules
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware to log API requests
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // ✅ Serve frontend files in production (Fix for ES Modules)
  if (process.env.NODE_ENV === "production") {
    const frontendPath = path.resolve(__dirname, "../client/dist");
    app.use(express.static(frontendPath));

    // Serve frontend for all unknown routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(frontendPath, "index.html"));
    });
  } else {
    await setupVite(app, server); // Only setup Vite in development
  }

  // ✅ Use environment-provided port (important for Render)
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`🚀 Server running on port ${PORT}`);
  });
})();
