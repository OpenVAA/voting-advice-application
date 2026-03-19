---
phase: 25-dataprovider
plan: 03
subsystem: api
tags: [supabase, dataprovider, postgrest, localization, storage-url, elections, constituencies]

# Dependency graph
requires:
  - phase: 25-dataprovider
    plan: 01
    provides: localizeRow, toDataObject, parseStoredImage, getLocalized utilities
provides:
  - _getAppSettings -- DynamicSettings from app_settings.settings JSONB with localized notifications
  - _getAppCustomization -- AppCustomization with image URLs and localized strings/FAQ
  - _getElectionData -- elections with constituencyGroupIds and field mappings (date, round, subtype)
  - _getConstituencyData -- { groups, constituencies } with parentId and localized keywords
affects: [25-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PostgREST join table extraction: select embedded join rows, then .map(jt => jt.foreign_key_id) to extract ID arrays"
    - "Manual field rename after toDataObject for domain-specific names (date, round, subtype) that differ from COLUMN_MAP"
    - "Keywords localization: getLocalized then split by comma+whitespace into string array"
    - "Notification localization: iterate candidateApp/voterApp keys, getLocalized on title/content"

key-files:
  created:
    - frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
  modified:
    - frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts

key-decisions:
  - "ElectionData uses date/round/subtype not electionDate/currentRound/electionType -- manual renames after toDataObject override COLUMN_MAP defaults"
  - "Constituency keywords localized as single string then split by comma+whitespace -- matches existing data convention"
  - "_getConstituencyData fetches all constituencies unfiltered while id filter only applies to constituency_groups"

patterns-established:
  - "Join table ID extraction: embedded select + map for constituencyGroupIds and constituencyIds"
  - "Image conversion pattern: parseStoredImage(row.image, supabaseUrl) in every map callback"

requirements-completed: [READ-01, READ-02, READ-03]

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 25 Plan 03: First 4 DataProvider Methods Summary

**_getAppSettings, _getAppCustomization, _getElectionData, and _getConstituencyData with PostgREST queries, localization, image URL conversion, and join table extraction**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-19T09:42:59Z
- **Completed:** 2026-03-19T09:46:33Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- 4 DataProvider methods implemented replacing stub throws with real Supabase PostgREST queries
- Notification localization in _getAppSettings with getLocalized 3-tier fallback on title/content
- AppCustomization image URL conversion (publisherLogo, poster, candPoster) plus localized translationOverrides and FAQ
- Election data with join table extraction for constituencyGroupIds and manual field renames (date, round, subtype)
- Constituency data with dual-query pattern (groups + all constituencies), keyword localization and comma-splitting
- 20 unit tests covering all query patterns, localization, error handling, and filter application

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement _getAppSettings and _getAppCustomization**
   - `026b9bfcb` (test: failing tests for all 4 DataProvider methods -- TDD RED)
   - `90b822192` (feat: implement _getAppSettings and _getAppCustomization -- TDD GREEN)
2. **Task 2: Implement _getElectionData and _getConstituencyData**
   - Implementation included in `90b822192` (all 4 methods share same file, implemented atomically)

_TDD tasks have paired commits (test RED -> feat GREEN)_

## Files Created/Modified
- `frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` - 20 unit tests with mock Supabase client supporting chainable PostgREST patterns
- `frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` - 4 implemented methods + 3 remaining stubs

## Decisions Made
- ElectionData uses `date`, `round`, `subtype` property names (not `electionDate`, `currentRound`, `electionType`) -- manual renames after toDataObject override the COLUMN_MAP defaults to match the ElectionData interface
- Constituency keywords are localized as a single string then split by `/,\s*/` regex -- matches the existing comma-separated storage convention
- _getConstituencyData fetches all constituencies without id filter (only groups are filtered) since constituencies may relate to multiple groups via parent chains

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 4 simpler DataProvider methods working with comprehensive test coverage
- Established patterns for join table extraction, image conversion, and field renaming
- Plan 04 can now implement the 3 remaining complex methods (_getEntityData, _getQuestionData, _getNominationData)
- 3 remaining method stubs still throw "not implemented" for clear debugging

## Self-Check: PASSED

---
*Phase: 25-dataprovider*
*Completed: 2026-03-19*
