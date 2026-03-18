---
phase: 23-adapter-foundation
plan: 01
subsystem: api
tags: [supabase, typescript, column-mapping, localization, jsonb, adapter]

# Dependency graph
requires:
  - phase: 22-supabase-schema-completion
    provides: COLUMN_MAP/PROPERTY_MAP in @openvaa/supabase-types, Database type
provides:
  - SupabaseDataAdapter type in staticSettings union
  - PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY env constants
  - SupabaseAdapterConfig and SupabaseAdapter type interfaces
  - mapRow/mapRowToDb/mapRows row mapping utilities
  - getLocalized JSONB locale extraction utility
affects: [23-02-adapter-mixin-stubs, frontend-supabase-adapter]

# Tech tracking
tech-stack:
  added: []
  patterns: [snake-to-camel column mapping via COLUMN_MAP, 3-tier locale fallback matching SQL get_localized]

key-files:
  created:
    - frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts
    - frontend/src/lib/api/adapters/supabase/utils/mapRow.ts
    - frontend/src/lib/api/adapters/supabase/utils/mapRow.test.ts
    - frontend/src/lib/api/adapters/supabase/utils/getLocalized.ts
    - frontend/src/lib/api/adapters/supabase/utils/getLocalized.test.ts
  modified:
    - packages/app-shared/src/settings/staticSettings.type.ts
    - frontend/src/lib/utils/constants.ts

key-decisions:
  - "SupabaseDataAdapter has supportsAdminApp: false (admin app not yet supported by Supabase backend)"
  - "getLocalized uses 'en' as default defaultLocale parameter, matching SQL function convention"
  - "mapRow casts COLUMN_MAP/PROPERTY_MAP to Record<string,string> for index signature flexibility"

patterns-established:
  - "Row mapping: use mapRow/mapRowToDb for DB-to-domain and domain-to-DB column name conversion"
  - "Locale extraction: use getLocalized for opt-in JSONB locale resolution with 3-tier fallback"

requirements-completed: [ADPT-01, ADPT-02, ADPT-03, ADPT-04]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 23 Plan 01: Adapter Foundation Types & Utilities Summary

**SupabaseDataAdapter settings type, env constants, row mapping utilities (mapRow/mapRowToDb via COLUMN_MAP), and getLocalized JSONB 3-tier fallback utility with 20 unit tests**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T18:38:53Z
- **Completed:** 2026-03-18T18:42:06Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- SupabaseDataAdapter type added to staticSettings union enabling Supabase backend selection
- mapRow/mapRowToDb/mapRows utilities for bidirectional snake_case/camelCase column mapping using COLUMN_MAP/PROPERTY_MAP
- getLocalized utility implementing 3-tier locale fallback matching SQL get_localized() function
- 20 unit tests (11 for mapRow, 9 for getLocalized) all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Add SupabaseDataAdapter type, env vars, adapter config** - `90a6272a0` (feat)
2. **Task 2: Create mapRow/mapRowToDb utilities with tests** - `57a396e15` (feat)
3. **Task 3: Create getLocalized utility with tests** - `fb35326f8` (feat)

## Files Created/Modified
- `packages/app-shared/src/settings/staticSettings.type.ts` - Added SupabaseDataAdapter type and union member
- `frontend/src/lib/utils/constants.ts` - Added PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY
- `frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts` - SupabaseAdapterConfig and SupabaseAdapter interfaces
- `frontend/src/lib/api/adapters/supabase/utils/mapRow.ts` - mapRow, mapRowToDb, mapRows functions
- `frontend/src/lib/api/adapters/supabase/utils/mapRow.test.ts` - 11 unit tests for row mapping
- `frontend/src/lib/api/adapters/supabase/utils/getLocalized.ts` - getLocalized 3-tier fallback function
- `frontend/src/lib/api/adapters/supabase/utils/getLocalized.test.ts` - 9 unit tests for getLocalized

## Decisions Made
- SupabaseDataAdapter has `supportsAdminApp: false` since admin app is not yet supported by Supabase backend
- getLocalized defaults to 'en' as defaultLocale parameter, matching the SQL function's convention
- mapRow uses `Record<string, string>` cast for COLUMN_MAP/PROPERTY_MAP to allow flexible indexing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All foundation types and utilities ready for Plan 02 (adapter mixin, stubs, switch wiring)
- SupabaseAdapterConfig provides the config interface for supabaseAdapterMixin
- mapRow/getLocalized ready for use in data reader implementations

## Self-Check: PASSED

All 7 files verified present. All 3 task commits verified in git log.

---
*Phase: 23-adapter-foundation*
*Completed: 2026-03-18*
