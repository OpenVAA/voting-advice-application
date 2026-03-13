---
phase: 10-authentication-and-roles
plan: 02
subsystem: database
tags: [rls, postgres, supabase, security, row-level-security, column-grants]

# Dependency graph
requires:
  - phase: 10-authentication-and-roles
    plan: 01
    provides: "user_roles table, has_role/can_access_project/is_candidate_self helper functions, published columns, auth_user_id columns"
  - phase: 09-schema-and-data-model
    provides: "All content tables with project_id, deny-all RLS placeholders, JSONB answers column"
provides:
  - "Per-operation RLS policies for all 16 content tables (79 policies total)"
  - "Anon SELECT on published data for voter-facing tables"
  - "Candidate self-update policy with auth_user_id check"
  - "Party admin read/update on organizations and party candidates"
  - "Admin CRUD via can_access_project() helper"
  - "Column-level protections preventing candidates from modifying structural fields"
  - "Commented-out relational answers RLS for alternative storage approach"
affects: [11-load-testing, 12-services]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-operation RLS policies (separate SELECT/INSERT/UPDATE/DELETE) with role-based access"
    - "Column-level REVOKE + GRANT pattern for structural field protection"
    - "Join table RLS via EXISTS subquery on parent FK"
    - "Migration concatenation order: 010-rls.sql placed after 012-auth-hooks.sql"

key-files:
  created:
    - "apps/supabase/supabase/schema/013-auth-rls.sql"
  modified:
    - "apps/supabase/supabase/schema/010-rls.sql"
    - "apps/supabase/supabase/migrations/00001_initial_schema.sql"

key-decisions:
  - "Migration concatenation order changed: 010-rls.sql after 012-auth-hooks.sql (policies reference functions)"
  - "Column-level REVOKE + GRANT instead of simple column-level REVOKE (table-level grants override column-level revokes)"
  - "Published column protected from authenticated users alongside structural fields (security: prevent self-publication)"
  - "Authenticated users see published data even without admin roles (OR published = true in authenticated SELECT)"

patterns-established:
  - "RLS policy naming: {role}_{operation}_{table} (e.g., anon_select_candidates, admin_insert_elections)"
  - "Column-level protection: REVOKE table-level UPDATE, GRANT UPDATE on allowed columns only"
  - "Join table RLS: anon SELECT true, admin INSERT/DELETE via EXISTS on parent FK project_id"

requirements-completed: [AUTH-05, MTNT-04]

# Metrics
duration: 8min
completed: 2026-03-13
---

# Phase 10 Plan 02: RLS Policies Summary

**79 per-operation RLS policies replacing 16 deny-all placeholders, with column-level structural field protection on candidates and organizations**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-13T13:50:20Z
- **Completed:** 2026-03-13T13:58:15Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Replaced all 16 deny-all RLS policies with 79 per-operation role-based policies covering all content tables
- Candidate self-edit policy allows updating own data (name, answers, etc.) while column-level protections block structural fields
- Party admin can read/update their organization and see their party's candidates
- Join tables use EXISTS subquery on parent FK for access control
- Commented-out relational answers RLS included for alternative storage approach

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace deny-all policies with role-based RLS policies** - `bc2b27354` (feat)
2. **Task 2: Add column-level protections for candidate structural fields** - `311d8d7f8` (feat)

## Files Created/Modified
- `apps/supabase/supabase/schema/010-rls.sql` - Complete rewrite: 79 RLS policies for all 16 content tables
- `apps/supabase/supabase/schema/013-auth-rls.sql` - Column-level REVOKE/GRANT for candidates and organizations
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` - Regenerated from schema files with corrected concatenation order

## Decisions Made
- **Migration concatenation order:** 010-rls.sql must come after 012-auth-hooks.sql because RLS policies reference helper functions (has_role, can_access_project). Changed concatenation order rather than renaming files.
- **Column-level protection approach:** Simple REVOKE on columns is ineffective when table-level UPDATE exists. Used REVOKE table-level UPDATE + GRANT column-level UPDATE on allowed columns instead.
- **Published column protected:** Added `published` to protected columns for both candidates and organizations. Candidates should not be able to self-publish -- this is an admin-controlled action (Rule 2: security).
- **Authenticated users see published data:** Authenticated SELECT policies include `OR published = true` so logged-in users without admin roles can still browse published data (same as anon behavior).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration concatenation order**
- **Found during:** Task 1 (RLS policy creation)
- **Issue:** Schema files 010-rls.sql runs before 012-auth-hooks.sql in alphabetical order, but policies reference functions (has_role, can_access_project) defined in 012
- **Fix:** Changed migration concatenation to place 010-rls.sql after 012-auth-hooks.sql
- **Files modified:** apps/supabase/supabase/migrations/00001_initial_schema.sql
- **Verification:** supabase db reset succeeds
- **Committed in:** bc2b27354 (Task 1 commit)

**2. [Rule 1 - Bug] Column-level REVOKE approach correction**
- **Found during:** Task 2 (column-level protections)
- **Issue:** Simple `REVOKE UPDATE (col) FROM authenticated` is ineffective when table-level UPDATE grant exists -- PostgreSQL ignores column-level revokes that conflict with table-level grants
- **Fix:** REVOKE table-level UPDATE entirely, then GRANT UPDATE on specific allowed columns
- **Files modified:** apps/supabase/supabase/schema/013-auth-rls.sql
- **Verification:** information_schema.column_privileges confirms no UPDATE grant on structural columns for authenticated
- **Committed in:** 311d8d7f8 (Task 2 commit)

**3. [Rule 2 - Missing Critical] Published column protection**
- **Found during:** Task 2 (column-level protections)
- **Issue:** Plan only specified project_id, auth_user_id, organization_id as protected columns. Without protecting `published`, candidates could self-publish by setting published=true on their own record.
- **Fix:** Added `published`, `id`, and `is_generated` to protected (non-grantable) columns
- **Files modified:** apps/supabase/supabase/schema/013-auth-rls.sql
- **Verification:** information_schema.column_privileges confirms no UPDATE grant on published for authenticated
- **Committed in:** 311d8d7f8 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking, 1 bug, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for correctness and security. No scope creep.

## Issues Encountered
- Transient 502 error during `supabase db reset` container restart -- does not affect schema application (seed data executed successfully before the error). This is a known Supabase CLI behavior during container restarts.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All RLS policies in place, ready for SvelteKit integration (Plan 03) and Edge Function invite flow (Plan 04)
- Column-level protections ensure candidates cannot modify structural fields even with self-update RLS policy
- Answer data covered by candidates/organizations RLS (JSONB approach); relational alternative documented

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 10-authentication-and-roles*
*Completed: 2026-03-13*
