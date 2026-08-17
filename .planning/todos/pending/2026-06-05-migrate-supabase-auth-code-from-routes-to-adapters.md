---
created: "2026-06-05T00:00:00.000Z"
title: Migrate Supabase-specific (auth) code from frontend routes into the Supabase adapters
priority: high
area: frontend
files:
  - apps/frontend/src/routes/admin/login/+page.server.ts
  - apps/frontend/src/routes/candidate/login/+page.server.ts
  - apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.server.ts
  - apps/frontend/src/routes/admin/(protected)/question-info/+page.server.ts
  - apps/frontend/src/routes/admin/+layout.server.ts
  - apps/frontend/src/routes/candidate/+layout.server.ts
  - apps/frontend/src/routes/candidate/(protected)/+layout.server.ts
  - apps/frontend/src/routes/candidate/auth/callback/+server.ts
  - apps/frontend/src/routes/candidate/auth/logout/+server.ts
  - apps/frontend/src/routes/api/auth/login/+server.ts
  - apps/frontend/src/routes/api/auth/logout/+server.ts
  - apps/frontend/src/routes/api/candidate/preregister/+server.ts
  - apps/frontend/src/hooks.server.ts  # safeGetSession
source: Surfaced during /gsd-verify-work 97 (admin nav auth-reactivity UAT). Operator-directed follow-up.
---

## Problem

Supabase-specific logic (auth especially) is implemented **directly inside SvelteKit route
files** rather than behind the Supabase adapter layer (`apps/frontend/src/lib/api/adapters/supabase/`),
which is supposed to be the single data-access abstraction (per CLAUDE.md "Frontend Data Flow"
and the canonical adapter paradigm). Route handlers call `locals.supabase.auth.*` and
`safeGetSession()` ad hoc:

- **Auth actions call Supabase straight from routes:**
  - `admin/login/+page.server.ts` and `candidate/login/+page.server.ts` →
    `locals.supabase.auth.signInWithPassword(...)` + role check via decoded JWT `user_roles` claim.
  - `candidate/auth/callback/+server.ts` → `verifyOtp` + `getUser`.
  - `candidate/auth/logout/+server.ts` and `api/auth/logout/+server.ts` → `signOut`.
  - `api/candidate/preregister/+server.ts` → `functions.invoke('identity-callback')` + `verifyOtp`.
- **The nested `/api/auth/login` route is a footgun:** it inits the dataWriter with a *plain*
  Supabase client (no `serverClient`), so `signInWithPassword` there does NOT write the session
  cookie onto the response. This silently broke **admin login** (it returned 200 but set no
  cookie → every protected `/admin` request bounced to login). The candidate login action already
  worked around this by calling `locals.supabase` directly; admin login was just never migrated.
  Fixed reactively during Phase 97 verification by mirroring the candidate pattern — but the
  underlying inconsistency (two parallel login paths, one cookie-correct and one not) remains and
  invites the same bug elsewhere.
- **Duplicated role-check logic:** both login actions hand-decode `atob(access_token.split('.')[1])`
  and inspect `user_roles` inline (admin checks `super_admin`/`account_admin`/`project_admin`;
  candidate checks `candidate`/`party`). This logic already exists in
  `supabaseDataWriter.getBasicUserData` (the `role: 'candidate' | 'admin'` mapping) — it should
  not be reimplemented in routes.

Net effect: the server/client boundary leaks Supabase internals into routes, login cookie-handling
is inconsistent and easy to get wrong, and role logic is duplicated.

## Solution

1. **Move auth operations into the adapter / a thin server-auth service** so routes call a typed
   API (e.g. `dataWriter.login()`, `dataWriter.logout()`, `auth.verifyOtp()`, `auth.getSessionUser()`)
   instead of `locals.supabase.auth.*` directly. Crucially, the login path must always use the
   **cookie-capable** server client (`serverClient: locals.supabase` / `createServerClient`) so the
   session cookie lands on the form-action response — there should be exactly ONE correct login path.
2. **Retire or fix the nested `/api/auth/login` route** so it can no longer be used in a way that
   drops the session cookie (either delete it in favor of the action-level `locals.supabase` path,
   or have it accept/use the request's `serverClient`).
3. **Centralize the admin/candidate role check** (reuse `getBasicUserData`'s role mapping) instead
   of inline JWT decoding in each login action.
4. **Audit `safeGetSession`** (`hooks.server.ts`): it currently calls `getSession()` then `getUser()`
   and returns `{ session: null, user: null }` on ANY `getUser` error, silently. Review:
   - Does swallowing the `getUser` error hide real problems (expired/invalid token vs. transient
     network/auth-server error)? Should it log/distinguish?
   - It is the single gatekeeper for all protected routes — confirm it's correct, that the
     `getSession` (cookie-trust) → `getUser` (server-verify) ordering is intentional, and that there
     are tests for the null/expired/invalid-token branches.
   - Consider exposing it through the adapter too so route code doesn't depend on `event.locals`
     plumbing directly.

## Context

- Discovered while verifying Phase 97 CONS-03 (admin nav auth-reactivity): admin login couldn't
  establish a session at all because of the nested-`/api/auth/login` plain-client cookie gap.
- The admin-login fix landed during verification (admin login now mirrors candidate login). This
  todo is the broader cleanup that makes that pattern the ONLY pattern and pulls the Supabase
  surface back behind the adapter boundary.
- Pairs with `2026-06-04-extend-svelte-store-eslint-guard-app-wide.md` as part of tightening the
  frontend's architectural boundaries post-v2.11.
- Relevant abstraction: `apps/frontend/src/lib/api/adapters/supabase/` (dataWriter / dataProvider /
  supabaseAdapter mixin), `$lib/supabase/server.ts` (`createSupabaseServerClient`).
