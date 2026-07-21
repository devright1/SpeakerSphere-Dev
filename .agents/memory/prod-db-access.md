---
name: Production DB access pattern
description: How the production database is configured and how to connect to it from dev
---

## Database layout

| Database | Host | Data | Used by |
|---|---|---|---|
| Local PostgreSQL | Helium (Replit built-in) | ~62 hardcoded + dev work | Dev app (DATABASE_URL) |
| Production Neon DB | ep-dry-sunset-a6dfrrsb.us-west-2 | 500+ speakers (real data) | Production app via PROD_DATABASE_URL |

## CRITICAL: Never change db.ts to always use DATABASE_URL

`server/db.ts` MUST use:
```typescript
const connectionString = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;
```

**Why:** `PROD_DATABASE_URL` is a production-only env var pointing to the Neon DB with all real speaker data. `DATABASE_URL` in production points to Replit PostgreSQL which only has ~62 hardcoded speakers. Changing to only `DATABASE_URL` causes the live site to show 62 speakers instead of 500+. This is what caused the "speakers disappeared" incident.

## Connecting to the Neon DB from dev shell

`$PROD_DATABASE_URL` is empty in the dev bash shell (production-only). But PG* env vars point directly to the Neon DB:

```bash
psql "postgresql://$PGUSER:$PGPASSWORD@$PGHOST/$PGDATABASE?sslmode=require" -c "..."
```

PG* vars: `PGHOST=ep-dry-sunset-a6dfrrsb.us-west-2.aws.neon.tech`, `PGDATABASE=neondb`, `PGUSER=neondb_owner`

## Updating PROD_DATABASE_URL

1. `viewEnvVars({ type: "env", keys: ["PROD_DATABASE_URL"] })` to see current value
2. Write new URL to `/tmp/neon_url.txt` in bash (keeps password out of code_execution)
3. In code_execution: `const fs = await import('fs'); const url = fs.readFileSync('/tmp/neon_url.txt','utf8').trim(); await setEnvVars({ values: { PROD_DATABASE_URL: url }, environment: "production" });`
4. Republish — change only takes effect after next deployment
