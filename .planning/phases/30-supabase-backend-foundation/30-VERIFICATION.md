---
phase: 30
status: passed
verified: 2026-03-22
---

# Phase 30: Supabase Backend Foundation — Verification

## Phase Goal

> The Supabase backend workspace exists in the monorepo with schema, migrations, seed data, Edge Functions, and type definitions available to downstream consumers

## Success Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `supabase start` launches local instance with migrations and seed data | PASS | Verified: all services running, DB on 54322, API on 54321, seed data loaded |
| 2 | pgTAP tests pass (229 tests) | PASS | 269/269 tests pass (11 test files). Count exceeds 229 due to additional triggers in migration |
| 3 | Edge Functions deployable and respond | PASS | 3 functions (invite-candidate, send-email, signicat-callback) serve and respond with JSON |
| 4 | @openvaa/supabase-types exports types and maps with zero TS errors | PASS | `tsc --noEmit` exits 0. Exports: Database, COLUMN_MAP, PROPERTY_MAP, TABLE_MAP |
| 5 | @supabase/supabase-js available via Yarn catalog | PASS | Catalog entry `'@supabase/supabase-js': ^2.49.4` in .yarnrc.yml |

## Requirements Coverage

| Requirement | Description | Status |
|-------------|-------------|--------|
| BACK-01 | apps/supabase/ workspace integrated | VERIFIED |
| BACK-02 | @openvaa/supabase-types integrated | VERIFIED |
| BACK-04 | @supabase/supabase-js in Yarn catalog | VERIFIED |

## Must-Have Verification

- [x] 24 schema SQL files in apps/supabase/supabase/schema/
- [x] 11 pgTAP test files in apps/supabase/supabase/tests/database/
- [x] 3 Edge Functions in apps/supabase/supabase/functions/
- [x] Migration 00001_initial_schema.sql applied successfully
- [x] seed.sql loads default account, project, test users
- [x] config.toml with project_id "openvaa-local"
- [x] @openvaa/supabase workspace detected by Yarn
- [x] @openvaa/supabase-types exports all expected types and maps
- [x] TypeScript compilation succeeds (zero errors)
- [x] supabase and @supabase/supabase-js in Yarn catalog
- [x] Both workspace package.json files use catalog: references
- [x] Full monorepo build (yarn build) succeeds (14/14 tasks)

## Issues Found and Resolved

1. **Test data / migration mismatch** — The `create_test_data()` helper inserted `singleChoiceOrdinal` questions without `choices` arrays. The migration's `validate_question_choices` trigger requires them. Fixed by adding choices to the INSERT.

2. **Trigger error message drift** — Test 08-triggers expected `"must be a string"` but migration says `"must be a string or localized string object"`. Fixed by updating the expected message.

3. **Edge Function names** — Roadmap says "preregister, send-email, admin" but actual names from branch are "invite-candidate, send-email, signicat-callback". The functions are correct; the roadmap used approximate names.

4. **Test count: 269 vs 229** — Migration includes triggers (validate_question_choices, validate_answer_value) that add test coverage beyond the schema files. Will align in Phase 31 (Schema Reorganization).

## Notes

- Edge Runtime uses `oneshot` policy in config.toml. Functions need `supabase functions serve` for hot-reload testing.
- Benchmarks directory (~60 files) is reference data, not actively used in CI.
- packages/supabase-types uses raw .ts source (no build step) — new pattern for private packages.
