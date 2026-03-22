# Phase 32: Auth Infrastructure - Research

**Researched:** 2026-03-22
**Status:** Complete

## 1. Current State Analysis

### hooks.server.ts (Current Branch)
- **Location:** `apps/frontend/src/hooks.server.ts`
- Uses Paraglide middleware (`paraglideMiddleware` from `$lib/paraglide/server`) for i18n routing
- Has `candidateAuthHandle` that checks Strapi JWT cookie (`AUTH_TOKEN_KEY = 'token'`) for candidate route protection
- Hooks are manually chained (paraglideHandle wraps candidateAuthHandle) — NOT using SvelteKit `sequence()`
- Exports single `handle` and `handleError`

### App.Locals (Current Branch)
- **Location:** `apps/frontend/src/app.d.ts`
- Contains: `currentLocale: string`, `preferredLocale?: string`
- PageData has `token?: string` (Strapi JWT) — must be preserved per D-10

### Strapi Auth Files
- `apps/frontend/src/lib/auth/authToken.ts` — exports `AUTH_TOKEN_KEY = 'token'`
- `apps/frontend/src/lib/auth/getUserData.ts` — Strapi user data fetcher
- `apps/frontend/src/lib/auth/index.ts` — re-exports both
- `apps/frontend/src/routes/api/auth/login/+server.ts` — Strapi login (sets JWT cookie)
- `apps/frontend/src/routes/api/auth/logout/+server.ts` — Strapi logout (deletes JWT cookie)
- `apps/frontend/src/routes/candidate/+layout.server.ts` — reads `AUTH_TOKEN_KEY` from cookie, passes to PageData

### Route Structure
- Routes do NOT use `[[lang=locale]]` parameter — Paraglide handles locale routing transparently
- Candidate routes at `apps/frontend/src/routes/candidate/`
- Protected routes at `apps/frontend/src/routes/candidate/(protected)/`
- API routes at `apps/frontend/src/routes/api/auth/`

### Package Dependencies
- `@supabase/supabase-js: ^2.49.4` in Yarn catalog (NOT yet in frontend package.json)
- `@supabase/ssr` NOT in catalog — latest version is `0.9.0`
- `@openvaa/supabase-types` package exists at `packages/supabase-types/`
- Frontend currently has NO Supabase dependencies

## 2. Parallel Branch Reference

### Browser Client (`frontend/src/lib/supabase/browser.ts`)
- Singleton pattern — caches client after first creation
- Uses `createBrowserClient<Database>` from `@supabase/ssr`
- Reads `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` from `$env/static/public`
- Simple, clean implementation — 12 lines of code

### Server Client (`frontend/src/lib/supabase/server.ts`)
- Per-request client (NOT singleton) — takes `RequestEvent` parameter
- Uses `createServerClient<Database>` from `@supabase/ssr`
- Cookie handlers: `getAll()` returns all cookies, `setAll()` sets cookies with `path: '/'`
- Same env vars as browser client

### hooks.server.ts (Parallel Branch)
- Single monolithic `handle` function (no `sequence()`)
- Creates Supabase server client FIRST, before any other logic
- `safeGetSession` defined inline: calls `getSession()`, then verifies with `getUser()`
- Uses `sveltekit-i18n` (NOT Paraglide) — we must NOT copy this i18n pattern
- Merges `{ supabase, safeGetSession, currentLocale, preferredLocale }` into `event.locals`
- `filterSerializedResponseHeaders` passes `content-range` and `x-supabase-api-version`

### app.d.ts (Parallel Branch)
- Adds `supabase: SupabaseClient<Database>` to `App.Locals`
- Adds `safeGetSession()` returning `Promise<{ session: Session | null; user: User | null }>` to `App.Locals`
- Adds `session?: Session | null` and `user?: User | null` to `PageData`
- Removes `token?: string` from PageData — we must NOT do this (Phase 38)

### Auth Callback (`frontend/src/routes/[[lang=locale]]/candidate/auth/callback/+server.ts`)
- GET handler for PKCE token exchange
- Reads `token_hash`, `type` (EmailOtpType), `next` query params
- Calls `locals.supabase.auth.verifyOtp({ token_hash, type })`
- Flow-specific redirects: recovery → password-reset, invite → register/password, email/signup → next or candidate home
- Error fallback: redirect to login with `?errorMessage=authError`
- Uses `locals.currentLocale` for locale prefix

### Auth Logout (`frontend/src/routes/[[lang=locale]]/candidate/auth/logout/+server.ts`)
- POST handler
- Calls `locals.supabase.auth.signOut({ scope: 'local' })`
- Returns `json({ success: true })`
- Must be server-side to clear httpOnly cookies

## 3. Key Adaptation Decisions

### Route Paths
The parallel branch uses `[[lang=locale]]` in routes. Current branch does NOT — Paraglide handles locale transparently. Auth routes should be placed at:
- `apps/frontend/src/routes/candidate/auth/callback/+server.ts`
- `apps/frontend/src/routes/candidate/auth/logout/+server.ts`

### Hook Composition Strategy
Current branch manually nests hooks. The CONTEXT.md specifies using `sequence()` (D-05). This requires:
1. Converting `paraglideHandle` to a standalone Handle function (already is one)
2. Creating a new `supabaseHandle` Handle function
3. Keeping `candidateAuthHandle` as-is (Strapi auth coexistence)
4. Composing: `sequence(supabaseHandle, paraglideHandle, candidateAuthHandle)`

Order matters: supabase first so `event.locals.supabase` and `safeGetSession` are available to subsequent handlers.

### safeGetSession Pattern
Critical security pattern — `getSession()` reads from cookies which can be spoofed. Must always verify with `getUser()` which makes a server call to Supabase Auth.

### Strapi Coexistence
- `AUTH_TOKEN_KEY` and `candidateAuthHandle` remain untouched
- `token?: string` stays in PageData
- Existing Strapi login/logout API routes at `apps/frontend/src/routes/api/auth/` stay
- New Supabase auth routes go to `apps/frontend/src/routes/candidate/auth/`

### Package Installation
Need to add to frontend `package.json`:
- `@supabase/supabase-js: catalog:` (already in Yarn catalog)
- `@supabase/ssr: ^0.9.0` (add to catalog first, then use `catalog:`)
- `@openvaa/supabase-types: workspace:^`

### Environment Variables
Need `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` accessible via `$env/static/public`. These should be added to root `.env.example` (actual `.env` is not committed). For development with Docker, they should point to local Supabase (supabase CLI defaults: `http://localhost:54321` and the local anon key).

## 4. Risk Assessment

### Low Risk
- Browser/server client creation — well-documented pattern, parallel branch has working implementation
- App.Locals type extension — additive change, no breaking impact
- Auth routes — new files, no existing code modified

### Medium Risk
- Hook composition with `sequence()` — changing from manual nesting to `sequence()` could affect execution order if not careful
- `filterSerializedResponseHeaders` — needed for Supabase but must not break existing responses

### Mitigations
- Test hook order carefully: supabase → paraglide → candidateAuth
- The `filterSerializedResponseHeaders` only affects serialized response headers (SvelteKit data fetching), not regular HTTP headers
- Keep candidateAuthHandle exactly as-is for backward compatibility

## 5. Validation Architecture

### Structural Checks
- `apps/frontend/src/lib/supabase/browser.ts` exports `createSupabaseBrowserClient`
- `apps/frontend/src/lib/supabase/server.ts` exports `createSupabaseServerClient`
- `apps/frontend/src/hooks.server.ts` imports from `$lib/supabase/server`
- `apps/frontend/src/hooks.server.ts` uses `sequence()` from `@sveltejs/kit`
- `apps/frontend/src/app.d.ts` declares `supabase` and `safeGetSession` in `App.Locals`
- `apps/frontend/src/routes/candidate/auth/callback/+server.ts` exists with GET handler
- `apps/frontend/src/routes/candidate/auth/logout/+server.ts` exists with POST handler

### Type Checks
- `yarn workspace @openvaa/frontend check` passes (svelte-check)
- No TypeScript errors in modified files

### Coexistence Checks
- `AUTH_TOKEN_KEY` still imported and used in `candidateAuthHandle`
- `token?: string` still in `App.PageData`
- Strapi API auth routes unchanged at `apps/frontend/src/routes/api/auth/`

---

## RESEARCH COMPLETE

*Phase: 32-auth-infrastructure*
*Researched: 2026-03-22*
