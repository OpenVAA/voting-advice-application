---
phase: 25-dataprovider
plan: 02
subsystem: database, api
tags: [postgresql, rpc, supabase, nominations, polymorphic-join, typescript]

# Dependency graph
requires:
  - phase: 22-database
    provides: "nominations table with entity FK columns and entity_type generated column"
provides:
  - "get_nominations RPC function for single-roundtrip nomination+entity queries"
  - "DPDataType extended with NominationVariantTree and EntityVariantTree union types"
affects: [25-dataprovider]

# Tech tracking
tech-stack:
  added: []
  patterns: ["LANGUAGE sql STABLE SECURITY INVOKER for read-only RPC functions", "COALESCE across polymorphic FK joins for flattened entity columns", "entity_ prefix convention for joined entity columns"]

key-files:
  created:
    - apps/supabase/supabase/migrations/00002_get_nominations_rpc.sql
  modified:
    - apps/supabase/supabase/schema/005-nominations.sql
    - frontend/src/lib/api/base/dataTypes.ts

key-decisions:
  - "LANGUAGE sql (not plpgsql) for get_nominations -- simpler and inlineable by query planner"
  - "SECURITY INVOKER for RLS enforcement on nominations and entity tables"
  - "entity_answers only from candidates and organizations (factions/alliances have no answers column)"
  - "DPDataType accepts union of Array | Tree format to match DataRoot provision methods"

patterns-established:
  - "RPC functions for complex multi-table joins use LANGUAGE sql STABLE SECURITY INVOKER"
  - "Entity columns in joined results use entity_ prefix to avoid name collisions"
  - "Schema source of truth files include RPC definitions alongside table definitions"

requirements-completed: [READ-04]

# Metrics
duration: 2min
completed: 2026-03-19
---

# Phase 25 Plan 02: Nominations RPC & DPDataType Tree Extension Summary

**get_nominations RPC joining 4 entity tables in single round trip, plus DPDataType extended with NominationVariantTree and EntityVariantTree union types**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-19T09:36:58Z
- **Completed:** 2026-03-19T09:39:19Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created get_nominations RPC that joins nominations with candidates, organizations, factions, and alliances in a single database round trip
- Entity columns prefixed with entity_ to avoid collisions, COALESCE across all 4 tables for shared fields
- Extended DPDataType to accept both flat array and tree format variants for nominations and entities

## Task Commits

Each task was committed atomically:

1. **Task 1: Create get_nominations RPC and update schema** - `862a943f2` (feat)
2. **Task 2: Extend DPDataType for tree format variants** - `8b844d816` (feat)

## Files Created/Modified
- `apps/supabase/supabase/migrations/00002_get_nominations_rpc.sql` - Migration with get_nominations function
- `apps/supabase/supabase/schema/005-nominations.sql` - Schema source of truth updated with RPC definition
- `frontend/src/lib/api/base/dataTypes.ts` - DPDataType extended with tree format union types

## Decisions Made
- LANGUAGE sql chosen over plpgsql for get_nominations -- simpler, inlineable by the PostgreSQL query planner
- SECURITY INVOKER ensures RLS policies on nominations and all entity tables are enforced
- entity_answers COALESCE only from candidates and organizations (factions and alliances do not have an answers column)
- DPDataType uses union types (Array | Tree) to match what DataRoot.provideNominationData() and provideEntityData() already accept

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- get_nominations RPC ready for the Supabase DataProvider adapter to call via supabase.rpc('get_nominations', {...})
- DPDataType ready for adapter to return either flat array or tree-structured nomination/entity data
- Plan 03 (getNominationData adapter method) can now consume the RPC and map rows to DPDataType

## Self-Check: PASSED

All files exist. All commits verified.

---
*Phase: 25-dataprovider*
*Completed: 2026-03-19*
