---
name: Production DB access pattern
description: How the production database is configured and how to connect to it from dev
---

## Database layout

| Database | Host | Data | Used by |
|---|---|---|---|
| Local PostgreSQL | Helium (Replit built-in) | ~524 speakers | Dev app (DATABASE_URL, runtime-managed) |
| User's Neon DB | ep-dry-sunset-a6dfrrsb.us-west-2 | 560 speakers | Production app via PROD_DATABASE_URL |
| Abandoned Neon DB | ep-gentle-term-ahnvun5c.us-east-1 | 537 speakers | Was PROD_DATABASE_URL, now unused |

## How the production app selects its database

`server/db.ts`:
```javascript
const connectionString = process.env.NODE_ENV === 'production'
  ? process.env.PROD_DATABASE_URL
  : process.env.DATABASE_URL;
```

`PROD_DATABASE_URL` is a **production-only** env var → user's Neon DB (ep-dry-sunset, us-west-2).

**Why:** PROD_DATABASE_URL is production-scoped only, invisible in dev.

## Connecting to the user's Neon DB from dev shell

`$PROD_DATABASE_URL` is empty in the dev bash shell (production-only). But PG* env vars point directly to the user's Neon DB, so this works:

```bash
psql "postgresql://$PGUSER:$PGPASSWORD@$PGHOST/$PGDATABASE?sslmode=require" -c "..."
```

PG* vars: `PGHOST=ep-dry-sunset-a6dfrrsb.us-west-2.aws.neon.tech`, `PGDATABASE=neondb`, `PGUSER=neondb_owner`

## Updating PROD_DATABASE_URL

1. `viewEnvVars({ type: "env", keys: ["PROD_DATABASE_URL"] })` to see current value
2. Write new URL to `/tmp/neon_url.txt` in bash (keeps password out of code_execution)
3. In code_execution: `const fs = await import('fs'); const url = fs.readFileSync('/tmp/neon_url.txt','utf8').trim(); await setEnvVars({ values: { PROD_DATABASE_URL: url }, environment: "production" });`
4. Republish — change only takes effect after next deployment
