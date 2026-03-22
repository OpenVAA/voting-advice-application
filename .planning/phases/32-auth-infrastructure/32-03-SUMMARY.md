---
phase: 32
plan: 03
title: "Auth API Routes (Callback and Logout)"
status: complete
started: 2026-03-22
completed: 2026-03-22
---

# Plan 32-03 Summary

## What was done

Created Supabase PKCE auth callback and logout server routes for the candidate app.

### Tasks completed

| # | Task | Status |
|---|------|--------|
| 1 | Create auth callback route | Complete |
| 2 | Create auth logout route | Complete |

### Key files

**Created:**
- `apps/frontend/src/routes/candidate/auth/callback/+server.ts` -- PKCE token exchange with flow-specific redirects
- `apps/frontend/src/routes/candidate/auth/logout/+server.ts` -- Server-side signOut for httpOnly cookie clearing

## Self-Check: PASSED

- Callback route exists at correct path
- GET handler with verifyOtp for PKCE exchange
- Handles recovery, invite, email, signup flow types
- Uses `locals.supabase` (not creating own client)
- Uses `locals.currentLocale` for locale-aware redirects
- Logout route exists at correct path
- POST handler with `signOut({ scope: 'local' })`
- Neither route contains `AUTH_TOKEN_KEY`
- Neither route contains `createServerClient` or `createBrowserClient`
- Existing Strapi routes at `/api/auth/` unchanged

## Deviations

None.
