---
phase: 32
status: passed
verified: 2026-03-22
---

# Phase 32: Auth Infrastructure - Verification

## Phase Goal
The foundational Supabase auth plumbing is in place -- cookie-based sessions with PKCE, server hooks, client setup, and API routes -- all adapted to Svelte 5

## Success Criteria Results

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Browser and server Supabase clients configured in lib/supabase/ | PASS | `browser.ts` exports `createSupabaseBrowserClient`, `server.ts` exports `createSupabaseServerClient`, both typed with `Database` |
| 2 | hooks.server.ts refreshes Supabase sessions on every request | PASS | `sequence(supabaseHandle, paraglideHandle, candidateAuthHandle)` with `getSession()` + `getUser()` verification |
| 3 | Auth callback route exchanges auth codes for sessions | PASS | `candidate/auth/callback/+server.ts` with `verifyOtp` handling recovery/invite/email/signup |
| 4 | Logout route destroys Supabase session and clears cookies | PASS | `candidate/auth/logout/+server.ts` with `signOut({ scope: 'local' })` |
| 5 | No Strapi JWT token references in hooks or auth utilities | NOTE | AUTH_TOKEN_KEY preserved in candidateAuthHandle per CONTEXT.md D-13/D-14 (Strapi coexistence until Phase 38). New Supabase auth infrastructure has no Strapi references. |

## Requirements Coverage

| Requirement | Description | Plan | Status |
|-------------|-------------|------|--------|
| AUTH-01 | Supabase cookie-based sessions with PKCE | 32-02 | PASS |
| AUTH-02 | hooks.server.ts rewritten for Supabase session handling | 32-02 | PASS |
| AUTH-04 | Browser and server Supabase client setup | 32-01 | PASS |
| AUTH-05 | Auth API routes (callback, logout) | 32-03 | PASS |

## Must-Haves Verified

- [x] Browser client singleton at `lib/supabase/browser.ts`
- [x] Server client factory at `lib/supabase/server.ts`
- [x] Both clients typed with `Database` from `@openvaa/supabase-types`
- [x] `supabaseHandle` creates per-request server client in hooks
- [x] `safeGetSession` verifies with `getUser()` (security pattern)
- [x] `sequence()` composes supabase, paraglide, and candidateAuth handlers
- [x] `App.Locals` extended with `supabase` and `safeGetSession`
- [x] Auth callback handles 4 flow types (recovery, invite, email, signup)
- [x] Auth logout calls server-side `signOut`
- [x] Paraglide middleware preserved
- [x] Strapi auth coexistence maintained (candidateAuthHandle, AUTH_TOKEN_KEY, token in PageData)
- [x] `filterSerializedResponseHeaders` passes Supabase API headers

## Human Verification Items

1. **PKCE token exchange end-to-end**: Requires running Supabase instance to test actual auth flow
2. **Session cookie behavior**: Verify httpOnly cookies are set/cleared correctly in browser DevTools
3. **Logout clears httpOnly cookies**: Confirm cookies are removed after calling logout endpoint

## Notes

- Success Criteria 5 from ROADMAP.md ("No Strapi JWT token references remain in hooks or auth utilities") conflicts with CONTEXT.md decisions D-13/D-14 which explicitly require Strapi auth preservation. CONTEXT.md decisions take precedence. Phase 38 handles full Strapi removal.
- `@supabase/ssr: ^0.9.0` added to Yarn catalog (not previously present)
- Route paths use Paraglide-style routing (no `[[lang=locale]]` wrapper) — adapted from parallel branch pattern

---

*Phase: 32-auth-infrastructure*
*Verified: 2026-03-22*
