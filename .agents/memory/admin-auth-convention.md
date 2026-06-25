---
name: Admin route auth convention
description: How admin-only and owner-only mutations are protected in this codebase
---

Admin authorization is enforced server-side via the `isAdminRequest(req)` helper in `server/routes.ts` (checks `req.session.user.role === 'admin'` OR an `x-admin-email` header equal to the known admin email). Many older admin mutation routes were historically NOT guarded; newer ones (disciplines/categories/migration) are guarded.

The admin React UI does NOT automatically attach the admin header on mutations: `apiRequest` in `client/src/lib/queryClient.ts` only adds `X-User-ID`. To call an admin-guarded route from the client you must add `X-Admin-Email` manually (read `localStorage.adminAuthenticated === 'true'` + `localStorage.adminEmail`). The query fetcher (`getQueryFn`) DOES add `X-Admin-Email` for GETs, but `apiRequest` does not.

For routes that are BOTH admin-usable and speaker-self-service (e.g. `PUT /api/speakers/:id/discipline`), use an owner-OR-admin check: `isAdminRequest(req)` OR resolve the speaker's own user via `storage.getUserByToken(x-user-id header)` and compare `user.speakerId === speakerId`.

**Why:** A code review flagged unguarded discipline mutation routes as broken access control. Guards were added; the client admin components had to send `X-Admin-Email` explicitly, and the speaker dashboard had to switch to `apiRequest` so its `X-User-ID` token is sent.

**How to apply:** When adding an admin mutation route, add `isAdminRequest` and make the calling client component send `X-Admin-Email`. For self-service speaker routes, use the owner-OR-admin pattern and ensure the client uses `apiRequest` (sends `X-User-ID`).
