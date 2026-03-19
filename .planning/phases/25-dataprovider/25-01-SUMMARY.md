---
phase: 25-dataprovider
plan: 01
subsystem: api
tags: [supabase, localization, storage, data-adapter, utilities]

# Dependency graph
requires:
  - phase: 23-foundation
    provides: getLocalized, mapRow utilities and SupabaseDataAdapter shell
provides:
  - localizeRow — batch field localization with nested dot-notation support
  - toDataObject — combined localizeRow + mapRow pipeline for DataObject fields
  - parseStoredImage — Supabase Storage path to public URL conversion
  - StoredImage interface for typed JSONB image column access
affects: [25-02, 25-03, 25-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "localizeRow: shallow-clone at each nesting level to avoid input mutation"
    - "parseStoredImage: pure function taking supabaseUrl as param (no env mocking needed in tests)"
    - "toDataObject: localize-then-map pipeline (STANDARD_LOCALIZED_FIELDS + additional, then COLUMN_MAP)"

key-files:
  created:
    - frontend/src/lib/api/adapters/supabase/utils/localizeRow.ts
    - frontend/src/lib/api/adapters/supabase/utils/localizeRow.test.ts
    - frontend/src/lib/api/adapters/supabase/utils/toDataObject.ts
    - frontend/src/lib/api/adapters/supabase/utils/toDataObject.test.ts
    - frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts
    - frontend/src/lib/api/adapters/supabase/utils/storageUrl.test.ts
  modified: []

key-decisions:
  - "parseStoredImage takes supabaseUrl as parameter for pure testability — caller provides from constants.PUBLIC_SUPABASE_URL"
  - "STANDARD_LOCALIZED_FIELDS constant in toDataObject centralizes the 3 common localized columns (name, short_name, info)"
  - "localizeRow shallow-clones nested objects at each level to guarantee zero mutation of input rows"

patterns-established:
  - "localizeRow dot-notation: nested JSONB fields use 'parent.child' syntax (e.g. 'custom_data.fillingInfo')"
  - "toDataObject pipeline: localize first, then column-map — order matters because mapRow renames snake_case to camelCase"

requirements-completed: [READ-01, READ-02, READ-03, READ-04, READ-05, READ-06]

# Metrics
duration: 2min
completed: 2026-03-19
---

# Phase 25 Plan 01: Shared Utilities Summary

**localizeRow with nested dot-notation, toDataObject localize-then-map pipeline, and parseStoredImage Storage URL converter for all DataProvider methods**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-19T09:36:59Z
- **Completed:** 2026-03-19T09:39:54Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- localizeRow utility handling both flat fields and nested dot-notation JSONB paths with 3-tier locale fallback via getLocalized
- parseStoredImage converting Supabase Storage paths to absolute public URLs with pathDark/alt support
- toDataObject combining localizeRow + mapRow into a single pipeline for all DataProvider read methods
- 20 new unit tests covering all edge cases (null/undefined input, missing nested paths, mutation safety, multi-field localization)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create localizeRow and storageUrl utilities with tests**
   - `862a943f2` (test: failing tests for localizeRow and parseStoredImage)
   - `fd36b1fb9` (feat: implement localizeRow and parseStoredImage)
2. **Task 2: Create toDataObject utility with tests**
   - `ce9e524b0` (test: failing test for toDataObject)
   - `721b34b3c` (feat: implement toDataObject)

_TDD tasks have paired commits (test RED -> feat GREEN)_

## Files Created/Modified
- `frontend/src/lib/api/adapters/supabase/utils/localizeRow.ts` - Batch field localization with nested dot-notation support
- `frontend/src/lib/api/adapters/supabase/utils/localizeRow.test.ts` - 8 test cases for localizeRow
- `frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts` - Storage path to public URL conversion with StoredImage interface
- `frontend/src/lib/api/adapters/supabase/utils/storageUrl.test.ts` - 7 test cases for parseStoredImage
- `frontend/src/lib/api/adapters/supabase/utils/toDataObject.ts` - Combined localizeRow + mapRow pipeline
- `frontend/src/lib/api/adapters/supabase/utils/toDataObject.test.ts` - 5 test cases for toDataObject

## Decisions Made
- parseStoredImage takes supabaseUrl as parameter for pure testability -- caller provides from constants.PUBLIC_SUPABASE_URL, avoiding env mocking in tests
- STANDARD_LOCALIZED_FIELDS constant centralizes the 3 common localized columns (name, short_name, info) so DataProvider methods only specify additional fields
- localizeRow shallow-clones at each nesting level to guarantee zero mutation of input rows -- verified by dedicated immutability tests

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 3 shared utilities ready for Plans 03 and 04 (DataProvider read methods)
- Plan 02 (SupabaseDataProvider class shell) can proceed independently
- 40 total utility tests passing (9 existing + 20 new + 11 mapRow existing)

## Self-Check: PASSED

All 7 files verified present. All 4 task commits verified in git log.

---
*Phase: 25-dataprovider*
*Completed: 2026-03-19*
