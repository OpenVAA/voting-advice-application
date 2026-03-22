---
plan: 33-03
status: complete
started: 2026-03-22
completed: 2026-03-22
---

# Summary: Preregister Route Rewrite

## What was done

Replaced the Strapi-based preregister server route with Supabase-only implementation:

- Calls `locals.supabase.functions.invoke('signicat-callback')` with the raw id_token
- Establishes Supabase session from magic link via `locals.supabase.auth.verifyOtp()`
- Clears id_token cookie after session establishment
- Removed all Strapi dependencies: `dataWriter`, `getIdTokenClaims`, `constants`, `BACKEND_API_TOKEN`

## Key files

- `apps/frontend/src/routes/api/candidate/preregister/+server.ts`

## Self-Check: PASSED

- Edge Function invocation present
- OTP verification present
- Cookie cleanup present
- No Strapi references remain
