# Phase 33: Auth Integration - Research

**Researched:** 2026-03-22
**Researcher:** Orchestrator direct research (codebase analysis)

## Research Question

What do I need to know to PLAN Phase 33 (Auth Integration) well?

## Current State Analysis

### 1. Auth Context (`apps/frontend/src/lib/contexts/auth/`)

**Current (`authContext.ts`):**
- Derives `authToken` from `page.data.token` (Strapi JWT)
- `logout()` uses `get(authToken)` for token, passes to `dataWriter.logout({ authToken: token })`
- `setPassword()` requires `currentPassword` param, uses `get(authToken)` for token
- `requestForgotPasswordEmail()` and `resetPassword()` pass-through to DataWriter
- Exports `authToken` in context object
- Imports: `derived`, `get` from svelte/store, `page` from `$app/stores`

**Target (parallel branch `authContext.ts`):**
- Derives `isAuthenticated` from `!!page.data.session` (Supabase session)
- `logout()` passes `authToken: ''` to satisfy WithAuth type (Supabase ignores it)
- `setPassword()` only takes `{ password }`, passes `authToken: ''`, `currentPassword: ''`
- Same pass-through pattern for `requestForgotPasswordEmail()` and `resetPassword()`
- Exports `isAuthenticated` in context object (not `authToken`)
- No `get` import needed (no token to read)

**Delta:** Replace `authToken` derived store with `isAuthenticated` boolean derived store. Remove `get` import. Simplify `logout()` and `setPassword()` to not read tokens.

### 2. Auth Context Type (`authContext.type.ts`)

**Current:**
- `authToken: Readable<string | undefined>` property
- `setPassword: (opts: { currentPassword: string; password: string }) => ...`
- Imports `Readable` from svelte/store

**Target:**
- `isAuthenticated: Readable<boolean>` property
- `setPassword: (opts: { password: string }) => Promise<DataApiActionResult>`
- Additional import: `DataApiActionResult` from actionResult.type

**Delta:** Replace property name/type, simplify setPassword signature, add import.

### 3. getUserData (`apps/frontend/src/lib/auth/getUserData.ts`)

**Current:**
- Complex overloaded signature: `authToken | cookies | parent` (exactly one required)
- Uses `AUTH_TOKEN_KEY` from `authToken.ts` for cookie reading
- Gets `(await parent()).token` for parent variant
- Passes `authToken` to `dataWriter.getBasicUserData({ authToken })`

**Target (parallel branch):**
- Simple signature: `{ fetch, parent? }` only
- No cookie reading, no AUTH_TOKEN_KEY import
- Checks `parentData.session` for auth state
- Passes `authToken: ''` to satisfy WithAuth (Supabase ignores)

**Delta:** Complete rewrite from complex overloaded function to simple session-based one.

### 4. authToken.ts (`apps/frontend/src/lib/auth/authToken.ts`)

**Current:** Exports `AUTH_TOKEN_KEY = 'token'`
**Target:** Will be removed (Phase 38 cleanup) -- but Phase 33 should stop using it in auth context/getUserData. Other consumers (hooks.server.ts, login route, admin routes) will be cleaned in Phase 38.

**Recommendation for Phase 33:** Don't delete authToken.ts yet (other files still import it). Remove imports in files we're modifying. The file will be cleaned up in Phase 38.

### 5. Preregister Route (`apps/frontend/src/routes/api/candidate/preregister/+server.ts`)

**Current:**
- Strapi-only: Uses `BACKEND_API_TOKEN`, `dataWriter.preregisterWithApiToken()`
- Reads `id_token` from cookies, validates claims, passes to Strapi
- Handler signature: `POST({ cookies, request })`

**Target (parallel branch, Supabase path only):**
- Uses `locals.supabase.functions.invoke('signicat-callback', { body: { id_token: idToken } })`
- Establishes session from magic link via `locals.supabase.auth.verifyOtp()`
- Clears id_token cookie after session establishment
- Handler signature: `POST({ cookies, request, locals })`
- Returns `json({ type: 'success' })`
- Needs `EmailOtpType` import from `@supabase/supabase-js`

**Delta:** Complete rewrite. Replace Strapi API call with Edge Function invocation + OTP verification.

### 6. Protected Layout

**Current layout loader (`+layout.ts`):**
- Gets `authToken` from `(await parent()).token`
- Redirects if no token
- Uses `dataWriter.getCandidateUserData({ authToken, loadNominations: true })`
- Uses `getLocale()` for locale
- Uses `dataProvider` singleton for question data
- On error: calls `dataWriter.logout({ authToken })` then redirects

**Target (parallel branch `+layout.server.ts`):**
- This is a SERVER loader (not universal loader)
- Gets session from `(await parent()).session`
- Redirects if no session
- Creates per-request `SupabaseDataWriter` and `SupabaseDataProvider` instances
- Uses `locals.supabase` and `locals.currentLocale`
- Passes `authToken: ''` everywhere
- On error: calls `dataWriter.logout({ authToken: '' })`

**Critical difference:** The parallel branch uses a server loader with per-request Supabase instances. The current branch uses a universal loader (`+layout.ts`). This conversion from `.ts` to `.server.ts` is important because Supabase server client is only available in server contexts.

**Current layout Svelte (`+layout.svelte`):**
- Already Svelte 5 (runes: `$props()`, `$state()`, `$effect()`, snippets, `{@render}`)
- Uses `getCandidateContext()` -- this works regardless of auth backend

### 7. Consumer Impact Analysis

**Files that consume `authToken` from contexts:**

1. **`candidateContext.ts` (line 48):** `const { authToken, logout: _logout } = authContext;` -- passes to `candidateUserDataStore`. Must change to `isAuthenticated`.

2. **`candidateUserDataStore.ts` (lines 25-30, 172, 191):** Takes `authToken: Readable<string | undefined>` param. Uses `get(authToken)` in `reloadCandidateData()` and `save()` to pass tokens. Must change to not require token (pass `authToken: ''`).

3. **`CandidateNav.svelte` (line 39, 50):** Destructures `authToken` from context, uses `{#if $authToken}` for conditional rendering. Must change to `isAuthenticated` and `{#if $isAuthenticated}`.

4. **`AdminNav.svelte` (line 35, 41):** Same pattern as CandidateNav. Must change to `isAuthenticated`.

5. **`adminContext.ts` (line 28, 51-52):** Destructures `authToken`, uses in `injectAuthToken()` helper. Must change.

6. **`candidateContext.type.ts` (line 10):** Extends `AuthContext` -- type change flows automatically.

7. **`hooks.server.ts` (line 5, 70):** Uses `AUTH_TOKEN_KEY` for candidate auth redirect. This is the `candidateAuthHandle` -- will be updated in Phase 33 to use session.

### 8. hooks.server.ts candidateAuthHandle

**Current:** Uses `cookies.get(AUTH_TOKEN_KEY)` to check if user is authenticated for redirect logic.
**Target:** Should use `safeGetSession()` from `event.locals` to check session.
**Note:** This is part of AUTH-07 (protected layout guards), as it's the server-side auth redirect.

### 9. candidate/+layout.server.ts

**Current:** Reads JWT cookie and returns `{ token }` to page data.
**Target:** Should return `{ session }` from `safeGetSession()`. This feeds `page.data.session`.

**Note:** Phase 32 already set up `safeGetSession()` in hooks. But the candidate layout server loader still returns `token`. It needs to return `session` instead.

## Validation Architecture

### Input Validation
- Session check: `page.data.session` must be non-null for authenticated state
- Edge Function response: must contain `data.session.action_link` for OTP flow

### State Transition Validation
- Auth context: `isAuthenticated` must be `true` when session exists, `false` when null
- Protected layout: redirect must fire when session is null

### Error Boundary Validation
- Preregister: Edge Function errors must be caught and returned as proper HTTP errors
- Protected layout: failed session -> redirect to login with error

### Integration Point Validation
- `candidateUserDataStore` must work with empty authToken strings
- `CandidateNav`/`AdminNav` must render correctly with `isAuthenticated` boolean
- `adminContext.injectAuthToken()` must pass empty string

## Risk Assessment

### HIGH RISK
- **candidateUserDataStore token dependency**: This store deeply uses `get(authToken)` for save/reload. Must ensure the empty-string-authToken pattern works with the Supabase adapter (it should -- Supabase adapter ignores authToken per design).
- **Protected layout loader type change**: Converting from `+layout.ts` (universal) to `+layout.server.ts` requires careful handling of data passing. However, since the current branch already has a `.ts` file, we should keep it as `.ts` but use session from parent instead of token.

### MEDIUM RISK
- **Consumer ripple**: Multiple files reference `authToken` -- must update all without missing any.
- **Admin context**: Also consumes `authToken` from `AuthContext` type. Must update `adminContext.ts` and its nav.

### LOW RISK
- **Type compatibility**: The `WithAuth` type constraint (`authToken: string`) is satisfied by empty string `''`. No type changes needed in DataWriter.

## Scope Boundaries

### In Scope (Phase 33)
- authContext.ts + authContext.type.ts rewrite
- getUserData.ts rewrite
- Preregister route rewrite (Supabase-only)
- Protected layout loader rewrite (session-based)
- candidateContext.ts update (authToken -> isAuthenticated)
- candidateUserDataStore.ts update (empty string pattern)
- CandidateNav.svelte update (isAuthenticated)
- AdminNav.svelte update (isAuthenticated)
- adminContext.ts update (authToken -> empty string)
- hooks.server.ts candidateAuthHandle update (session-based)
- candidate/+layout.server.ts update (session instead of token)

### Out of Scope
- authToken.ts deletion (Phase 38)
- Login/logout API routes rewrite (Phase 32 auth routes)
- Strapi adapter removal (Phase 38)
- Context system runes rewrite (CTX-01, deferred)
- WithAuth interface refactoring (WAUTH-01, deferred)
- Admin protected layout/server pages that use AUTH_TOKEN_KEY (Phase 38)

## Key Implementation Notes

1. **Empty string pattern**: The Supabase adapter ignores `authToken` -- auth is cookie-based. Pass `''` to satisfy TypeScript.
2. **Keep Svelte store patterns**: Per D-13/D-14, no runes conversion in auth context.
3. **Protected layout stays as `.ts`**: The current branch has `+layout.ts` (universal loader). We can check session via parent data instead of converting to `.server.ts`. The session is available from `page.data.session` set up by the candidate `+layout.server.ts` which will now return session.
4. **Don't import Supabase classes directly in the loader**: The parallel branch imports `SupabaseDataWriter`/`SupabaseDataProvider` directly. Our branch should use the adapter-agnostic `dataWriter`/`dataProvider` promises (the Supabase adapter is already wired via Phase 34's dynamic adapter switch).

## RESEARCH COMPLETE

All technical details gathered. Ready for planning.
