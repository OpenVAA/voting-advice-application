---
phase: 10-authentication-and-roles
verified: 2026-03-13T15:00:00Z
status: passed
score: 21/21 must-haves verified
re_verification: false
---

# Phase 10: Authentication and Roles Verification Report

**Phase Goal:** Implement Supabase Auth integration with role-based access control — user_roles table, Custom Access Token Hook, real RLS policies for all content tables, @supabase/ssr frontend integration, invite-candidate and signicat-callback Edge Functions.
**Verified:** 2026-03-13T15:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | user_roles table exists with enum type, user_id FK, role/scope columns, unique constraint | VERIFIED | `011-auth-tables.sql` line 17-25: CREATE TABLE user_roles with all required columns, UNIQUE constraint, and FK to auth.users |
| 2 | candidates and organizations have auth_user_id FK to auth.users | VERIFIED | `003-entities.sql` lines 6, 41: both tables declare `auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL` |
| 3 | Published boolean columns exist on 10 voter-facing tables | VERIFIED | `011-auth-tables.sql` lines 55-64: ALTER TABLE for elections, candidates, organizations, questions, question_categories, nominations, constituencies, constituency_groups, factions, alliances |
| 4 | Custom Access Token Hook reads user_roles and injects into JWT claims | VERIFIED | `012-auth-hooks.sql` lines 17-46: `custom_access_token_hook` function queries `FROM public.user_roles ur WHERE ur.user_id = (event->>'user_id')::uuid` and calls `jsonb_set(claims, '{user_roles}', ...)` |
| 5 | config.toml enables the custom_access_token hook | VERIFIED | `config.toml` line 267-269: `[auth.hook.custom_access_token]` with `enabled = true` and correct `uri` |
| 6 | RLS helper functions (has_role, can_access_project) use (SELECT auth.jwt()) wrapper | VERIFIED | `012-auth-hooks.sql` lines 71, 113: `(SELECT auth.jwt() -> 'user_roles')` pattern used in both has_role and can_access_project; SECURITY DEFINER with `SET search_path = ''` |
| 7 | supabase_auth_admin has SELECT permission on user_roles (prevents circular RLS) | VERIFIED | `011-auth-tables.sql` lines 36-40: `GRANT ALL ON TABLE public.user_roles TO supabase_auth_admin` + CREATE POLICY for auth_admin_read; `REVOKE ALL FROM authenticated, anon, public` |
| 8 | All deny-all placeholder policies from Phase 9 are replaced with real role-based policies | VERIFIED | `010-rls.sql`: 83 real policy definitions (anon_select, authenticated_select, admin_insert, admin_update, admin_delete, candidate/party-specific). No `CREATE POLICY.*deny_all` lines remain; only `DROP POLICY IF EXISTS` cleanup statements |
| 9 | Anon users can SELECT published data from voter-facing tables | VERIFIED | `010-rls.sql`: `anon_select_{table}` policies using `USING (published = true)` for all 10 voter-facing tables |
| 10 | A candidate can SELECT and UPDATE their own candidate record | VERIFIED | `010-rls.sql` lines 269-286: `authenticated_select_candidates` includes `OR auth_user_id = (SELECT auth.uid())`, `candidate_update_own` policy uses `auth_user_id = (SELECT auth.uid())` |
| 11 | A candidate cannot UPDATE structural fields (project_id, auth_user_id, organization_id, published) | VERIFIED | `013-auth-rls.sql` lines 31-35: `REVOKE UPDATE ON candidates FROM authenticated` then `GRANT UPDATE (name, short_name, info, color, image, sort_order, subtype, custom_data, first_name, last_name, answers, created_at, updated_at)` — structural fields excluded |
| 12 | Project/account/super admins have CRUD on their scope | VERIFIED | `010-rls.sql`: `can_access_project()` helper used in all admin INSERT/UPDATE/DELETE policies; has_role('super_admin') for accounts |
| 13 | @supabase/ssr installed and createSupabaseServerClient factory exists | VERIFIED | `frontend/package.json`: `"@supabase/ssr": "^0.9.0"`, `"@supabase/supabase-js": "^2.99.1"`; `frontend/src/lib/supabase/server.ts`: exports `createSupabaseServerClient` using `createServerClient` from `@supabase/ssr` with cookie getAll/setAll |
| 14 | Browser client factory exists for client-side Supabase access | VERIFIED | `frontend/src/lib/supabase/browser.ts`: exports `createSupabaseBrowserClient` singleton using `createBrowserClient` from `@supabase/ssr` |
| 15 | hooks.server.ts creates per-request Supabase server client on event.locals with safeGetSession | VERIFIED | `frontend/src/hooks.server.ts` lines 6, 24-38, 121-123: imports `createSupabaseServerClient`, creates client at top of handle, defines `safeGetSession` calling getSession then getUser, attaches both to `event.locals` |
| 16 | App.Locals type includes supabase client and safeGetSession | VERIFIED | `frontend/src/app.d.ts` lines 12-18: `supabase: SupabaseClient<Database>` and `safeGetSession(): Promise<{session: Session | null; user: User | null}>` |
| 17 | Candidate login form action calls supabase.auth.signInWithPassword() | VERIFIED | `candidate/login/+page.server.ts` line 19: `await locals.supabase.auth.signInWithPassword({email, password})` — actual implementation, not stub |
| 18 | Forgot-password page calls supabase.auth.resetPasswordForEmail() | VERIFIED | `candidate/forgot-password/+page.svelte` line 38: `supabase.auth.resetPasswordForEmail(email, {redirectTo: ...})` using `createSupabaseBrowserClient()` |
| 19 | invite-candidate Edge Function creates candidate, sends invite, creates role assignment, verifies admin | VERIFIED | `functions/invite-candidate/index.ts`: JWT claims check + getUser() validation (lines 48-83); candidate insert (lines 106-117); inviteUserByEmail (lines 125-141); user_roles insert (lines 146-157); auth_user_id link (lines 162-170); returns 403 for non-admin |
| 20 | signicat-callback Edge Function handles JWE/JWT, creates user+candidate, returns session | VERIFIED | `functions/signicat-callback/index.ts`: `compactDecrypt` via jose (line 59); `jwtVerify` against remote JWKS (line 79); identity extraction (lines 92-111); user creation/lookup (lines 245-263); candidate creation + role assignment (lines 266-306); generateLink for session (line 315) |
| 21 | Column-map.ts updated for auth_user_id and published | VERIFIED | `packages/supabase-types/src/column-map.ts` lines 69-70: `auth_user_id: 'authUserId'` and `published: 'published'` added |

**Score:** 21/21 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/supabase/supabase/schema/011-auth-tables.sql` | user_roles table, auth_user_id columns, published columns, RLS on user_roles | VERIFIED | 75 lines; CREATE TABLE user_roles with enum FK unique constraint; REVOKE/GRANT for auth_admin/service_role; ALTER TABLE for 10 published columns; partial indexes |
| `apps/supabase/supabase/schema/012-auth-hooks.sql` | Custom Access Token Hook and RLS helper functions | VERIFIED | 151 lines; custom_access_token_hook + GRANT EXECUTE; has_role, can_access_project, is_candidate_self all SECURITY DEFINER with SET search_path = '' |
| `apps/supabase/supabase/config.toml` | Auth hook enabled | VERIFIED | [auth.hook.custom_access_token] enabled = true; uri = "pg-functions://postgres/public/custom_access_token_hook" |
| `apps/supabase/supabase/schema/010-rls.sql` | Real RLS policies replacing deny-all placeholders | VERIFIED | 529 lines; 83 real policy CREATE statements; all 16 tables covered; DROP POLICY IF EXISTS cleanup for old deny-all policies |
| `apps/supabase/supabase/schema/013-auth-rls.sql` | Column-level REVOKE for candidate structural field protection | VERIFIED | 55 lines; REVOKE UPDATE on candidates/organizations from authenticated; GRANT UPDATE on allowed columns only |
| `frontend/src/lib/supabase/server.ts` | createSupabaseServerClient factory | VERIFIED | 22 lines; exports createSupabaseServerClient; uses createServerClient from @supabase/ssr with cookie getAll/setAll handlers |
| `frontend/src/lib/supabase/browser.ts` | createSupabaseBrowserClient factory | VERIFIED | 16 lines; exports createSupabaseBrowserClient singleton; uses createBrowserClient from @supabase/ssr |
| `frontend/src/hooks.server.ts` | Per-request Supabase client on event.locals | VERIFIED | Imports createSupabaseServerClient; creates client at top of handle; safeGetSession calls getSession then getUser; attaches to locals |
| `frontend/src/app.d.ts` | Type declarations for Supabase on App.Locals | VERIFIED | SupabaseClient<Database> and safeGetSession on App.Locals; Session/User imported from @supabase/supabase-js |
| `frontend/src/routes/[[lang=locale]]/candidate/login/+page.server.ts` | Login form action using signInWithPassword | VERIFIED | 43 lines; full implementation: signInWithPassword, error mapping to HTTP status, redirect to candidateHome |
| `frontend/src/routes/[[lang=locale]]/candidate/forgot-password/+page.svelte` | Forgot password using resetPasswordForEmail | VERIFIED | createSupabaseBrowserClient imported and used; resetPasswordForEmail called with redirectTo for update-password route |
| `apps/supabase/supabase/functions/invite-candidate/index.ts` | Edge Function for pre-registration invite flow | VERIFIED | 191 lines; full implementation: CORS, admin verification, candidate create, inviteUserByEmail, user_roles insert, auth_user_id link, rollback on failure |
| `apps/supabase/supabase/functions/signicat-callback/index.ts` | Edge Function for Signicat bank auth callback | VERIFIED | 376 lines; full implementation: JWE detection, compactDecrypt, jwtVerify, identity extraction, user lookup/create, candidate creation, role assignment, generateLink |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `012-auth-hooks.sql` | `011-auth-tables.sql` | Hook queries user_roles table | WIRED | Line 36: `FROM public.user_roles ur WHERE ur.user_id = (event->>'user_id')::uuid` |
| `config.toml` | `012-auth-hooks.sql` | Config references hook function | WIRED | [auth.hook.custom_access_token] uri = "pg-functions://postgres/public/custom_access_token_hook" |
| `010-rls.sql` | `012-auth-hooks.sql` | RLS policies call can_access_project() and has_role() | WIRED | 83 policy definitions call `(SELECT can_access_project(...))` and `(SELECT has_role(...))` throughout |
| `010-rls.sql` | `011-auth-tables.sql` | Policies reference published column and auth_user_id | WIRED | `USING (published = true)` in 10 anon policies; `auth_user_id = (SELECT auth.uid())` in candidates/organizations |
| `hooks.server.ts` | `frontend/src/lib/supabase/server.ts` | Imports createSupabaseServerClient | WIRED | Line 6: `import { createSupabaseServerClient } from '$lib/supabase/server'` |
| `frontend/src/lib/supabase/server.ts` | `@supabase/ssr` | Uses createServerClient from package | WIRED | Line 2: `import { createServerClient } from '@supabase/ssr'` |
| `candidate/login/+page.server.ts` | `event.locals.supabase` | Uses Supabase client from locals for signInWithPassword | WIRED | Line 19: `await locals.supabase.auth.signInWithPassword({email, password})` |
| `candidate/forgot-password/+page.svelte` | Supabase Auth | Browser client calls resetPasswordForEmail | WIRED | Line 38: `supabase.auth.resetPasswordForEmail(email, {redirectTo: ...})` |
| `invite-candidate/index.ts` | candidates table | supabaseAdmin.from('candidates').insert() | WIRED | Lines 106-110: insert + select + single() |
| `invite-candidate/index.ts` | user_roles table | supabaseAdmin.from('user_roles').insert() | WIRED | Lines 146-151: insert with user_id, role, scope_type, scope_id |
| `invite-candidate/index.ts` | Supabase Auth | supabaseAdmin.auth.admin.inviteUserByEmail() | WIRED | Lines 125-131: inviteUserByEmail with data + redirectTo |
| `signicat-callback/index.ts` | jose library | JWE decryption and JWT verification | WIRED | Line 26: `import * as jose from 'https://deno.land/x/jose@v5.9.6/index.ts'`; compactDecrypt line 59; jwtVerify line 79 |
| `signicat-callback/index.ts` | candidates table | Create or find candidate record | WIRED | Lines 266-286: maybeSingle() lookup + insert with auth_user_id |
| `signicat-callback/index.ts` | Supabase Auth admin API | Create user and generate magic link | WIRED | Line 245: `supabaseAdmin.auth.admin.createUser(...)`, line 315: `supabaseAdmin.auth.admin.generateLink(...)` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AUTH-01 | 10-03 | Email/password login for candidates via Supabase Auth | SATISFIED | `+page.server.ts` calls `signInWithPassword` via `locals.supabase` |
| AUTH-02 | 10-03 | Password reset for candidates via email link | SATISFIED | `+page.svelte` calls `resetPasswordForEmail` via browser client |
| AUTH-03 | 10-04 | Candidate pre-registration invite via Edge Function | SATISFIED | `invite-candidate/index.ts`: full flow (admin check, candidate create, inviteUserByEmail, role assign) |
| AUTH-04 | 10-01 | user_roles table with scoped role assignments | SATISFIED | `011-auth-tables.sql`: user_roles with user_id, role, scope_type, scope_id, unique constraint |
| AUTH-05 | 10-02 | Five role types enforced via RLS | SATISFIED | `010-rls.sql`: candidate self-update, party admin for party data, project_admin via can_access_project, account_admin, super_admin — 83 policies across all tables |
| AUTH-06 | 10-01 | Custom Access Token Hook injects roles into JWT | SATISFIED | `012-auth-hooks.sql`: custom_access_token_hook reads user_roles, injects `user_roles` array into claims |
| AUTH-07 | 10-03 | SvelteKit hooks.server.ts creates per-request Supabase client via @supabase/ssr | SATISFIED | `hooks.server.ts`: createSupabaseServerClient at top of handle; safeGetSession on locals |
| AUTH-08 | 10-05 | Signicat OIDC bank auth integrated with Supabase session management | SATISFIED | `signicat-callback/index.ts`: JWE decrypt + JWT verify + user provision + generateLink |
| MTNT-04 | 10-02 | RLS policies enforce project-level data isolation via JWT role claims | SATISFIED | `010-rls.sql`: all content table policies use `can_access_project(project_id)` from JWT claims |
| MTNT-05 | 10-01 | Candidate-to-auth-user link explicit in schema | SATISFIED | `003-entities.sql` line 6: `auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL` on candidates |
| MTNT-06 | 10-01 | Party-to-auth-user link in schema (party admin users) | SATISFIED | `003-entities.sql` line 41: `auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL` on organizations |

**All 11 requirements satisfied. No orphaned requirements found.**

---

## Anti-Patterns Found

No blocking anti-patterns detected.

| File | Pattern | Severity | Notes |
|------|---------|----------|-------|
| `signicat-callback/index.ts` | `// deno-lint-ignore no-explicit-any` on lines 118, 141 | INFO | Acceptable in Deno Edge Functions where the Supabase admin client type lacks full inference. Does not affect runtime correctness. |
| `signicat-callback/index.ts` | Placeholder email `${userId}@bank-auth.placeholder` for magic link | INFO | Intentional design decision documented in SUMMARY; candidate prompted to enter real email after bank auth. Not a stub — it is the specified architecture. |

---

## Human Verification Required

The following items cannot be verified programmatically:

### 1. End-to-end login flow

**Test:** Start the local Supabase stack (`supabase start`). Navigate to `/candidate/login`. Enter credentials from seed data (admin or candidate test user). Submit form.
**Expected:** Cookie is set with Supabase session; redirect to `/candidate` home.
**Why human:** Cookie setting and redirect behavior require a live browser session.

### 2. Password reset email delivery

**Test:** Navigate to `/candidate/forgot-password`. Enter a seeded test user email. Submit.
**Expected:** Email appears in Inbucket at `http://127.0.0.1:54324`. Clicking the link redirects to `/candidate/update-password`.
**Why human:** Email delivery and link redirect require a running Supabase stack and browser.

### 3. Custom Access Token Hook JWT injection

**Test:** Log in as a user with a role in user_roles. Decode the returned access token (base64 the middle part).
**Expected:** JWT payload contains `user_roles: [{role, scope_type, scope_id}]` matching the seed data.
**Why human:** Requires active Supabase instance and JWT inspection.

### 4. RLS policy enforcement — anon vs authenticated vs admin

**Test:** Query the candidates table as anon (no auth header). Query as candidate user. Query as project_admin.
**Expected:** Anon sees only `published = true` rows; candidate sees own record regardless of published; admin sees all project rows.
**Why human:** Requires live PostgREST queries with different auth tokens.

### 5. Column-level structural field protection

**Test:** Authenticate as a candidate user. Attempt to PATCH `project_id` on the candidate's own record via PostgREST.
**Expected:** Request returns an error (column not in granted UPDATE columns).
**Why human:** Requires a live PostgREST request with a valid candidate JWT.

### 6. invite-candidate Edge Function live call

**Test:** Run `supabase functions serve invite-candidate`. POST with a valid admin JWT and candidate details.
**Expected:** 201 response with candidateId and userId; invite email appears in Inbucket.
**Why human:** Requires deployed Edge Function runtime and active auth stack.

### 7. signicat-callback Edge Function live call

**Test:** POST to the function with a mock JWE token (or plain JWT if SIGNICAT_JWKS_URI is configured).
**Expected:** User created in auth.users, candidate record created, magic link returned.
**Why human:** Requires Signicat JWKS configuration or mock keys; live Deno runtime.

---

## Summary

All 21 must-have truths verified across the five plans (10-01 through 10-05). All 11 requirement IDs (AUTH-01 through AUTH-08, MTNT-04, MTNT-05, MTNT-06) are satisfied with direct code evidence. All 9 task commits verified in git history.

The implementation is complete and substantive — no stubs, no placeholders, no orphaned artifacts. Every key link (schema → hook → config → RLS → frontend → Edge Functions) is wired with evidence from actual file contents.

Human verification is needed only for live runtime behavior (cookie setting, email delivery, JWT token content) which cannot be verified by static analysis.

---

_Verified: 2026-03-13T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
