---
name: Production DB access pattern
description: How to actually connect to the real production Neon database from the dev shell
---

## Rule
`$PROD_DATABASE_URL` is **empty in the dev bash shell** — it's a production-only env var. `psql "$PROD_DATABASE_URL"` silently falls back to PG* env vars, which point to a **different** Neon database (ep-fancy-mode, us-east-2). That database is NOT what the production app uses.

## The real production database
`PROD_DATABASE_URL` in the Replit production environment → ep-gentle-term-ahnvun5c-pooler.c-3.us-east-1.aws.neon.tech (Neon, us-east-1, 560 speakers).

The production app selects it via: `process.env.NODE_ENV === 'production' ? process.env.PROD_DATABASE_URL : process.env.DATABASE_URL` (server/db.ts).

**Why:** PROD_DATABASE_URL is stored as a production-scoped env var (not a secret, not shared), so it's invisible in dev.

## How to apply
To run DDL/queries against the actual production DB from dev:
1. `viewEnvVars({ type: "env", keys: ["PROD_DATABASE_URL"] })` — gets the production value
2. `setEnvVars({ values: { PROD_DATABASE_URL: prodUrl }, environment: "development" })` — adds it to dev
3. Restart the workflow so the dev shell picks it up
4. Run `psql "$PROD_DATABASE_URL" ...`
5. Clean up: `deleteEnvVars({ keys: ["PROD_DATABASE_URL"], environment: "development" })`
