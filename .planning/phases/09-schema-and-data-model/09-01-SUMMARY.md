---
phase: 09-schema-and-data-model
plan: 01
subsystem: database
tags: [postgresql, supabase, multi-tenant, localization, jsonb, sql-views]

# Dependency graph
requires:
  - phase: 08-infrastructure-setup
    provides: Supabase CLI, config.toml, local dev stack, seed mechanism
provides:
  - accounts and projects tables (multi-tenant foundation)
  - 13 content entity tables modeled on @openvaa/data
  - get_localized() SQL function with 3-tier fallback
  - update_updated_at() trigger function
  - elections_localized and questions_localized views
affects: [09-02 (answer storage, app settings, indexes, RLS, seed data), 09-03 (QuestionTemplate depends on question_templates table), 10 (auth adds auth_user_id to candidates, RLS policies on all tables), 11 (load testing queries these tables), 13 (pgTAP tests verify isolation)]

# Tech tracking
tech-stack:
  added: []
  patterns: [JSONB locale columns with get_localized() extraction, snake_case column naming with sort_order for reserved words, session variable locale via set_config/current_setting, localized views for voter-facing queries]

key-files:
  created:
    - apps/supabase/supabase/migrations/20260312200000_create_multi_tenant_tables.sql
    - apps/supabase/supabase/migrations/20260312200001_create_localization_functions.sql
    - apps/supabase/supabase/migrations/20260312200002_create_content_tables.sql
  modified: []

key-decisions:
  - "Supabase timestamp migration naming with 20260312200000-series prefixes"
  - "CHECK constraints on question type columns to document valid QuestionType enum values"
  - "Polymorphic nominations.entity_id with comment noting trigger validation deferred to Phase 10"

patterns-established:
  - "JSONB locale columns: all localizable fields (name, short_name, info) use jsonb type storing {locale: value} objects"
  - "get_localized() extraction: voter-facing views use get_localized(col, current_setting('app.locale', TRUE), project.default_locale) to resolve to plain text"
  - "Common column set: all content entity tables share id, project_id, name, short_name, info, color, color_dark, image, sort_order, subtype, custom_data, is_generated, created_at, updated_at"
  - "updated_at trigger: BEFORE UPDATE trigger on every non-join table using shared update_updated_at() function"

requirements-completed: [SCHM-01, SCHM-02, SCHM-03, MTNT-01, MTNT-02, MTNT-03]

# Metrics
duration: 4min
completed: 2026-03-13
---

# Phase 9 Plan 01: Multi-Tenant Foundation, Localization, and Content Tables Summary

**15-table PostgreSQL schema with multi-tenant hierarchy (accounts/projects), JSONB localization via get_localized() with 3-tier fallback, and localized views returning resolved text for voter-facing queries**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-13T06:18:28Z
- **Completed:** 2026-03-13T06:22:37Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created complete multi-tenant foundation with accounts and projects tables, all content tables referencing projects via project_id FK
- Implemented get_localized() SQL function with 3-tier fallback (requested locale -> default locale -> first available key), marked IMMUTABLE for query optimization
- Created all 13 content entity tables modeled on @openvaa/data (elections, constituencies, constituency_groups, organizations, candidates, factions, alliances, question_templates, question_categories, questions, nominations, plus 2 join tables) with snake_case columns
- Created elections_localized and questions_localized views that return resolved text strings via get_localized() using session variable app.locale

## Task Commits

Each task was committed atomically:

1. **Task 1: Create multi-tenant and localization migration files** - `72be7565d` (feat)
2. **Task 2: Create all content entity tables and localized views** - `3c8d86a26` (feat)

## Files Created/Modified
- `apps/supabase/supabase/migrations/20260312200000_create_multi_tenant_tables.sql` - accounts and projects tables
- `apps/supabase/supabase/migrations/20260312200001_create_localization_functions.sql` - update_updated_at() trigger function and get_localized() localization function with fallback chain
- `apps/supabase/supabase/migrations/20260312200002_create_content_tables.sql` - All 13 content entity tables, 2 join tables, updated_at triggers, and 2 localized views

## Decisions Made
- Used Supabase timestamp format for migration naming (20260312200000, 20260312200001, 20260312200002) as specified in plan
- Added CHECK constraints on question_templates.type and questions.type to document valid QuestionType enum values rather than just comments
- Used COMMENT ON COLUMN for nominations.entity_id to document the polymorphic FK pattern and that trigger validation is deferred to Phase 10

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 15 tables exist and are ready for Plan 02 (app settings, answer storage alternatives, indexes, RLS, seed data)
- get_localized() function available for any additional localized views
- update_updated_at() trigger function available for any new tables
- Seed data mechanism working (Phase 8 placeholder still in seed.sql, Plan 02 will add substantive seed inserts)

## Self-Check: PASSED

All 4 files verified present. Both task commits (72be7565d, 3c8d86a26) found in git log.

---
*Phase: 09-schema-and-data-model*
*Completed: 2026-03-13*
