---
phase: 22-schema-migrations
plan: 01
subsystem: database
tags: [postgresql, jsonb, rls, rpc, supabase, schema-migration]

# Dependency graph
requires: []
provides:
  - app_settings.customization jsonb column for per-project app customization
  - candidates.terms_of_use_accepted timestamptz column for ToU tracking
  - column-level GRANT UPDATE including terms_of_use_accepted for candidate self-edit
  - upsert_answers(uuid, jsonb, boolean) RPC for atomic candidate answer writes
affects: [23-type-generation, 24-data-adapters, 25-candidate-adapter]

# Tech tracking
tech-stack:
  added: []
  patterns: [SECURITY INVOKER RPC with RLS enforcement, null-value stripping for JSONB delete semantics]

key-files:
  created: []
  modified:
    - apps/supabase/supabase/schema/007-app-settings.sql
    - apps/supabase/supabase/schema/003-entities.sql
    - apps/supabase/supabase/schema/013-auth-rls.sql
    - apps/supabase/supabase/schema/006-answers-jsonb.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql

key-decisions:
  - "upsert_answers uses SECURITY INVOKER (not DEFINER) so RLS candidate_update_own policy enforces row-level access"
  - "Null-value stripping in upsert_answers supports remove-answer semantics from the frontend adapter"
  - "Single UPDATE per branch (no intermediate variable) to ensure validate_answers_jsonb trigger fires exactly once"

patterns-established:
  - "SECURITY INVOKER RPC pattern: use when the function should run with caller permissions and RLS should apply"
  - "Schema source + migration parity: function body in schema file must be byte-for-byte identical to migration appendix"

requirements-completed: [SCHM-01, SCHM-03, SCHM-04]

# Metrics
duration: 6min
completed: 2026-03-18
---

# Phase 22 Plan 01: Schema Additions Summary

**Three schema objects added for frontend adapter: app_settings.customization JSONB column, candidates.terms_of_use_accepted timestamp, and upsert_answers SECURITY INVOKER RPC with null-stripping merge semantics**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-18T13:04:23Z
- **Completed:** 2026-03-18T13:10:09Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Added customization JSONB column to app_settings for per-project app customization settings (SCHM-01)
- Added terms_of_use_accepted timestamptz column to candidates with column-level GRANT for self-edit (SCHM-03)
- Created upsert_answers RPC function with SECURITY INVOKER, merge/overwrite modes, and null-value stripping (SCHM-04)
- Consolidated migration applies cleanly via supabase db reset (exit 0)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add customization column and terms_of_use_accepted column to schema source files** - `0f471f8d2` (feat)
2. **Task 2: Add upsert_answers RPC to 006-answers-jsonb.sql** - `6b489a2e2` (feat)
3. **Task 3: Append SCHM-01, SCHM-03, SCHM-04 changes to consolidated migration** - `dfd0625ac` (feat)

## Files Created/Modified
- `apps/supabase/supabase/schema/007-app-settings.sql` - Added customization jsonb column with DEFAULT '{}'
- `apps/supabase/supabase/schema/003-entities.sql` - Added terms_of_use_accepted timestamptz column after candidates trigger
- `apps/supabase/supabase/schema/013-auth-rls.sql` - Extended GRANT UPDATE to include terms_of_use_accepted
- `apps/supabase/supabase/schema/006-answers-jsonb.sql` - Added upsert_answers function and GRANT, removed fulfilled TODO
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` - Appended Phase 22 additions block (lines 2838-2905)

## Decisions Made
- Used SECURITY INVOKER for upsert_answers so existing RLS candidate_update_own policy enforces row-level access without duplication
- Implemented null-value stripping (keys with JSON null values removed after merge) to support "remove answer" semantics from the frontend adapter
- Used single UPDATE per branch to ensure validate_answers_jsonb trigger fires exactly once per call
- Re-issued REVOKE/GRANT in migration (not just adding to existing GRANT) for idempotent migration application

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Supabase local instance was not running; started it for migration verification via `supabase start`, then verified with `supabase db reset` (exit 0), then stopped it

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All three schema additions (SCHM-01, SCHM-03, SCHM-04) are live in schema source files and consolidated migration
- Ready for Plan 02 (published column, external_id, answers column additions) to complete remaining SCHM-02 requirements
- upsert_answers RPC is ready for use by the candidate data adapter in Phase 25

## Self-Check: PASSED

All 6 files verified present. All 3 task commits verified in git log.

---
*Phase: 22-schema-migrations*
*Completed: 2026-03-18*
