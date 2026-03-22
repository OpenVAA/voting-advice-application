# Phase 33: Auth Integration - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire auth context, preregister Edge Function, and protected layout guards into the application using Supabase sessions from Phase 32. No dual-path — Supabase only.

</domain>

<decisions>
## Implementation Decisions

### Auth context (AUTH-03)
- **D-01:** Replace the auth context entirely with Supabase version — no dual-path with Strapi
- **D-02:** `isAuthenticated` derived from `page.data.session` (not `authToken` from `page.data.token`)
- **D-03:** Auth methods (logout, resetPassword, requestForgotPasswordEmail, setPassword) use Supabase sessions — authToken passed as empty string to satisfy WithAuth type constraint
- **D-04:** Remove `authToken` export from auth context — consumers use `isAuthenticated` boolean instead
- **D-05:** `setPassword` no longer requires `currentPassword` — Supabase handles via session

### getUserData utility (AUTH-03)
- **D-06:** Replace current getUserData (requires authToken/cookies/parent overloads) with Supabase version (session-based, no token needed)
- **D-07:** getUserData checks `page.data.session` via parent, not cookie-based token

### Preregister route (AUTH-06)
- **D-08:** Supabase-only path — no Strapi fallback. Remove the `staticSettings.dataAdapter.type` switch
- **D-09:** Route invokes `signicat-callback` Edge Function via `locals.supabase.functions.invoke()`
- **D-10:** Establishes Supabase session from magic link returned by Edge Function

### Protected layout guards (AUTH-07)
- **D-11:** Protected layout uses `safeGetSession()` from `event.locals` (Phase 32) instead of JWT cookie check
- **D-12:** Redirect unauthenticated users to login page with `redirectTo` param

### Svelte patterns
- **D-13:** Keep existing Svelte store patterns in auth context (derived, writable, get) — do NOT convert to runes
- **D-14:** Context system runes rewrite is deferred to CTX-01 — only after 100% E2E pass with Supabase

### Claude's Discretion
- Whether candidateContext needs updates to work with new `isAuthenticated` (likely minimal since parallel branch already has this)
- Error handling specifics in preregister route
- How to handle the `authToken` type constraint in WithAuth interface (empty string pattern)

</decisions>

<specifics>
## Specific Ideas

- No dual-path anywhere — clean Supabase-only implementation
- Auth context on parallel branch is a clean reference, just needs path adaptation to apps/frontend/
- candidateContext already uses `isAuthenticated` from authContext on parallel branch — should work

</specifics>

<canonical_refs>
## Canonical References

### Parallel branch auth context
- `git show feat-gsd-supabase-migration:frontend/src/lib/contexts/auth/authContext.ts` — Supabase auth context (isAuthenticated, cookie-based methods)
- `git show feat-gsd-supabase-migration:frontend/src/lib/contexts/auth/authContext.type.ts` — AuthContext type (isAuthenticated replaces authToken)
- `git show feat-gsd-supabase-migration:frontend/src/lib/auth/getUserData.ts` — Session-based getUserData

### Parallel branch routes
- `git show "feat-gsd-supabase-migration:frontend/src/routes/[[lang=locale]]/api/candidate/preregister/+server.ts"` — Preregister with Edge Function (has dual-path, take Supabase path only)
- `git show "feat-gsd-supabase-migration:frontend/src/routes/[[lang=locale]]/candidate/(protected)/+layout.svelte"` — Protected layout with session guard

### Current branch targets
- `apps/frontend/src/lib/contexts/auth/authContext.ts` — Replace with Supabase version
- `apps/frontend/src/lib/contexts/auth/authContext.type.ts` — Update type (isAuthenticated replaces authToken)
- `apps/frontend/src/lib/auth/getUserData.ts` — Replace with session-based version
- `apps/frontend/src/lib/auth/authToken.ts` — Will be removed (AUTH_TOKEN_KEY no longer needed)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Auth context structure (getAuthContext/initAuthContext pattern) — same on both branches
- candidateContext consumes authContext via `getAuthContext()` — interface change from authToken to isAuthenticated

### Established Patterns
- Svelte context pattern with Symbol keys, get/init functions
- prepareDataWriter utility for lazy DataWriter initialization
- `page.data.session` available after Phase 32 hooks set it up

### Integration Points
- Phase 32 provides `event.locals.supabase` and `safeGetSession()` — used by protected layout and preregister
- Phase 34 provides adapter mixin — used by DataWriter in auth methods
- candidateContext depends on authContext — must update to use isAuthenticated instead of authToken
- Phase 38 does final Strapi cleanup (any residual references)

</code_context>

<deferred>
## Deferred Ideas

- Context system rewrite with Svelte 5 runes ($state/$derived) — CTX-01, after 100% E2E pass
- WithAuth interface refactoring (remove empty string pattern) — WAUTH-01

</deferred>

---

*Phase: 33-auth-integration*
*Context gathered: 2026-03-22*
