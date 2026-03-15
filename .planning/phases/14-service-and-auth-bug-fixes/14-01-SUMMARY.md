---
phase: 14-service-and-auth-bug-fixes
plan: 01
subsystem: database, auth, infra
tags: [postgres, supabase, sql, on-conflict, rls, storage, sveltekit, docker]

# Dependency graph
requires:
  - phase: 12-services
    provides: "bulk_import RPC, storage cleanup triggers, external_id indexes"
  - phase: 10-authentication-and-roles
    provides: "password reset flow, SECURITY DEFINER functions with SET search_path"
provides:
  - "Working bulk_import upsert with partial unique index compatibility"
  - "Schema-qualified storage cleanup calls (no search_path resolution failures)"
  - "Correct password reset redirect to existing /candidate/password-reset route"
  - "Supabase env vars in .env.example and docker-compose.dev.yml for local dev"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ON CONFLICT with WHERE predicate for partial unique indexes"
    - "Schema-qualified function calls in SECURITY DEFINER contexts"

key-files:
  created: []
  modified:
    - "apps/supabase/supabase/schema/016-bulk-operations.sql"
    - "apps/supabase/supabase/schema/014-storage.sql"
    - "apps/supabase/supabase/migrations/00001_initial_schema.sql"
    - "frontend/src/routes/[[lang=locale]]/candidate/forgot-password/+page.svelte"
    - ".env.example"
    - "docker-compose.dev.yml"

key-decisions:
  - "ON CONFLICT WHERE predicate must exactly match partial unique index definition for PostgreSQL to use it"

patterns-established:
  - "Always schema-qualify function calls in SECURITY DEFINER functions with SET search_path = ''"

requirements-completed: ["SRVC-04 (fix)", "SRVC-01 (fix)", "AUTH-02 (fix)", "INFRA-02 (fix)"]

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 14 Plan 01: Service and Auth Bug Fixes Summary

**Fixed bulk_import ON CONFLICT partial index, storage trigger search_path, password reset redirect, and missing Supabase env vars**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-15T15:10:01Z
- **Completed:** 2026-03-15T15:12:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Fixed ON CONFLICT clause in bulk_import to include WHERE predicate matching partial unique indexes on (project_id, external_id)
- Schema-qualified all 4 delete_storage_object calls in SECURITY DEFINER storage cleanup triggers
- Corrected password reset redirect from nonexistent /candidate/update-password to existing /candidate/password-reset route
- Added PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY to .env.example and docker-compose.dev.yml
- Regenerated migration and verified all 209 pgTAP tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix SQL schema bugs (ON CONFLICT + search_path) and regenerate migration** - `3a1e2be72` (fix)
2. **Task 2: Fix password reset redirect and add Supabase env vars to config** - `10f2d7d9f` (fix)

## Files Created/Modified
- `apps/supabase/supabase/schema/016-bulk-operations.sql` - Added WHERE external_id IS NOT NULL to ON CONFLICT clause
- `apps/supabase/supabase/schema/014-storage.sql` - Schema-qualified all delete_storage_object calls with public. prefix
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` - Regenerated with both SQL fixes
- `frontend/src/routes/[[lang=locale]]/candidate/forgot-password/+page.svelte` - Changed redirectTo to /candidate/password-reset
- `.env.example` - Added Supabase URL and anon key with local dev defaults
- `docker-compose.dev.yml` - Added PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY to frontend service

## Decisions Made
- ON CONFLICT WHERE predicate must exactly match the partial unique index definition for PostgreSQL to use it (not just the indexed columns)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All four bugs from the v2.0 milestone audit are fixed
- Migration applies cleanly, all 209 pgTAP tests pass
- Ready for Phase 14 Plan 02 (if any) or Phase 15

## Self-Check: PASSED

All 6 files verified present. Both task commits (3a1e2be72, 10f2d7d9f) verified in git log.

---
*Phase: 14-service-and-auth-bug-fixes*
*Completed: 2026-03-15*
