---
name: Admin route auth convention
description: How admin-only mutations are (not) protected in this codebase
---

In this app, the overwhelming majority of admin mutation routes (e.g. `POST/DELETE /api/categories`, speaker edits) have **no server-side admin authorization**. Only ~4 routes use the `isAdminRequest(req)` helper (defined mid-file in `server/routes.ts`), which checks `req.session.user.role === 'admin'` OR an `x-admin-email` header.

The admin React UI (`client/src/pages/admin.tsx`) does NOT send admin auth headers on its mutations — gating is purely client-side (login screen).

**Why:** When adding the disciplines feature, a code review flagged the new discipline routes as missing authz. But adding guards only to the new routes would (a) be inconsistent with the rest of the app, (b) break the admin UI since it sends no admin header, and (c) `PUT /api/speakers/:id/discipline` is also used by speakers for self-service, so it can't be admin-only anyway.

**How to apply:** Match the existing convention for consistency. If you genuinely need to secure admin routes, it must be an app-wide change covering ALL admin mutations plus updating the admin UI to send credentials — not a piecemeal fix.
