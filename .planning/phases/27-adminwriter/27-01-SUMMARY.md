---
phase: 27-adminwriter
plan: 01
subsystem: database
tags: [postgres, rls, jsonb, pgtap, supabase, admin-jobs, merge-rpc]

# Dependency graph
requires:
  - phase: 22-schema
    provides: "Base schema, RLS policies, can_access_project() helper, update_updated_at() trigger"
provides:
  - "admin_jobs table for persisting admin job results"
  - "merge_custom_data RPC for shallow JSONB merge on questions.custom_data"
  - "Migration file 00004_admin_jobs_and_merge_rpc.sql"
  - "pgTAP tests for admin_jobs RLS and merge_custom_data behavior"
affects: [27-02-adminwriter, admin-app]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Immutable table pattern: INSERT/SELECT/DELETE only, no UPDATE policy"
    - "SECURITY INVOKER RPC delegates access control to existing RLS policies"

key-files:
  created:
    - apps/supabase/supabase/schema/019-admin-jobs.sql
    - apps/supabase/supabase/migrations/00004_admin_jobs_and_merge_rpc.sql
  modified:
    - apps/supabase/supabase/tests/database/00-helpers.test.sql
    - apps/supabase/supabase/tests/database/10-schema-migrations.test.sql

key-decisions:
  - "admin_jobs is immutable (no UPDATE policy) -- job records are write-once"
  - "merge_custom_data uses SECURITY INVOKER so admin_update_questions RLS policy enforces access"
  - "Shallow JSONB merge via || operator -- callers provide complete replacement values per key"

patterns-established:
  - "Immutable table: 3-policy pattern (SELECT/INSERT/DELETE) for append-only data"
  - "RPC delegation: SECURITY INVOKER functions reuse existing RLS policies"

requirements-completed: [ADMN-01, ADMN-02]

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 27 Plan 01: Database Infrastructure Summary

**admin_jobs table with admin-only RLS and merge_custom_data SECURITY INVOKER RPC for shallow JSONB merge on questions.custom_data**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-19T16:55:32Z
- **Completed:** 2026-03-19T16:58:37Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- admin_jobs table with project_id FK, election_id FK, CHECK constraint on end_status, indexes, set_updated_at trigger
- 3 admin-only RLS policies (SELECT/INSERT/DELETE) using can_access_project() -- no anon access, no UPDATE
- merge_custom_data SECURITY INVOKER RPC for shallow JSONB merge on questions.custom_data with COALESCE for NULL handling
- 25 new pgTAP tests covering table schema, RLS isolation, RPC behavior, and access control (all 65 tests pass)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create schema file with admin_jobs table, RLS, and merge_custom_data RPC** - `44804a63e` (feat)
2. **Task 2: Extend pgTAP tests for admin_jobs table and merge_custom_data RPC** - `30e509406` (test)

## Files Created/Modified
- `apps/supabase/supabase/schema/019-admin-jobs.sql` - admin_jobs table DDL, RLS policies, merge_custom_data RPC
- `apps/supabase/supabase/migrations/00004_admin_jobs_and_merge_rpc.sql` - Migration file for deployment (identical to schema)
- `apps/supabase/supabase/tests/database/00-helpers.test.sql` - admin_job_a fixture and test_id mapping
- `apps/supabase/supabase/tests/database/10-schema-migrations.test.sql` - 25 new ADMN-01/ADMN-02 tests

## Decisions Made
- admin_jobs is immutable (no UPDATE policy) -- job records are write-once, matching the frontend type's append-only semantics
- merge_custom_data uses SECURITY INVOKER so the existing admin_update_questions RLS policy enforces access control without duplicating can_access_project() inside the function body
- Shallow JSONB merge via || operator is correct for this use case -- callers provide complete replacement values for their respective keys (arguments, terms, video)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Database infrastructure complete for Phase 27 Plan 02 (TypeScript adapter methods)
- admin_jobs table ready for SupabaseDataWriter.saveJobResult()
- merge_custom_data RPC ready for SupabaseDataWriter.setQuestionCustomData()
- All 269 tests pass across 11 test files -- no regressions

## Self-Check: PASSED

All files exist. All commits verified.

---
*Phase: 27-adminwriter*
*Completed: 2026-03-19*
