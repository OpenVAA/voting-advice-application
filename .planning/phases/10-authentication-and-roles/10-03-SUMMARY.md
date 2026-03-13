---
phase: 10-authentication-and-roles
plan: 03
subsystem: frontend-auth
tags: [supabase, ssr, sveltekit, authentication, login, password-reset]
dependency_graph:
  requires: ["10-01 (user_roles table, JWT hook, RLS helpers)"]
  provides: ["Per-request Supabase server client on event.locals", "Browser client singleton", "Supabase-backed login and password reset"]
  affects: ["frontend/src/hooks.server.ts", "frontend/src/app.d.ts", "candidate login flow", "candidate password reset flow"]
tech_stack:
  added: ["@supabase/supabase-js@2.99.1", "@supabase/ssr@0.9.0"]
  patterns: ["Cookie-based Supabase server client per request", "safeGetSession pattern (getSession + getUser verification)", "Browser client singleton", "Dual auth check (Strapi token + Supabase cookie) for migration period"]
key_files:
  created:
    - frontend/src/lib/supabase/server.ts
    - frontend/src/lib/supabase/browser.ts
  modified:
    - frontend/package.json
    - frontend/tsconfig.json
    - frontend/src/hooks.server.ts
    - frontend/src/app.d.ts
    - frontend/src/routes/[[lang=locale]]/candidate/login/+page.server.ts
    - frontend/src/routes/[[lang=locale]]/candidate/forgot-password/+page.svelte
    - frontend/.env.example
decisions:
  - "Dual auth check in hooks.server.ts (Strapi AUTH_TOKEN_KEY cookie OR Supabase sb-* cookie) for backward compatibility during migration"
  - "safeGetSession verifies via getUser() after getSession() to prevent JWT tampering"
  - "Password reset redirectTo URL points to /candidate/update-password (route to be created in future plan)"
  - "Browser client is a singleton (created once, reused across component lifecycle)"
metrics:
  duration: 4min
  completed: "2026-03-13T13:55:00Z"
---

# Phase 10 Plan 03: SvelteKit @supabase/ssr Integration Summary

**One-liner:** Cookie-based Supabase server/browser client integration with signInWithPassword login and resetPasswordForEmail password reset

## What Was Done

### Task 1: Install @supabase/ssr and create client factories
- Installed `@supabase/supabase-js` and `@supabase/ssr` in the frontend workspace
- Added `@openvaa/supabase-types` workspace dependency to frontend for typed Database generic
- Added TypeScript project reference for supabase-types in frontend tsconfig
- Created `frontend/src/lib/supabase/server.ts` -- factory that creates a per-request Supabase server client with SvelteKit cookie handling (getAll/setAll)
- Created `frontend/src/lib/supabase/browser.ts` -- singleton factory for browser-side Supabase client

### Task 2: Update hooks.server.ts and app.d.ts for Supabase integration
- Updated `App.Locals` to include `supabase: SupabaseClient<Database>` and `safeGetSession()` method
- Updated `App.PageData` to include optional `session` and `user` fields
- Integrated Supabase server client creation at the top of the handle function (before locale logic)
- Implemented `safeGetSession` that calls `getSession()` then verifies with `getUser()` against the Auth server
- Updated candidate auth check to support both old Strapi token (AUTH_TOKEN_KEY) and new Supabase session cookies (sb-* prefix)
- Added `filterSerializedResponseHeaders` to pass through `content-range` and `x-supabase-api-version` headers
- All existing locale handling, protected route redirects, and error handling preserved unchanged
- Updated `frontend/.env.example` with Supabase env var placeholders

### Task 3: Wire login and forgot-password pages to Supabase Auth
- Rewrote login `+page.server.ts` to use `locals.supabase.auth.signInWithPassword()` instead of Strapi API
- Maps Supabase auth error messages to HTTP status codes (400 for invalid credentials, 403 for unconfirmed email)
- Removed all Strapi-specific imports (UNIVERSAL_API_ROUTES, LoginParams, LoginResult)
- No changes needed to `+page.svelte` login form -- it already submits email/password via form action
- Updated forgot-password `+page.svelte` to use `createSupabaseBrowserClient()` and `resetPasswordForEmail()` instead of `requestForgotPasswordEmail` from candidate context
- Set password reset redirect URL to `/{locale}/candidate/update-password` (route to be created in a future plan)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @openvaa/supabase-types workspace dependency**
- **Found during:** Task 1
- **Issue:** `@openvaa/supabase-types` was not listed as a frontend dependency, which would cause import resolution failures
- **Fix:** Added `"@openvaa/supabase-types": "workspace:^"` to frontend/package.json and TypeScript project reference to tsconfig.json
- **Files modified:** frontend/package.json, frontend/tsconfig.json
- **Commit:** 702990d76

## Verification Results

All plan verification criteria confirmed:
1. Build: svelte-kit sync succeeds (full build blocked by pre-existing unbuilt @openvaa/app-shared, not related to this plan)
2. hooks.server.ts imports and uses createSupabaseServerClient
3. app.d.ts has SupabaseClient<Database> on Locals
4. Server and browser client factory files exist with correct exports
5. Existing locale handling (7 references), candidate auth redirect, and handleError preserved
6. Login +page.server.ts calls signInWithPassword (confirmed via grep)
7. Forgot-password +page.svelte calls resetPasswordForEmail (confirmed via grep)

## Self-Check: PASSED

All 7 created/modified files verified present on disk. All 3 task commits verified in git history (702990d76, 4d943aac6, 1d6bd25f5).
