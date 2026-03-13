---
phase: 09-schema-and-data-model
plan: 02
subsystem: database
tags: [postgresql, supabase, rls, jsonb, answer-validation, indexes, column-mapping]

# Dependency graph
requires:
  - phase: 09-schema-and-data-model
    plan: 01
    provides: 15 content tables, get_localized(), update_updated_at() trigger function
provides:
  - app_settings table (one row per project with JSONB settings)
  - validate_answer_value() shared validation function for 9 question types
  - JSONB answer storage (answers column on candidates/organizations with trigger validation)
  - Relational answer storage (answers table with trigger validation)
  - B-tree indexes on all project_id and FK columns
  - RLS enabled on all 17 tables with deny-all placeholder policies
  - Seed data creating default account and project for single-tenant deployment
  - COLUMN_MAP and PROPERTY_MAP constants for snake_case/camelCase conversion
affects: [09-03 (QuestionTemplate uses question_templates table), 10 (RLS policies replace deny-all placeholders), 11 (load testing compares JSONB vs relational answer storage), 13 (pgTAP tests verify answer validation and RLS)]

# Tech tracking
tech-stack:
  added: []
  patterns: [shared validate_answer_value function used by both answer alternatives, CREATE OR REPLACE for migration self-containment, deny-all RLS placeholder pattern, fixed UUID seed data with ON CONFLICT DO NOTHING, bidirectional column name mapping constants]

key-files:
  created:
    - apps/supabase/supabase/migrations/20260312200003_create_app_settings.sql
    - apps/supabase/supabase/migrations/20260312200004_create_answers_jsonb.sql
    - apps/supabase/supabase/migrations/20260312200005_create_answers_relational.sql
    - apps/supabase/supabase/migrations/20260312200006_create_indexes.sql
    - apps/supabase/supabase/migrations/20260312200007_enable_rls.sql
    - packages/supabase-types/src/column-map.ts
  modified:
    - apps/supabase/supabase/seed.sql
    - packages/supabase-types/src/index.ts

key-decisions:
  - "Both answer migrations include CREATE OR REPLACE for validate_answer_value making either self-contained"
  - "Answer value choice validation accepts both string and number IDs for flexibility"
  - "Added open_answer and question_id to COLUMN_MAP beyond what RESEARCH.md specified (relational answer fields)"

patterns-established:
  - "Shared validation function: validate_answer_value() used by both JSONB and relational triggers ensures identical validation behavior for fair load testing"
  - "Self-contained migrations: CREATE OR REPLACE ensures each answer alternative works independently without the other"
  - "Deny-all RLS placeholder: every table has ENABLE ROW LEVEL SECURITY + deny-all policy; service_role bypasses automatically"
  - "Fixed UUID seed data: use 00000000-0000-0000-0000-000000000001 with ON CONFLICT DO NOTHING for idempotent seeding"
  - "Bidirectional column mapping: COLUMN_MAP (DB->TS) and PROPERTY_MAP (TS->DB) as const objects with derived types"

requirements-completed: [SCHM-01, SCHM-04, SCHM-05, SCHM-06, SCHM-07, MTNT-07]

# Metrics
duration: 4min
completed: 2026-03-13
---

# Phase 9 Plan 02: App Settings, Answer Storage, Indexes, RLS, Seed Data, and Column Mapping Summary

**App settings table, dual answer storage alternatives with shared 9-type trigger validation, B-tree indexes on all FK columns, RLS on all 17 tables, single-tenant seed data, and COLUMN_MAP/PROPERTY_MAP constants for snake_case/camelCase conversion**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-13T06:26:07Z
- **Completed:** 2026-03-13T06:30:51Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created app_settings table with UNIQUE project_id constraint and JSONB settings column for per-project configuration
- Implemented shared validate_answer_value() function handling all 9 question types (text, number, boolean, date, singleChoiceOrdinal, singleChoiceCategorical, multipleChoiceCategorical, multipleText, image) with choice validation
- Created both JSONB answer storage (answers column on candidates/organizations) and relational answer storage (answers table) as independent migration alternatives with identical trigger validation
- Added B-tree indexes on all project_id columns (13 tables) and FK reference columns (11 additional indexes)
- Enabled RLS on all 17 tables including join tables with deny-all placeholder policies; supabase db lint reports zero warnings
- Updated seed.sql with default account, project, and app_settings for single-tenant deployment using fixed UUIDs
- Created COLUMN_MAP and PROPERTY_MAP constants in @openvaa/supabase-types for bidirectional snake_case/camelCase column name conversion

## Task Commits

Each task was committed atomically:

1. **Task 1: Create app settings, shared validation function, and both answer storage alternatives** - `7d27710bc` (feat)
2. **Task 2: Create indexes, enable RLS, update seed data, and create column mapping constants** - `32aa5a7a3` (feat)

## Files Created/Modified
- `apps/supabase/supabase/migrations/20260312200003_create_app_settings.sql` - app_settings table with UNIQUE project_id and JSONB settings
- `apps/supabase/supabase/migrations/20260312200004_create_answers_jsonb.sql` - Shared validate_answer_value(), answers JSONB column on candidates/organizations, validation triggers
- `apps/supabase/supabase/migrations/20260312200005_create_answers_relational.sql` - Self-contained validate_answer_value(), answers table, validation trigger
- `apps/supabase/supabase/migrations/20260312200006_create_indexes.sql` - 24 B-tree indexes on project_id and FK columns
- `apps/supabase/supabase/migrations/20260312200007_enable_rls.sql` - RLS enabled on all 17 tables with deny-all placeholder policies
- `apps/supabase/supabase/seed.sql` - Default account, project, and app_settings with fixed UUIDs
- `packages/supabase-types/src/column-map.ts` - COLUMN_MAP and PROPERTY_MAP bidirectional mapping constants
- `packages/supabase-types/src/index.ts` - Re-exports column-map types and constants

## Decisions Made
- Both answer migration files include CREATE OR REPLACE for validate_answer_value making either independently appliable without the other
- Choice validation in validate_answer_value accepts both string and number answer IDs for flexibility (some question types use numeric choice IDs)
- Added open_answer and question_id to COLUMN_MAP beyond the RESEARCH.md specification since these are needed for the relational answer alternative

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All tables, indexes, and RLS policies in place for Phase 10 (Authentication) to replace deny-all policies with real role-based ones
- Both answer storage alternatives ready for Phase 11 (Load Testing) comparison
- COLUMN_MAP available for data adapter implementation
- Plan 03 (QuestionTemplate in @openvaa/data) can proceed -- question_templates table already exists from Plan 01

## Self-Check: PASSED

All 8 files verified present. Both task commits (7d27710bc, 32aa5a7a3) found in git log.

---
*Phase: 09-schema-and-data-model*
*Completed: 2026-03-13*
