import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { helmetConfig, rateLimiters, handleValidationError } from "./security";
import { validateStripeSubscriptions } from "./validate-subscriptions";
import path from "path";
import { db } from "./db";
import { sql } from "drizzle-orm";

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
  // One-time schema migrations (safe: IF NOT EXISTS / CREATE IF NOT EXISTS)
  const schemaMigrations: Array<[string, string]> = [
    // disciplines table
    [
      "create disciplines table",
      `CREATE TABLE IF NOT EXISTS disciplines (
        id serial PRIMARY KEY,
        name text NOT NULL UNIQUE,
        slug text NOT NULL UNIQUE,
        description text,
        sort_order integer DEFAULT 0
      )`
    ],
    // categories new columns
    ["categories.discipline_id", `ALTER TABLE categories ADD COLUMN IF NOT EXISTS discipline_id integer`],
    ["categories.sort_order",    `ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0`],
    // speakers new columns
    ["speakers.discipline_id",             `ALTER TABLE speakers ADD COLUMN IF NOT EXISTS discipline_id integer`],
    ["speakers.speaker_category_ids",      `ALTER TABLE speakers ADD COLUMN IF NOT EXISTS speaker_category_ids integer[] DEFAULT '{}'`],
    ["speakers.speaker_discipline_ids",    `ALTER TABLE speakers ADD COLUMN IF NOT EXISTS speaker_discipline_ids integer[] DEFAULT '{}'`],
    ["speakers.discipline_migration_status", `ALTER TABLE speakers ADD COLUMN IF NOT EXISTS discipline_migration_status varchar(20)`],
    // speaker_applications new columns
    ["speaker_applications.selected_discipline_id",  `ALTER TABLE speaker_applications ADD COLUMN IF NOT EXISTS selected_discipline_id integer`],
    ["speaker_applications.selected_category_ids",   `ALTER TABLE speaker_applications ADD COLUMN IF NOT EXISTS selected_category_ids integer[] DEFAULT '{}'`],
  ];

  for (const [label, statement] of schemaMigrations) {
    try {
      await db.execute(sql.raw(statement));
    } catch (err) {
      console.error(`[migration] Failed — ${label}:`, err);
    }
  }

  // Seed subscription plans
  const { seedSubscriptionPlans } = await import("./seed-subscriptions");
  await seedSubscriptionPlans();

  // Auto-populate production database if it's near-empty
  const { seedProdDataIfEmpty } = await import("./seed-prod-data");
  await seedProdDataIfEmpty();

  // Migrate legacy content categories to new section-based values
  const { migrateContentCategories } = await import("./migrate-content-categories");
  await migrateContentCategories();

  // One-time: reset speakers that were migrated/confirmed by the old broad-matching algorithm
  // (identified by speaker_discipline_ids still empty — that column never existed/was never
  // populated before the exact-match fix, so any speaker missing it was tagged under the old
  // logic, regardless of whether it's "auto" or was later bulk-"confirmed" via the admin
  // migration-review tool). Speakers approved through the application flow with an explicit
  // selectedDisciplineId are excluded so their human-chosen discipline is preserved.
  // After the fixed migration runs, speaker_discipline_ids will be non-empty, so this is idempotent.
  try {
    await db.execute(sql`
      UPDATE speakers
      SET discipline_migration_status = NULL,
          speaker_category_ids = '{}',
          speaker_discipline_ids = '{}'
      WHERE discipline_migration_status IN ('auto', 'confirmed')
        AND (speaker_discipline_ids IS NULL OR array_length(speaker_discipline_ids, 1) IS NULL)
        AND id NOT IN (
          SELECT created_speaker_id FROM speaker_applications
          WHERE created_speaker_id IS NOT NULL AND selected_discipline_id IS NOT NULL
        )
    `);
  } catch (err) {
    console.error("[migration] Could not reset stale discipline mappings:", err);
  }

  // One-time backfill: speakers approved via the application flow (excluded above to preserve
  // their human-chosen discipline) may still have an empty speaker_discipline_ids if they were
  // created before speakerDisciplineIds was populated at approval time. Backfill from their
  // existing discipline_id so they keep showing up in discipline browse/count endpoints, which
  // now read exclusively from speaker_discipline_ids. Idempotent — once backfilled, the WHERE
  // clause no longer matches.
  try {
    await db.execute(sql`
      UPDATE speakers
      SET speaker_discipline_ids = ARRAY[discipline_id]
      WHERE discipline_id IS NOT NULL
        AND (speaker_discipline_ids IS NULL OR array_length(speaker_discipline_ids, 1) IS NULL)
    `);
  } catch (err) {
    console.error("[migration] Could not backfill speaker_discipline_ids from discipline_id:", err);
  }

  // Seed disciplines + per-discipline categories, then auto-map speakers
  try {
    const { seedAndMigrateDisciplines } = await import("./seed-disciplines");
    await seedAndMigrateDisciplines();
  } catch (err) {
    console.error("[seed-disciplines] Failed (schema may not be ready yet):", err);
  }

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

  // Use PORT from environment (Railway sets this dynamically), fallback to 5000 for Replit
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);

    // Pre-warm Vite in development so the first user request isn't slow
    if (app.get("env") === "development") {
      setTimeout(() => {
        fetch(`http://localhost:${port}/`).catch(() => {});
      }, 500);
    }

    // Validate Stripe subscriptions in background after startup
    setTimeout(() => {
      validateStripeSubscriptions().catch(err => 
        console.error("Subscription validation failed:", err)
      );
    }, 3000);
  });
})();
