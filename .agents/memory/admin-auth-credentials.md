---
name: Admin auth is hardcoded, not a DB user
description: How admin login works in this app — a single hardcoded email/password pair, not a users-table row
---

Admin login (`authenticateAdmin` in `server/admin-routes.ts`) checks a single hardcoded email/password pair in code, not a row in the `users` table. Most other admin GET/POST routes are not protected by middleware beyond the login endpoint itself.

**Why:** The app never built out real admin accounts/roles — it's a simple shared-credential gate.

**How to apply:** When e2e-testing any admin-facing flow, log in through the admin UI using the hardcoded credentials found in `authenticateAdmin` (do not try to find/reset a DB user's password for admin testing — there isn't one).
