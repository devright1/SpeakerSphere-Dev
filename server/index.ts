import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { helmetConfig, rateLimiters, handleValidationError } from "./security";
import path from "path";

const app = express();

// Trust proxy for accurate IP addresses in Replit environment
app.set('trust proxy', true);

// Apply security headers first
app.use(helmetConfig);

// Apply general rate limiting (but exempt admin routes)
app.use('/api/', (req, res, next) => {
  // Skip rate limiting for admin routes
  if (req.path.startsWith('/admin/')) {
    return next();
  }
  return rateLimiters.general(req, res, next);
});

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Serve attached assets
app.use("/attached_assets", express.static(path.resolve(process.cwd(), "attached_assets")));

// Serve uploaded files
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

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
  // Seed subscription plans
  const { seedSubscriptionPlans } = await import("./seed-subscriptions");
  await seedSubscriptionPlans();

  await registerRoutes(app);

  // Security error handling middleware
  app.use(handleValidationError);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log security-related errors
    if (status === 429 || status === 400 || status === 413) {
      log(`Security error: ${status} - ${message}`);
    }

    res.status(status).json({ message });
  });

  // Create HTTP server
  const server = createServer(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
