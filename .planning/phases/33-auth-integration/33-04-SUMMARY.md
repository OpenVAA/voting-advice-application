---
plan: 33-04
status: complete
started: 2026-03-22
completed: 2026-03-22
---

# Summary: Protected Layout Guards and Server-Side Auth

## What was done

Wired session-based authentication into three server-side files:

1. **candidate/+layout.server.ts** -- Replaced `AUTH_TOKEN_KEY` cookie read with `safeGetSession()`. Returns `{ session }` instead of `{ token }` to page data.

2. **candidate/(protected)/+layout.ts** -- Checks `(await parent()).session` instead of `(await parent()).token`. Passes `authToken: ''` to all DataWriter calls.

3. **hooks.server.ts** -- Replaced `candidateAuthHandle` to use `safeGetSession()` for session check instead of `cookies.get(AUTH_TOKEN_KEY)`. Removed `AUTH_TOKEN_KEY` import.

## Key files

- `apps/frontend/src/routes/candidate/+layout.server.ts`
- `apps/frontend/src/routes/candidate/(protected)/+layout.ts`
- `apps/frontend/src/hooks.server.ts`

## Self-Check: PASSED

- safeGetSession used in candidate layout server and hooks
- No AUTH_TOKEN_KEY references remain in updated files
- Session-based redirect logic in place for protected routes
