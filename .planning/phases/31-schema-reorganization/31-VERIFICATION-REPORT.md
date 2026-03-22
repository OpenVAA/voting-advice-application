# Phase 31: Schema Reorganization - Verification Report

**Date:** 2026-03-22
**Status:** PASS (all 4 criteria met)

## Criterion 1: Numbered file naming convention

**Status:** PASS
**Evidence:**
- `ls apps/supabase/supabase/schema/ | grep -v '^[0-9]'` returns empty (0 un-numbered files)
- 24 schema files, all starting with 3-digit number prefix (000-900 range)
- Numbering bands: 000 (enums), 010-011 (utility), 100-108 (tables), 200 (indexes), 300-303 (auth/RLS), 400 (storage), 500-504 (RPCs), 900 (test helpers)
- Migration file uses numbered convention: `00001_initial_schema.sql`

## Criterion 2: p_ parameter prefix convention

**Status:** PASS
**Evidence:**
- 31 functions examined across all schema files
- All functions with explicit parameters use p_ prefix consistently
- Key examples verified:
  - `get_localized(p_val, p_locale, p_default_locale)`
  - `custom_access_token_hook(p_event)`
  - `has_role(p_check_role, p_check_scope_type, p_check_scope_id)`
  - `can_access_project(p_project_id)`
  - `is_candidate_self(p_row_auth_user_id)`
  - `bulk_import(p_data)`, `bulk_delete(p_data)`
  - `upsert_answers(p_entity_id, p_answers, p_overwrite)`
  - `merge_jsonb_column(p_table_name, p_column_name, p_row_id, p_partial_data)`
- Trigger functions (no user parameters) correctly excluded: `update_updated_at()`, `validate_nomination()`, `validate_question_choices()`, etc.

## Criterion 3: public. schema qualifiers

**Status:** PASS (after gap closure fix)
**Evidence:**
- `grep "CREATE TABLE" ... | grep -v "public\."` returns 0 matches
- `grep "CREATE OR REPLACE FUNCTION" ... | grep -v "public\."` returns 0 matches
- **Gap found and fixed:** `enforce_external_id_immutability()` in `500-external-id.sql` was missing `public.` qualifier on function definition and 11 trigger EXECUTE FUNCTION references. Fixed in commit `a6d1a8144`.
- Same fix applied to `00001_initial_schema.sql` migration file.

## Criterion 4: pgTAP test readiness

**Status:** PASS
**Evidence:**
- 11 pgTAP test files in `apps/supabase/supabase/tests/database/`
- All 11 contain pgTAP `SELECT plan` / `SELECT * FROM finish()` calls
- Test files use numbered naming convention (00-10)
- Test files cover: helpers, tenant isolation, candidate self-edit, anon read, admin CRUD, party admin, storage RLS, RPC security, triggers, column restrictions, schema migrations
- Full pgTAP execution requires `supabase start` (Docker) -- structural validity confirmed here

## Summary

All 4 success criteria for Phase 31 are met. One minor gap was found and fixed during verification: the `enforce_external_id_immutability()` function in `500-external-id.sql` was missing the `public.` schema qualifier, which was inconsistent with the convention used by all other functions. The fix was applied to both the schema file and the migration file.

---

*Phase: 31-schema-reorganization*
*Verified: 2026-03-22*
