---
phase: 12-services
verified: 2026-03-14T19:10:00Z
status: passed
score: 14/14 must-haves verified
re_verification: false
---

# Phase 12: Services Verification Report

**Phase Goal:** Storage, email, and admin bulk operations work end-to-end on the Supabase backend
**Verified:** 2026-03-14T19:10:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Storage buckets public-assets and private-assets exist after supabase db reset | VERIFIED | `config.toml` lines 116-123: `[storage.buckets.public-assets] public = true file_size_limit = "500MiB"` and `[storage.buckets.private-assets] public = false file_size_limit = "500MiB"` |
| 2  | Anon users can read files from public-assets only for published entities | VERIFIED | `014-storage.sql` line 102: `CREATE POLICY "anon_select_public_assets" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'public-assets' AND is_storage_entity_published(...))` |
| 3  | Authenticated candidates can upload to their own entity folder in public-assets | VERIFIED | `014-storage.sql` line 171: `candidate_insert_public_assets` policy checks `candidates.auth_user_id = auth.uid()` |
| 4  | Admins can upload/delete files for any entity in their project | VERIFIED | `014-storage.sql`: `admin_insert_public_assets`, `admin_insert_private_assets`, `admin_delete_public_assets`, `admin_delete_private_assets` policies using `can_access_project()` |
| 5  | Admins and entity owners can read their own files regardless of published status | VERIFIED | `014-storage.sql` line 112: `authenticated_select_public_assets` has OR branch for `can_access_project()` and entity owner check |
| 6  | StoredImage JSONB structure is validated for image-type question answers | VERIFIED | `000-functions.sql` validates `path` (required string), `pathDark`, `alt`, `width`, `height`, `focalPoint` with type checks |
| 7  | Inbucket web UI is accessible at localhost:54324 for dev email | VERIFIED | `config.toml` lines 99-104: `[inbucket] enabled = true port = 54324` |
| 8  | When an entity row is deleted, its storage files are cleaned up via pg_net | VERIFIED | `014-storage.sql` lines 388-451: `cleanup_entity_storage_files()` AFTER DELETE trigger on all 11 entity tables |
| 9  | When an image column is updated with a new path, the old file is deleted via pg_net | VERIFIED | `014-storage.sql` lines 464-541: `cleanup_old_image_file()` BEFORE UPDATE trigger checks `OLD.image ? 'path'` and `? 'pathDark'` |
| 10 | All content tables have an external_id column that is nullable and unique per project | VERIFIED | `015-external-id.sql`: all 12 tables (elections, constituency_groups, constituencies, candidates, organizations, factions, alliances, nominations, questions, question_categories, question_templates, app_settings) with composite unique indexes |
| 11 | bulk_import() and bulk_delete() either fully succeed or fully roll back | VERIFIED | `016-bulk-operations.sql` lines 7-9: "PostgREST automatically wraps RPC calls in transactions." Both are SECURITY INVOKER plpgsql functions that raise exceptions on error, triggering automatic rollback |
| 12 | send-email Edge Function accepts multilingual templates and recipient userIds | VERIFIED | `functions/send-email/index.ts` lines 9-14: `SendEmailRequest` interface with `templates: Record<string, {subject, body}>`, `recipient_user_ids: string[]`, locale selection at line 175 |
| 13 | dry_run=true returns rendered content without sending | VERIFIED | `functions/send-email/index.ts` lines 197-213: `if (dry_run === true)` returns rendered results without calling nodemailer |
| 14 | Migration file regenerated from all schema files including 014-017 | VERIFIED | `00001_initial_schema.sql` (2955 lines) contains `CREATE TABLE IF NOT EXISTS storage_config` (line 1720), `ALTER TABLE elections ADD COLUMN external_id` (line 2250), `CREATE OR REPLACE FUNCTION bulk_import` (line 2593), `CREATE OR REPLACE FUNCTION resolve_email_variables` (line 2820) |

**Score:** 14/14 truths verified

---

### Required Artifacts

| Artifact | Min Lines | Actual Lines | Status | Details |
|----------|-----------|--------------|--------|---------|
| `apps/supabase/supabase/config.toml` | — | 393 | VERIFIED | Contains `[storage.buckets.public-assets]` and `[storage.buckets.private-assets]` with correct public/private flags |
| `apps/supabase/supabase/schema/014-storage.sql` | 80 | 545 | VERIFIED | 15 RLS policies on `storage.objects`, `is_storage_entity_published()`, `delete_storage_object()`, cleanup triggers on 11 tables, pg_net extension |
| `apps/supabase/supabase/schema/000-functions.sql` | — | — | VERIFIED | `validate_answer_value()` WHEN 'image' branch validates full StoredImage structure including path (required), pathDark, alt, width, height, focalPoint |
| `apps/supabase/supabase/schema/015-external-id.sql` | 40 | 130 | VERIFIED | external_id on all 12 content tables with composite unique indexes + immutability trigger |
| `apps/supabase/supabase/schema/016-bulk-operations.sql` | 150 | 434 | VERIFIED | `resolve_external_ref()`, `_bulk_upsert_record()`, `bulk_import()`, `bulk_delete()` all present; SECURITY INVOKER on both RPC functions; GRANT EXECUTE on lines 432-434 |
| `apps/supabase/supabase/functions/send-email/index.ts` | 80 | 303 | VERIFIED | Full Edge Function: CORS, POST-only, admin role check, resolve_email_variables RPC call, per-locale template rendering, dry_run support, nodemailer SMTP |
| `apps/supabase/supabase/schema/017-email-helpers.sql` | 30 | 157 | VERIFIED | `resolve_email_variables()` SECURITY DEFINER joins user_roles to candidates/organizations/nominations; GRANT to authenticated and service_role |
| `apps/supabase/supabase/migrations/00001_initial_schema.sql` | — | 2955 | VERIFIED | Regenerated from all 18 schema files in dependency order (000 through 017); all four Phase 12 SQL sections confirmed present |
| `packages/supabase-types/src/database.ts` | — | 1492 | VERIFIED | 36 occurrences of external_id; `bulk_import`, `bulk_delete`, `resolve_email_variables` RPC types present at lines 1266-1294+ |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `014-storage.sql` | `012-auth-hooks.sql` | `can_access_project()` in RLS policies | VERIFIED | `can_access_project(...)` referenced in admin INSERT/UPDATE/DELETE policies (lines 186, 209, 241, 278, 303, 327) |
| `014-storage.sql` | `storage.objects` | RLS policies ON storage.objects | VERIFIED | All 15 policies use `ON storage.objects` (lines 102-324) |
| `014-storage.sql` | `pg_net` | `net.http_post` in `delete_storage_object()` | VERIFIED | `PERFORM net.http_post(...)` at line 362; `CREATE EXTENSION IF NOT EXISTS pg_net` at line 22 |
| `014-storage.sql` | `011-auth-tables.sql` | `is_storage_entity_published()` checks `published` via dynamic SQL | VERIFIED | `SELECT published FROM public.%I WHERE id = $1` at line 70 |
| `016-bulk-operations.sql` | `015-external-id.sql` | upsert ON CONFLICT (project_id, external_id) | VERIFIED | `ON CONFLICT (project_id, external_id) DO UPDATE SET` at line 197 |
| `016-bulk-operations.sql` | `010-rls.sql` | SECURITY INVOKER delegation | VERIFIED | `SECURITY INVOKER` on both `bulk_import` (line 232) and `bulk_delete` (line 326) |
| `functions/send-email/index.ts` | `017-email-helpers.sql` | `resolve_email_variables` RPC call | VERIFIED | `supabaseAdmin.rpc('resolve_email_variables', {...})` at lines 137-144 |
| `functions/send-email/index.ts` | Inbucket SMTP | nodemailer host defaults to 'inbucket' port 2500 | VERIFIED | `Deno.env.get('SMTP_HOST') || 'inbucket'` and `|| '2500'` at lines 218-219 |
| `migrations/00001_initial_schema.sql` | `schema/*.sql` (014-017) | Concatenation of all schema files in order | VERIFIED | Storage content at line 1690, external_id at line 2235, bulk operations at line 2368, email helpers at line 2808 |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SRVC-01 | 12-01 | Supabase Storage buckets configured with RLS | SATISFIED | Two buckets in `config.toml`; 15 RLS policies in `014-storage.sql` covering SELECT/INSERT/UPDATE/DELETE for anon, candidates, and admins |
| SRVC-02 | 12-01 | Candidate photo upload and serve via Supabase Storage API | SATISFIED | `candidate_insert_public_assets` policy for upload; `public = true` on bucket for public URL serving; anon SELECT policy for published entity files |
| SRVC-03 | 12-01 | Mailpit/Inbucket accessible at localhost for dev email | SATISFIED | `config.toml` Inbucket enabled on port 54324 (Supabase's bundled equivalent of Mailpit). Note: REQUIREMENTS.md says "Mailpit" but Supabase uses "Inbucket" — same purpose, different name; implementation is correct |
| SRVC-04 | 12-02 | Bulk data import via Postgres RPC with transactional guarantee | SATISFIED | `bulk_import(jsonb)` in `016-bulk-operations.sql`: SECURITY INVOKER plpgsql, RAISE EXCEPTION on error triggers PostgREST auto-rollback |
| SRVC-05 | 12-02 | Bulk data delete via Postgres RPC with transactional guarantee | SATISFIED | `bulk_delete(jsonb)` in `016-bulk-operations.sql`: same transactional guarantee; reverse dependency order prevents FK violations |
| SRVC-06 | 12-03 | Transactional email for non-auth flows via Edge Function | SATISFIED | `send-email/index.ts`: admin-verified, multilingual, dry-run support; `resolve_email_variables` RPC joins user_roles to entity tables |

**Orphaned requirements:** None. All 6 SRVC requirements (01-06) are claimed in plans and verified in the codebase.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `send-email/index.ts` | 182 | Comment uses word "placeholders" | Info | Legitimate comment describing template variable syntax — not a stub indicator |

No blockers or warnings found. All implementations are substantive.

---

### Human Verification Required

#### 1. Live Storage Upload Flow

**Test:** With local Supabase running, authenticate as a candidate user, upload a photo to `{project_id}/candidates/{candidate_id}/photo.jpg` via the Supabase Storage SDK, then access it as an anon user after marking the candidate as published.
**Expected:** Photo is uploaded successfully, and the public URL returns the image (HTTP 200) only after `published = true` is set. Anon access before publishing should return 403/404.
**Why human:** RLS policy evaluation against live Supabase storage requires a running environment; cannot verify policy enforcement from static analysis alone.

#### 2. Inbucket Email Capture

**Test:** With `supabase start` running, call the `send-email` Edge Function with valid admin credentials, a test template, and a recipient user ID. Then visit http://127.0.0.1:54324 in a browser.
**Expected:** The sent email appears in the Inbucket web UI with correct subject and rendered body.
**Why human:** Requires a running Supabase stack and HTTP calls to verify SMTP delivery end-to-end.

#### 3. Bulk Import Transaction Rollback

**Test:** Call `bulk_import` with valid records for `elections` followed by an invalid record in `nominations` (e.g., referencing a non-existent candidate external_id).
**Expected:** The entire batch fails (elections not inserted) — no partial import.
**Why human:** Transaction rollback behavior requires executing against a live database; cannot be verified statically.

---

### Gaps Summary

No gaps found. All 14 observable truths are verified:

- Storage buckets (public-assets, private-assets) defined in config.toml with correct visibility flags
- 15 RLS policies on `storage.objects` implement the full access matrix: anon read for published entities, candidate upload to own folder, admin project-wide access, entity owner bypass for unpublished files
- StoredImage validation in `validate_answer_value()` fully validates the path/pathDark/alt/width/height/focalPoint structure
- Cleanup triggers on all 11 entity tables for both deletion and image column update via pg_net
- external_id on all 12 content tables with composite unique indexes and immutability trigger
- `bulk_import()` and `bulk_delete()` are substantive, SECURITY INVOKER plpgsql functions (not stubs)
- `send-email` Edge Function is complete (303 lines) with admin auth, multilingual template rendering, dry-run, and nodemailer SMTP
- `resolve_email_variables()` RPC joins user_roles to entity tables with locale-aware field resolution
- Migration regenerated from all 18 schema files; TypeScript types updated with 36 external_id occurrences and all RPC function types
- All 6 task commits (a678a66b2, caca032cb, 6f467481e, 47aa91129, 10536f7c5, da3bc3123) verified in git history

The only note: REQUIREMENTS.md names the email tool "Mailpit" but Supabase Local uses "Inbucket" — the implementation correctly uses Inbucket on port 54324, which is the Supabase-bundled equivalent serving the same purpose.

---

_Verified: 2026-03-14T19:10:00Z_
_Verifier: Claude (gsd-verifier)_
