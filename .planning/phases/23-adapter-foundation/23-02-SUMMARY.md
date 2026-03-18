---
phase: 23-adapter-foundation
plan: 02
subsystem: api
tags: [supabase, mixin, adapter, stub, dynamic-import, typescript]

# Dependency graph
requires:
  - phase: 23-adapter-foundation-01
    provides: "SupabaseAdapterConfig/SupabaseAdapter types, utility functions (mapRow, getLocalized, toFilterArray), COLUMN_MAP"
provides:
  - "supabaseAdapterMixin function providing typed SupabaseClient<Database>"
  - "SupabaseDataProvider stub class (7 abstract methods)"
  - "SupabaseDataWriter stub class (14 abstract methods)"
  - "SupabaseFeedbackWriter stub class (1 abstract method)"
  - "Dynamic import switch wiring for 'supabase' adapter type"
affects: [25-data-provider, 26-data-writer, 28-auth-flows]

# Tech tracking
tech-stack:
  added: []
  patterns: [supabase-adapter-mixin, stub-with-not-implemented, singleton-export]

key-files:
  created:
    - frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts
    - frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - frontend/src/lib/api/adapters/supabase/dataProvider/index.ts
    - frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - frontend/src/lib/api/adapters/supabase/dataWriter/index.ts
    - frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.ts
    - frontend/src/lib/api/adapters/supabase/feedbackWriter/index.ts
  modified:
    - frontend/src/lib/api/dataProvider.ts
    - frontend/src/lib/api/dataWriter.ts
    - frontend/src/lib/api/feedbackWriter.ts

key-decisions:
  - "supabaseAdapterMixin exposes Supabase client directly (no apiGet/apiPost wrappers) -- PostgREST query builder IS the abstraction"
  - "Stub methods throw descriptive errors ('ClassName._methodName not implemented') for clear debugging during incremental development"

patterns-established:
  - "Mixin pattern: supabaseAdapterMixin(UniversalXxx) -- same Constructor type approach as strapiAdapterMixin"
  - "Singleton export pattern: index.ts exports `new ClassName()` matching Strapi adapter structure"

requirements-completed: [ADPT-01, ADPT-04]

# Metrics
duration: 2min
completed: 2026-03-18
---

# Phase 23 Plan 02: Adapter Classes Summary

**supabaseAdapterMixin with typed SupabaseClient<Database>, 3 stub adapter classes (22 abstract methods), and dynamic import switch wiring**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-18T18:44:48Z
- **Completed:** 2026-03-18T18:47:07Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Created supabaseAdapterMixin that provides typed SupabaseClient<Database>, locale, and defaultLocale via private fields and getters
- Implemented 3 stub adapter classes (SupabaseDataProvider, SupabaseDataWriter, SupabaseFeedbackWriter) extending the mixin with all abstract methods throwing descriptive errors
- Wired all 3 dynamic import switch files (dataProvider.ts, dataWriter.ts, feedbackWriter.ts) with 'supabase' cases

## Task Commits

Each task was committed atomically:

1. **Task 1: Create supabaseAdapterMixin** - `c0cb8545b` (feat)
2. **Task 2: Create stub adapter classes with singleton exports** - `f562d70db` (feat)
3. **Task 3: Wire dynamic import switches for Supabase adapter** - `4c168f0b3` (feat)

## Files Created/Modified
- `frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` - Mixin providing typed Supabase client, locale, defaultLocale
- `frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` - DataProvider stub with 7 abstract method stubs
- `frontend/src/lib/api/adapters/supabase/dataProvider/index.ts` - Singleton export
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` - DataWriter stub with 14 abstract method stubs
- `frontend/src/lib/api/adapters/supabase/dataWriter/index.ts` - Singleton export
- `frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.ts` - FeedbackWriter stub with 1 abstract method stub
- `frontend/src/lib/api/adapters/supabase/feedbackWriter/index.ts` - Singleton export
- `frontend/src/lib/api/dataProvider.ts` - Added 'supabase' case to switch
- `frontend/src/lib/api/dataWriter.ts` - Added 'supabase' case to switch
- `frontend/src/lib/api/feedbackWriter.ts` - Added 'supabase' case to switch

## Decisions Made
- supabaseAdapterMixin exposes Supabase client directly (no apiGet/apiPost wrappers) -- the PostgREST query builder IS the abstraction, unlike Strapi's HTTP wrapper approach
- Stub methods throw descriptive errors ('ClassName._methodName not implemented') for clear debugging during incremental development

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Adapter foundation complete -- all infrastructure in place for Phase 25/26 to fill in actual method implementations
- Setting `staticSettings.dataAdapter.type = 'supabase'` is now a valid configuration (stubs will throw at runtime until methods are implemented)
- Phase 25 can start implementing SupabaseDataProvider methods (getElectionData, getNominationData, etc.)
- Phase 26 can start implementing SupabaseDataWriter methods (login, register, etc.)

## Self-Check: PASSED

All 7 created files verified present. All 3 task commits verified in git log.

---
*Phase: 23-adapter-foundation*
*Completed: 2026-03-18*
