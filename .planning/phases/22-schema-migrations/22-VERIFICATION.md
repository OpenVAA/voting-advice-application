---
phase: 22-schema-migrations
verified: 2026-03-18T18:15:00Z
status: passed
score: 4/4 success criteria verified
re_verification: false
---

# Phase 22: Schema Migrations Verification Report

**Phase Goal:** All schema objects that adapter features depend on exist in the Supabase database
**Verified:** 2026-03-18T18:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | App customization data can be stored and retrieved from Supabase (customization JSONB column on app_settings or equivalent) | VERIFIED | `007-app-settings.sql` line 22: `ALTER TABLE app_settings ADD COLUMN customization jsonb DEFAULT '{}'::jsonb;` — present in schema source and migration line 2845 |
| 2 | User feedback can be submitted and stored in a dedicated feedback table with appropriate RLS | VERIFIED | `018-feedback.sql` defines `CREATE TABLE feedback` with all required columns, CHECK constraint, rate limiting trigger, and RLS policies (`anon_insert_feedback`, `admin_select_feedback`, `admin_delete_feedback`) in `010-rls.sql` |
| 3 | Candidate terms-of-use acceptance is tracked with a timestamp column on the candidates table | VERIFIED | `003-entities.sql` line 51: `ALTER TABLE candidates ADD COLUMN terms_of_use_accepted timestamptz;` — column-level GRANT updated in `013-auth-rls.sql` lines 32-36 to include it |
| 4 | Candidate answers can be atomically upserted via an RPC function that handles both insert and update | VERIFIED | `006-answers-jsonb.sql` lines 195-237: `CREATE OR REPLACE FUNCTION upsert_answers(uuid, jsonb, boolean)` with `SECURITY INVOKER`, merge/overwrite branches, null-stripping, and `GRANT EXECUTE ... TO authenticated` |

**Score:** 4/4 success criteria verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/supabase/supabase/schema/007-app-settings.sql` | app_settings table with customization column | VERIFIED | Contains `ALTER TABLE app_settings ADD COLUMN customization jsonb DEFAULT '{}'::jsonb` at line 22 |
| `apps/supabase/supabase/schema/003-entities.sql` | candidates table with terms_of_use_accepted column | VERIFIED | Contains `ALTER TABLE candidates ADD COLUMN terms_of_use_accepted timestamptz` at line 51 |
| `apps/supabase/supabase/schema/013-auth-rls.sql` | column-level GRANT for candidates including terms_of_use_accepted | VERIFIED | GRANT UPDATE block at lines 32-36 includes `terms_of_use_accepted` on its own line |
| `apps/supabase/supabase/schema/006-answers-jsonb.sql` | upsert_answers RPC function definition | VERIFIED | Full function body at lines 195-237 with `SECURITY INVOKER`, single UPDATE per branch, null stripping, GRANT to authenticated |
| `apps/supabase/supabase/schema/018-feedback.sql` | feedback table DDL and rate limiting trigger | VERIFIED | `CREATE TABLE feedback` with CHECK constraint at lines 22-34, private schema rate limit table, SECURITY DEFINER trigger function |
| `apps/supabase/supabase/schema/010-rls.sql` | RLS policies for feedback table | VERIFIED | Lines 511-527: `anon_insert_feedback`, `admin_select_feedback`, `admin_delete_feedback` — no UPDATE policy (locked decision) |
| `apps/supabase/supabase/schema/009-indexes.sql` | feedback table indexes | VERIFIED | Lines 42-43: `idx_feedback_project_id` and `idx_feedback_created_at` |
| `apps/supabase/supabase/migrations/00001_initial_schema.sql` | Consolidated migration with all Phase 22 additions | VERIFIED | Lines 2839-2905 (SCHM-01/03/04 block) and lines 2908+ (SCHM-02 block) — both phase 22 blocks present |
| `apps/supabase/supabase/tests/database/10-schema-migrations.test.sql` | pgTAP tests for SCHM-01 through SCHM-04 | VERIFIED | 40 tests (`SELECT plan(40)`) covering column existence, types, RLS enforcement, CHECK constraints, rate limiting, RPC merge/overwrite/null-stripping |
| `apps/supabase/supabase/tests/database/00-helpers.test.sql` | Updated create_test_data() with feedback test rows | VERIFIED | Lines 73-74: feedback_a/feedback_b IDs documented; lines 147-148: test_id() entries; lines 389-390: INSERT rows in create_test_data() |
| `packages/supabase-types/src/database.ts` | Auto-generated Supabase TypeScript types from live schema | VERIFIED | Line 117: `customization: Json | null` on app_settings; line 173: `terms_of_use_accepted: string | null` on candidates; lines 575-605: complete feedback Row/Insert/Update types; line 1135: upsert_answers function Args/Returns |
| `packages/supabase-types/src/column-map.ts` | COLUMN_MAP with termsOfUseAccepted mapping | VERIFIED | Line 69: `terms_of_use_accepted: 'termsOfUseAccepted'` in COLUMN_MAP with PROPERTY_MAP auto-derived at line 79 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `schema/013-auth-rls.sql GRANT UPDATE` | `candidates.terms_of_use_accepted` | explicit column listing in GRANT UPDATE statement | WIRED | `terms_of_use_accepted` appears at line 35 inside the GRANT UPDATE block (lines 32-36) |
| `upsert_answers function` | `validate_answers_jsonb() trigger` | the UPDATE it issues fires the trigger automatically | WIRED | `SECURITY INVOKER` at line 202 confirmed. Trigger `validate_answers_before_insert_or_update` on candidates (lines 74-76 of 006-answers-jsonb.sql) fires on any UPDATE including those from upsert_answers |
| `anon INSERT to feedback` | `check_feedback_rate_limit BEFORE INSERT trigger` | trigger fires before INSERT, extracts IP from request.headers, blocks if >5/5min | WIRED | `CREATE TRIGGER check_feedback_rate_limit BEFORE INSERT ON public.feedback` at line 96-98 of 018-feedback.sql; pattern `check_feedback_rate_limit` confirmed in both source and migration |
| `private.feedback_rate_limits table` | PostgREST API exposure | private schema not exposed by PostgREST | WIRED (isolated) | `CREATE SCHEMA IF NOT EXISTS private` at line 11; table at line 13; rate limit function uses `SET search_path = ''` (line 47) to explicitly qualify all references as `private.*` |
| `packages/supabase-types/src/database.ts` | Supabase PostgREST client type inference | adapter classes import Database type for typed query results | WIRED | feedback table at `Database['public']['Tables']['feedback']` (line 575); upsert_answers at `Database['public']['Functions']['upsert_answers']` (line 1135) |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| SCHM-01 | 22-01, 22-03, 22-04 | app_customization storage added to Supabase schema | SATISFIED | `customization jsonb DEFAULT '{}'::jsonb` column exists in schema source (007-app-settings.sql line 22) and migration (line 2845); typed in database.ts (line 117); tested in 10-schema-migrations.test.sql (tests 1-7) |
| SCHM-02 | 22-02, 22-03, 22-04 | feedback table added to Supabase schema | SATISFIED | `CREATE TABLE feedback` in 018-feedback.sql with CHECK constraint, private rate limiting, RLS in 010-rls.sql, indexes in 009-indexes.sql, all in migration; typed in database.ts (line 575); tested (tests 8-25) |
| SCHM-03 | 22-01, 22-03, 22-04 | terms_of_use_accepted column added to candidates table | SATISFIED | `terms_of_use_accepted timestamptz` in 003-entities.sql (line 51); GRANT UPDATE extended in 013-auth-rls.sql (line 35); column-map.ts entry at line 69; database.ts line 173; tested (tests 26-32) |
| SCHM-04 | 22-01, 22-03, 22-04 | Answer upsert RPC for atomic answer writes | SATISFIED | `upsert_answers(uuid, jsonb, boolean)` with SECURITY INVOKER in 006-answers-jsonb.sql (lines 195-237); GRANT to authenticated (line 237); typed in database.ts (line 1135); tested with merge/overwrite/null-strip/RLS isolation (tests 33-40) |

No orphaned requirements: all four SCHM-01 through SCHM-04 are claimed by at least one plan and all four are mapped to Phase 22 in REQUIREMENTS.md.

### Anti-Patterns Found

No anti-patterns detected across all modified files:

- No TODO/FIXME/PLACEHOLDER comments in schema source files (the TODO comment in 006-answers-jsonb.sql was removed as part of plan 22-01 execution)
- No stub implementations — all SQL functions have complete, substantive bodies
- No empty implementations or console.log-only handlers
- SECURITY DEFINER function (`check_feedback_rate_limit`) has `SET search_path = ''` hardening

### Human Verification Required

One item cannot be fully verified without a running database environment:

**1. supabase db reset applies without errors**

**Test:** Run `cd apps/supabase && supabase db reset` against a fresh local Supabase instance.
**Expected:** Exit code 0, no SQL errors, all 244 pgTAP tests passing after reset.
**Why human:** Migration idempotency and test execution require a running Postgres/Supabase container. The SUMMARY documents report exit 0 and 244 passing tests, but this verifier cannot execute the migration live to confirm.

Note: This is low risk. The pgTAP test file (`10-schema-migrations.test.sql`) covers all four schema objects with 40 assertions, the plan count matches exactly, and all 11 other schema source files have correct content as verified above.

### Gaps Summary

No gaps. All four success criteria are met:

1. The `customization` JSONB column exists on `app_settings` with default `'{}'::jsonb` in both schema source and consolidated migration, and is typed in `database.ts`.
2. The `feedback` table exists with all required columns (`id`, `project_id`, `rating`, `description`, `date`, `url`, `user_agent`, `created_at`), a CHECK constraint requiring at least one of rating or description, anon INSERT / admin SELECT+DELETE RLS, IP-based rate limiting via a private schema, and two indexes.
3. The `terms_of_use_accepted` timestamptz column exists on `candidates` (nullable), is included in the column-level GRANT UPDATE so candidates can update their own row, and maps to `termsOfUseAccepted` in COLUMN_MAP.
4. The `upsert_answers(uuid, jsonb, boolean)` function exists as SECURITY INVOKER with merge/overwrite modes, null-value stripping, and GRANT to authenticated — meaning RLS and the existing validate_answers_jsonb trigger both apply automatically.

All 12 artifacts verified at all three levels (exists, substantive, wired). All 10 task commits confirmed in git log. 244 pgTAP tests documented in SUMMARY (204 existing + 40 new).

---

_Verified: 2026-03-18T18:15:00Z_
_Verifier: Claude (gsd-verifier)_
