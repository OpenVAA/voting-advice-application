---
phase: 09-schema-and-data-model
verified: 2026-03-13T08:35:00Z
status: passed
score: 18/18 must-haves verified
re_verification: false
---

# Phase 9: Schema and Data Model Verification Report

**Phase Goal:** All content tables exist in the database modeled on @openvaa/data entities, with multi-tenant structure, localization strategy, both answer storage alternatives, and the QuestionTemplate concept added to @openvaa/data
**Verified:** 2026-03-13T08:35:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | Every @openvaa/data entity has a corresponding DB table with snake_case columns and a type mapping layer | ✓ VERIFIED | 13 content tables in 20260312200002; COLUMN_MAP in packages/supabase-types/src/column-map.ts; sort_order, short_name, custom_data etc. all present |
| 2   | All content tables have project_id FK to projects; single-tenant degenerate case works | ✓ VERIFIED | 11 REFERENCES projects(id) in 00002; seed.sql inserts fixed-UUID account+project+app_settings |
| 3   | Both JSONB and relational answer storage schemas exist as independent alternative migrations | ✓ VERIFIED | 20260312200004 (JSONB) and 20260312200005 (relational) both use CREATE OR REPLACE for validate_answer_value making each self-contained |
| 4   | Localization strategy implemented; only requested locale data returned to frontend | ✓ VERIFIED | get_localized() in 00001 with 3-tier fallback; elections_localized and questions_localized views use current_setting('app.locale', TRUE) |
| 5   | @openvaa/data exports QuestionTemplate class with passing unit tests | ✓ VERIFIED | 6/6 tests pass; exports in internal.ts lines 63-64; OBJECT_TYPE.QuestionTemplate registered |

**Score:** 5/5 success criteria verified

### Plan 01 Must-Haves

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | accounts and projects tables exist with projects FK to accounts | ✓ VERIFIED | 20260312200000: `REFERENCES accounts(id)` on projects.account_id |
| 2   | All content tables exist with project_id FK to projects | ✓ VERIFIED | 11 tables in 00002 each have `uuid NOT NULL REFERENCES projects(id)` |
| 3   | All columns use snake_case (sort_order not order, etc.) | ✓ VERIFIED | No `order` column present; sort_order, short_name, custom_data, is_generated confirmed |
| 4   | get_localized(jsonb, text, text) function exists with fallback chain | ✓ VERIFIED | 20260312200001 lines 33-60: requested→default→first key→NULL |
| 5   | Localizable fields (name, short_name, info) use jsonb type | ✓ VERIFIED | All content tables define name jsonb, short_name jsonb, info jsonb |
| 6   | updated_at trigger fires on all non-join tables | ✓ VERIFIED | 11 EXECUTE FUNCTION update_updated_at() triggers in 00002 + 2 in 00001 |
| 7   | elections_localized and questions_localized views exist using get_localized with current_setting | ✓ VERIFIED | Both views present; 6 occurrences of get_localized(…current_setting('app.locale', TRUE)…) confirmed |

### Plan 02 Must-Haves

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | app_settings table with one row per project and settings jsonb | ✓ VERIFIED | 20260312200003: `UNIQUE REFERENCES projects(id)`, `settings jsonb NOT NULL DEFAULT '{}'::jsonb` |
| 2   | Both JSONB and relational answer storage alternatives exist | ✓ VERIFIED | 00004 adds answers JSONB column to candidates/organizations; 00005 creates answers table |
| 3   | Each answer alternative has trigger validation using shared validate_answer_value | ✓ VERIFIED | validate_answer_value() present in both migrations via CREATE OR REPLACE; called by both trigger functions |
| 4   | B-tree indexes on project_id and FK columns | ✓ VERIFIED | 25 CREATE INDEX IF NOT EXISTS statements in 20260312200006 |
| 5   | RLS enabled on every table with placeholder deny-all policy | ✓ VERIFIED | 17 ENABLE ROW LEVEL SECURITY in 20260312200007; all tables covered including join tables |
| 6   | Seed data creates default account and project for single-tenant | ✓ VERIFIED | seed.sql: fixed UUID 000…001 account, project, and app_settings with ON CONFLICT DO NOTHING |
| 7   | COLUMN_MAP constants file maps snake_case to camelCase | ✓ VERIFIED | packages/supabase-types/src/column-map.ts: COLUMN_MAP + PROPERTY_MAP, re-exported from index.ts |

### Plan 03 Must-Haves

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | QuestionTemplate is a first-class DataObject via DataRoot.questionTemplates collection | ✓ VERIFIED | dataRoot.ts line 196: `get questionTemplates()` using getCollectionAsArray; line 740: provideQuestionTemplateData |
| 2   | QuestionTemplate exposes type, settings, defaultChoices with correct defaults | ✓ VERIFIED | questionTemplate.ts: settings ?? {}, defaultChoices ?? []; all 6 tests pass |
| 3   | QuestionTemplate can be created with minimal and full data | ✓ VERIFIED | Test 1 (minimal) and Test 2 (full Likert) both pass |
| 4   | QuestionTemplate registered in OBJECT_TYPE and ObjectTypeMap | ✓ VERIFIED | objectTypes.ts line 49: `QuestionTemplate: 'questionTemplate'`; ObjectTypeMap line 83 |

**Overall Score:** 18/18 must-haves verified

### Required Artifacts

| Artifact | Status | Details |
| -------- | ------ | ------- |
| `apps/supabase/supabase/migrations/20260312200000_create_multi_tenant_tables.sql` | ✓ VERIFIED | accounts + projects tables, substantive (24 lines) |
| `apps/supabase/supabase/migrations/20260312200001_create_localization_functions.sql` | ✓ VERIFIED | update_updated_at() + get_localized() with 3-tier fallback + triggers on accounts/projects |
| `apps/supabase/supabase/migrations/20260312200002_create_content_tables.sql` | ✓ VERIFIED | 11 content tables + 2 join tables + 11 updated_at triggers + 2 localized views (425 lines) |
| `apps/supabase/supabase/migrations/20260312200003_create_app_settings.sql` | ✓ VERIFIED | app_settings table with UNIQUE project_id and settings jsonb |
| `apps/supabase/supabase/migrations/20260312200004_create_answers_jsonb.sql` | ✓ VERIFIED | validate_answer_value() shared function + answers JSONB column on candidates/organizations + triggers |
| `apps/supabase/supabase/migrations/20260312200005_create_answers_relational.sql` | ✓ VERIFIED | Self-contained with CREATE OR REPLACE; answers table + trigger |
| `apps/supabase/supabase/migrations/20260312200006_create_indexes.sql` | ✓ VERIFIED | 25 CREATE INDEX IF NOT EXISTS on project_id and FK columns |
| `apps/supabase/supabase/migrations/20260312200007_enable_rls.sql` | ✓ VERIFIED | 17 ENABLE ROW LEVEL SECURITY + 17 deny-all policies |
| `apps/supabase/supabase/seed.sql` | ✓ VERIFIED | Default account + project + app_settings with fixed UUID 000…001 |
| `packages/supabase-types/src/column-map.ts` | ✓ VERIFIED | COLUMN_MAP (31 entries) + PROPERTY_MAP reverse mapping + derived types |
| `packages/supabase-types/src/index.ts` | ✓ VERIFIED | Re-exports COLUMN_MAP, PROPERTY_MAP, ColumnName, PropertyName |
| `packages/data/src/objects/questions/template/questionTemplate.type.ts` | ✓ VERIFIED | QuestionTemplateData extends DataObjectData with type, settings, defaultChoices |
| `packages/data/src/objects/questions/template/questionTemplate.ts` | ✓ VERIFIED | QuestionTemplate extends DataObject<QuestionTemplateData>; objectType = OBJECT_TYPE.QuestionTemplate |
| `packages/data/src/objects/questions/template/questionTemplate.test.ts` | ✓ VERIFIED | 6 tests; all pass |
| `packages/data/src/core/objectTypes.ts` | ✓ VERIFIED | QuestionTemplate: 'questionTemplate' in OBJECT_TYPE; QuestionTemplate in ObjectTypeMap |
| `packages/data/src/root/dataRoot.type.ts` | ✓ VERIFIED | questionTemplates: QuestionTemplate in RootCollections |
| `packages/data/src/root/dataRoot.ts` | ✓ VERIFIED | get questionTemplates, getQuestionTemplate(id), provideQuestionTemplateData all present |
| `packages/data/src/internal.ts` | ✓ VERIFIED | Lines 63-64: exports from questionTemplate.type and questionTemplate |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| content tables | projects table | project_id uuid NOT NULL REFERENCES projects(id) | ✓ WIRED | 11 occurrences in 00002 |
| get_localized function | JSONB locale columns | 3-tier extraction logic | ✓ WIRED | Fallback: locale→default_locale→first key→NULL |
| updated_at triggers | all non-join tables | EXECUTE FUNCTION update_updated_at() | ✓ WIRED | 13 triggers total (2 in 00001, 11 in 00002, 1 in 00003, 1 in 00005) |
| elections_localized view | get_localized + current_setting('app.locale') | view columns call get_localized(col, current_setting('app.locale', TRUE), ...) | ✓ WIRED | 6 occurrences of pattern confirmed |
| validate_answer_value function | both answer triggers | PERFORM validate_answer_value(...) | ✓ WIRED | Called in validate_answers_jsonb() and validate_answer_relational() |
| seed.sql | accounts and projects tables | INSERT with fixed UUID 00000000-0000-0000-0000-000000000001 | ✓ WIRED | 4 occurrences in seed.sql |
| RLS policies | every table | ALTER TABLE ENABLE ROW LEVEL SECURITY | ✓ WIRED | 17 tables covered |
| column-map.ts | @openvaa/data property names | sort_order→order, short_name→shortName etc. | ✓ WIRED | Exported and re-exported from index.ts |
| QuestionTemplate class | DataObject base | extends DataObject<QuestionTemplateData> | ✓ WIRED | Confirmed in questionTemplate.ts |
| DataRoot.questionTemplates | QuestionTemplate collection | getCollectionAsArray('questionTemplates') | ✓ WIRED | dataRoot.ts line 197 |
| OBJECT_TYPE.QuestionTemplate | QuestionTemplate | QuestionTemplate: 'questionTemplate' | ✓ WIRED | objectTypes.ts line 49 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| SCHM-01 | 09-01, 09-02 | snake_case naming with type mapping layer | ✓ SATISFIED | All tables use snake_case; COLUMN_MAP in supabase-types |
| SCHM-02 | 09-01 | Schema models @openvaa/data entities | ✓ SATISFIED | 13 content tables + app_settings matching data model entities |
| SCHM-03 | 09-01 | Localization strategy; only requested locale returned | ✓ SATISFIED | get_localized() + localized views return plain text per locale |
| SCHM-04 | 09-02 | RLS enabled on every table with at least one policy | ✓ SATISFIED | 17 tables × (ENABLE RLS + deny-all policy) |
| SCHM-05 | 09-02 | B-tree indexes on all RLS-referenced columns | ✓ SATISFIED | 25 indexes including all project_id and FK columns |
| SCHM-06 | 09-02 | Both JSONB and relational answer storage as alternative migrations | ✓ SATISFIED | 00004 (JSONB) and 00005 (relational) independently appliable |
| SCHM-07 | 09-02 | App settings as typed table with JSONB per section, one row per project | ✓ SATISFIED | app_settings with UNIQUE project_id and settings jsonb |
| MTNT-01 | 09-01 | accounts table | ✓ SATISFIED | CREATE TABLE accounts in 20260312200000 |
| MTNT-02 | 09-01 | projects table linked to accounts | ✓ SATISFIED | projects.account_id REFERENCES accounts(id) |
| MTNT-03 | 09-01 | All content tables linked to project via project_id | ✓ SATISFIED | 11 content tables all have project_id FK |
| MTNT-07 | 09-02 | Single-tenant degenerate case works | ✓ SATISFIED | seed.sql creates one account + one project |
| DATA-01 | 09-03 | @openvaa/data extended with QuestionTemplate | ✓ SATISFIED | Class exported, registered in OBJECT_TYPE, DataRoot integrated |
| DATA-02 | 09-03 | QuestionTemplate defines default properties, type, config | ✓ SATISFIED | type, settings (default {}), defaultChoices (default []) with 6 passing tests |

All 13 requirements satisfied. No orphaned requirements (MTNT-04, MTNT-05, MTNT-06 are correctly assigned to Phase 10 in REQUIREMENTS.md).

### Anti-Patterns Found

No blocker or warning anti-patterns detected. The RLS migration intentionally uses "placeholder deny-all" language, which is a documented architectural decision (real policies deferred to Phase 10). The nominations.entity_id comment about deferred trigger validation is similarly intentional.

### Human Verification Required

The following items cannot be verified programmatically and require a running Supabase stack:

#### 1. Migration stack applies cleanly

**Test:** Run `cd apps/supabase && npx supabase db reset`
**Expected:** All 8 migrations apply without errors; seed data inserts successfully
**Why human:** Requires running Supabase local stack with Docker

#### 2. get_localized fallback chain correctness

**Test:** With a running DB, execute:
- `SELECT get_localized('{"en":"Hello","fi":"Moi"}'::jsonb, 'fi', 'en')` → should return 'Moi'
- `SELECT get_localized('{"en":"Hello","fi":"Moi"}'::jsonb, 'sv', 'en')` → should return 'Hello'
- `SELECT get_localized('{"fi":"Moi"}'::jsonb, 'sv', 'en')` → should return 'Moi'
**Expected:** All three fallback tiers work correctly
**Why human:** Requires running PostgreSQL instance

#### 3. Answer trigger validation rejects invalid input

**Test:** Insert a candidate with invalid answer (e.g., string value for a boolean question) and verify exception raised
**Expected:** RAISE EXCEPTION with descriptive message
**Why human:** Requires running Supabase local stack

#### 4. supabase db lint reports zero RLS warnings

**Test:** Run `cd apps/supabase && npx supabase db lint`
**Expected:** Zero warnings about missing RLS or unindexed FK columns
**Why human:** Requires running Supabase local stack

---

## Gaps Summary

None. All 18 must-haves from all three plans are verified. All 13 requirement IDs are satisfied by the actual code. All 6 QuestionTemplate unit tests pass.

The phase goal is fully achieved: the complete Supabase database schema exists with multi-tenant tables (accounts/projects), localization functions (get_localized with 3-tier fallback), 13 content entity tables with snake_case columns, answer storage alternatives (JSONB and relational), indexes, RLS policies, seed data, and @openvaa/data extended with QuestionTemplate. All artifacts are substantive and correctly wired.

---

_Verified: 2026-03-13T08:35:00Z_
_Verifier: Claude (gsd-verifier)_
