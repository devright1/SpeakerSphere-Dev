---
name: Stale session auth gaps
description: Why speaker-dashboard saves can appear to "silently fail" even though the save logic itself is correct.
---

This app has no global session validation on the frontend or a consistent check on the backend:

- `useAuthState()` (client) trusts `localStorage.userToken`/`userData` blindly on mount — no expiry check, no server round-trip to confirm the session is still valid.
- Read endpoints like `GET /api/speakers/by-user/:userId` don't check the `X-User-ID` session token at all — they just trust the URL param. So a dashboard can load fine and display data even when the browser's stored token no longer maps to any row in `user_sessions` (expired, or wiped by a DB reset/restore).
- Write endpoints (e.g. `PUT /api/speakers/:id/discipline`) DO strictly validate the token via `storage.getUserByToken`/`getUserSession`, and return 403 "Not authorized to update this speaker" when it doesn't resolve.

**Why this matters:** a user with a stale/expired session sees their dashboard load normally, but any save/write action fails. If the mutation's `onError` only shows a generic "please try again" toast, the user has no way to recover — retrying does nothing, and it looks like the feature itself is broken ("my changes don't persist"), when actually the fix is just re-authenticating.

**How to apply:** when a dashboard/profile mutation's error message matches the "Not authorized to update this X" pattern from an owner-or-admin route, treat it as a session-expiry signal specific to that user's own resource — clear the stored token/user data, show a clear "Session expired, please log in again" message, and redirect to `/login` (with a short delay so the toast is visible before navigation). Don't assume a global 401/403 interceptor already exists — check `apiRequest`/`getQueryFn` in `client/src/lib/queryClient.ts` first; as of this writing there isn't one, so this handling has to be added per-mutation until/unless a global interceptor is introduced.
