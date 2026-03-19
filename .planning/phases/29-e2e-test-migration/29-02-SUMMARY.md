---
phase: 29-e2e-test-migration
plan: 02
subsystem: testing
tags: [supabase, snake_case, test-data, bulk-import, json, e2e]

# Dependency graph
requires:
  - phase: 22-supabase-schema
    provides: "bulk_import RPC with collection processing order and relationship mappings"
provides:
  - "6 test dataset JSON files in Supabase-native snake_case format"
  - "mergeDatasets utility updated for external_id merge key"
affects: [29-03, 29-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Test datasets use snake_case matching DB schema directly (no runtime mapping)"
    - "M:N join refs prefixed with underscore (_constituency_groups, _constituencies, _elections)"
    - "questionTypes eliminated, type/choices/settings inlined into questions"
    - "order -> sort_order, category type -> category_type column mapping"

key-files:
  created: []
  modified:
    - tests/tests/data/default-dataset.json
    - tests/tests/data/voter-dataset.json
    - tests/tests/data/candidate-addendum.json
    - tests/tests/data/overlays/multi-election-overlay.json
    - tests/tests/data/overlays/constituency-overlay.json
    - tests/tests/data/overlays/startfromcg-overlay.json
    - tests/tests/utils/mergeDatasets.ts

key-decisions:
  - "order field mapped to sort_order (matching DB column name)"
  - "question_categories type field mapped to category_type (matching DB column name)"
  - "Constituency scoping on questions/question_categories stored as _constituencies (same underscore prefix as M:N)"

patterns-established:
  - "Test data format mirrors bulk_import input exactly (no transform layer needed)"
  - "Underscore-prefixed fields signal non-column data for SupabaseAdminClient processing"

requirements-completed: [TEST-02]

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 29 Plan 02: Dataset JSON Conversion Summary

**Convert 6 test dataset files from Strapi camelCase to Supabase-native snake_case with questionType inlining, party->organization rename, and project_id/published additions**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-19T20:34:55Z
- **Completed:** 2026-03-19T20:37:51Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Converted all 6 test dataset JSON files to Supabase-native format directly passable to bulk_import RPC
- Eliminated questionTypes collection entirely, inlining type/choices/settings into each question
- Renamed parties to organizations, updated all nomination references from party to organization
- Added project_id and published:true to all 30 items in the default dataset (and equivalents in other files)
- Updated mergeDatasets utility to use external_id as the overlay merge key

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert all dataset JSON files to Supabase-native format** - `484c05336` (feat)
2. **Task 2: Update mergeDatasets utility for snake_case format** - `718a2a1c4` (feat)

## Files Created/Modified
- `tests/tests/data/default-dataset.json` - Base test dataset: 8 collections, 30 items, all snake_case
- `tests/tests/data/voter-dataset.json` - Voter test dataset: 5 collections, all snake_case
- `tests/tests/data/candidate-addendum.json` - Candidate addendum: unregistered candidates + nominations
- `tests/tests/data/overlays/multi-election-overlay.json` - Multi-election overlay with second election
- `tests/tests/data/overlays/constituency-overlay.json` - Constituency hierarchy overlay with parent refs
- `tests/tests/data/overlays/startfromcg-overlay.json` - Start-from-constituency-group overlay
- `tests/tests/utils/mergeDatasets.ts` - Overlay merge utility using external_id

## Decisions Made
- Mapped `order` field to `sort_order` to match the actual DB column name in questions and question_categories tables
- Mapped `type` on question_categories to `category_type` to match the DB enum column (avoiding collision with question `type`)
- Constituency scoping fields on questions and question_categories stored as `_constituencies` with same underscore prefix convention as M:N join fields

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All test datasets ready for SupabaseAdminClient to import via bulk_import RPC
- mergeDatasets utility works with new snake_case format for overlay composition
- Ready for Plan 03 (SupabaseAdminClient implementation) and Plan 04 (test spec migration)

## Self-Check: PASSED

- All 7 files exist on disk
- Both task commits verified in git log (484c05336, 718a2a1c4)

---
*Phase: 29-e2e-test-migration*
*Completed: 2026-03-19*
