---
phase: 32
plan: 02
title: "Hooks and App.Locals Integration"
status: complete
started: 2026-03-22
completed: 2026-03-22
---

# Plan 32-02 Summary

## What was done

Added Supabase session handling to hooks.server.ts using SvelteKit sequence() and extended App.Locals with typed supabase client and safeGetSession.

### Tasks completed

| # | Task | Status |
|---|------|--------|
| 1 | Extend App.Locals type definition | Complete |
| 2 | Rewrite hooks.server.ts with sequence() and Supabase handler | Complete |

### Key files

**Modified:**
- `apps/frontend/src/app.d.ts` -- Added `supabase: SupabaseClient<Database>` and `safeGetSession()` to App.Locals
- `apps/frontend/src/hooks.server.ts` -- Added supabaseHandle, switched to `sequence(supabaseHandle, paraglideHandle, candidateAuthHandle)`

## Self-Check: PASSED

- App.Locals has `supabase: SupabaseClient<Database>`
- App.Locals has `safeGetSession()` returning `Promise<{ session, user }>`
- hooks.server.ts uses `sequence()` from `@sveltejs/kit/hooks`
- hooks.server.ts imports `createSupabaseServerClient`
- supabaseHandle creates server client and sets locals
- safeGetSession verifies with `getUser()` (not trusting `getSession()` alone)
- `filterSerializedResponseHeaders` passes `content-range` and `x-supabase-api-version`
- Paraglide middleware preserved
- candidateAuthHandle preserved (Strapi JWT coexistence)
- `token?: string` preserved in PageData

## Deviations

None.
