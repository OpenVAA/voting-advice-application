---
phase: 14-service-and-auth-bug-fixes
verified: 2026-03-15T16:00:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Phase 14: Service & Auth Bug Fixes — Verification Report

**Phase Goal:** Fix schema bugs and integration issues found in milestone audit
**Verified:** 2026-03-15T16:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `bulk_import` upsert works with partial unique indexes (ON CONFLICT matches WHERE predicate) | VERIFIED | `016-bulk-operations.sql` line 197 contains `ON CONFLICT (project_id, external_id) WHERE external_id IS NOT NULL DO UPDATE SET`; comment on line 195 updated to say "partial unique index" |
| 2 | Entity DELETE triggers successfully resolve `delete_storage_object` via schema-qualified call | VERIFIED | `014-storage.sql` has 4 `PERFORM public.delete_storage_object(...)` calls across `cleanup_entity_storage_files` (lines 401-402) and `cleanup_old_image_file` (lines 482, 490); zero unqualified calls remain |
| 3 | Password reset email redirects to existing `/candidate/password-reset` route | VERIFIED | `forgot-password/+page.svelte` line 39 contains `redirectTo: \`...\${$page.params.lang ?? 'en'}/candidate/password-reset\``; old broken `update-password` string absent |
| 4 | `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` present in `.env.example` and `docker-compose.dev.yml` | VERIFIED | `.env.example` lines 109-110 contain both vars with local dev defaults; `docker-compose.dev.yml` lines 14-15 pass both to frontend container |

**Score:** 4/4 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/supabase/supabase/schema/016-bulk-operations.sql` | Fixed ON CONFLICT clause with WHERE predicate | VERIFIED | Line 197: `ON CONFLICT (project_id, external_id) WHERE external_id IS NOT NULL DO UPDATE SET` |
| `apps/supabase/supabase/schema/014-storage.sql` | Schema-qualified `public.delete_storage_object` calls | VERIFIED | 4 of 4 call sites use `PERFORM public.delete_storage_object(...)` — no unqualified calls |
| `apps/supabase/supabase/migrations/00001_initial_schema.sql` | Regenerated migration incorporating both SQL fixes | VERIFIED | Migration line 2561 contains `ON CONFLICT...WHERE external_id IS NOT NULL`; 4 occurrences of `public.delete_storage_object` found |
| `frontend/src/routes/[[lang=locale]]/candidate/forgot-password/+page.svelte` | Corrected redirect URL | VERIFIED | Line 39 uses `/candidate/password-reset`; target route exists at `frontend/src/routes/[[lang=locale]]/candidate/password-reset/+page.svelte` |
| `.env.example` | Supabase env var defaults for local dev | VERIFIED | Lines 109-110 contain `PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` and `PUBLIC_SUPABASE_ANON_KEY=<standard-local-default>` |
| `docker-compose.dev.yml` | Supabase env vars passed to frontend container | VERIFIED | Lines 14-15 contain `PUBLIC_SUPABASE_URL: ${PUBLIC_SUPABASE_URL}` and `PUBLIC_SUPABASE_ANON_KEY: ${PUBLIC_SUPABASE_ANON_KEY}` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `016-bulk-operations.sql` ON CONFLICT clause | `015-external-id.sql` partial unique indexes | WHERE predicate `external_id IS NOT NULL` matches index definition | VERIFIED | `015-external-id.sql` defines `CREATE UNIQUE INDEX ... ON elections (project_id, external_id) WHERE external_id IS NOT NULL` — predicate is an exact match |
| `014-storage.sql` cleanup functions | `public.delete_storage_object` function | Schema-qualified PERFORM calls in SECURITY DEFINER functions with `SET search_path = ''` | VERIFIED | All 4 call sites use `public.delete_storage_object`; no unqualified calls remain; the pattern is consistent with all other cross-function calls in `SET search_path = ''` functions in this codebase |

---

### Requirements Coverage

| Requirement | Source Plan | Description (from REQUIREMENTS.md) | Status | Evidence |
|-------------|-------------|-------------------------------------|--------|----------|
| SRVC-04 (fix) | 14-01-PLAN.md | Bulk data import via Postgres RPC function with transactional guarantee | SATISFIED | ON CONFLICT clause in `_bulk_upsert_record` now matches partial unique index; fix is present in both schema source and regenerated migration |
| SRVC-01 (fix) | 14-01-PLAN.md | Supabase Storage buckets configured for candidate photos, party images, and public assets with RLS | SATISFIED | `cleanup_entity_storage_files` and `cleanup_old_image_file` now call `public.delete_storage_object` — DELETE and UPDATE triggers will resolve correctly at runtime |
| AUTH-02 (fix) | 14-01-PLAN.md | Password reset for candidates via email link | SATISFIED | `redirectTo` in forgot-password page now points to existing `/candidate/password-reset` route instead of nonexistent `/candidate/update-password` |
| INFRA-02 (fix) | 14-01-PLAN.md | `supabase start` launches all backend services — gap interpretation: missing env vars block frontend-to-Supabase connectivity in local dev | SATISFIED | `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` added to `.env.example` and `docker-compose.dev.yml`; frontend container will receive them |

**Note on INFRA-02:** REQUIREMENTS.md maps INFRA-02 to Phase 8 ("supabase start launches all backend services") and the traceability table does not reference Phase 14. Phase 14 uses "INFRA-02 (fix)" to denote fixing a gap in that requirement — missing env vars that prevent the frontend from connecting to a running Supabase instance. This is an additive fix to an already-complete requirement, not a re-assignment. The REQUIREMENTS.md traceability table was not updated to include Phase 14, but this is a documentation gap only (REQUIREMENTS.md was last updated 2026-03-12 before Phase 14 was added to the roadmap). No orphaned requirements are mapped to Phase 14 in REQUIREMENTS.md.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `forgot-password/+page.svelte` | 74, 76 | `placeholder` attribute | Info | Legitimate HTML `placeholder` attribute on email input field — not an implementation stub |

No blocking anti-patterns found.

---

### Human Verification Required

#### 1. Password Reset End-to-End Flow

**Test:** With local Supabase running, submit the forgot-password form with a valid candidate email address.
**Expected:** Email received in Mailpit contains a link pointing to `http://localhost:5173/en/candidate/password-reset?...` (not `update-password`). Clicking the link opens the password-reset page rather than a 404.
**Why human:** The redirect URL fix is verified at the source level, but the full Supabase auth email/PKCE flow cannot be verified by static analysis. The existing password-reset page uses Strapi's `resetPassword` rather than Supabase's `exchangeCodeForSession` (deferred to v3+ per ADPT-01/ADPT-02), so the link may land on the right page but the token exchange may not complete — this distinction needs a running environment to confirm.

#### 2. bulk_import Upsert with Partial Index at Runtime

**Test:** With local Supabase running, call `bulk_import_entities` RPC with entities that have `external_id` set. Run a second call with the same external IDs to trigger the upsert path.
**Expected:** Second call updates existing rows (no duplicate key errors, no "there is no unique or exclusion constraint matching the ON CONFLICT specification" errors).
**Why human:** The fix is syntactically correct and the ON CONFLICT predicate matches the index definition, but runtime validation requires a live Postgres instance. `supabase db reset` was reported as successful per SUMMARY claims but cannot be re-verified here without a running Supabase instance.

#### 3. Entity DELETE Storage Cleanup at Runtime

**Test:** With local Supabase running, upload a photo for a candidate entity, then DELETE the candidate record.
**Expected:** No trigger error ("function delete_storage_object does not exist"); storage file is cleaned up.
**Why human:** The search_path fix is structurally correct, but the trigger fires asynchronously via `pg_net` HTTP calls to the Storage API. Runtime behavior (network calls, bucket permissions) cannot be verified statically.

---

### Commit Verification

| Commit | Hash | Status |
|--------|------|--------|
| Fix ON CONFLICT partial index and storage search_path bugs | `3a1e2be72` | VERIFIED in git log |
| Fix password reset redirect and add Supabase env vars | `10f2d7d9f` | VERIFIED in git log |

---

### Gaps Summary

No gaps found. All 4 must-have truths are verified against actual codebase content. All 6 declared artifacts exist and contain the required patterns. Both key links are structurally sound. Three items require human verification with a live Supabase instance, but these are runtime validation steps for syntactically correct fixes — not blockers to the phase goal.

---

_Verified: 2026-03-15T16:00:00Z_
_Verifier: Claude (gsd-verifier)_
