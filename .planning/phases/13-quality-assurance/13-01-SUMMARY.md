---
phase: 13-quality-assurance
plan: 01
subsystem: testing
tags: [pgtap, rls, tenant-isolation, candidate-self-edit, supabase, postgres]

# Dependency graph
requires:
  - phase: 10-authentication-and-roles
    provides: RLS policies, auth hooks (has_role, can_access_project, is_candidate_self)
  - phase: 09-schema
    provides: Table definitions, nomination triggers, answer validation
provides:
  - pgTAP test infrastructure (set_test_user, create_test_data, test_id helpers)
  - QUAL-01 tenant isolation tests across 11+ tables
  - QUAL-02 candidate self-edit access control tests
affects: [13-quality-assurance]

# Tech tracking
tech-stack:
  added: [pgTAP]
  patterns: [persistent-helper-functions, __tcache__-reset-between-files, plan()-with-explicit-count]

key-files:
  created:
    - apps/supabase/supabase/tests/database/00-helpers.test.sql
    - apps/supabase/supabase/tests/database/01-tenant-isolation.test.sql
    - apps/supabase/supabase/tests/database/02-candidate-self-edit.test.sql
  modified: []

key-decisions:
  - "Persistent helper functions (committed, not rolled back) so all test files share set_test_user/create_test_data"
  - "plan(N) with explicit counts per file + __tcache__ reset to fix pgTAP counter persistence across files"
  - "Tenant isolation tests use unpublished Project B data to verify admin_a cannot access cross-project data (published data is visible by design)"

patterns-established:
  - "Pattern: Helper functions committed outside BEGIN/ROLLBACK, test assertions inside BEGIN/ROLLBACK"
  - "Pattern: DROP TABLE IF EXISTS __tcache__ at start of each test file to reset pgTAP counter"
  - "Pattern: Use lives_ok + verification query instead of DO blocks for UPDATE/DELETE row-count checks"
  - "Pattern: Explicit plan(N) instead of no_plan() for subsequent test files (ensures count accuracy)"

requirements-completed: [QUAL-01, QUAL-02]

# Metrics
duration: 10min
completed: 2026-03-15
---

# Phase 13 Plan 01: Test Infrastructure and Core Security Tests Summary

**pgTAP test infrastructure with shared helpers plus 51 assertions verifying tenant isolation across 11 tables and candidate self-edit access control**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-15T10:27:07Z
- **Completed:** 2026-03-15T10:37:07Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created reusable pgTAP test helpers (set_test_user, create_test_data, test_id, test_user_id, test_user_roles, reset_role) used by all subsequent test files
- Verified QUAL-01: admin scoped to Project A cannot see unpublished Project B data across elections, constituencies, organizations, candidates, factions, alliances, question_templates, question_categories, questions, nominations; cannot INSERT/UPDATE/DELETE cross-project
- Verified QUAL-02: candidate can read and update own record, cannot modify other candidates (same or different project), cannot insert or delete, can see published data from own project

## Task Commits

Each task was committed atomically:

1. **Task 1: Create test directory and shared helpers (00-helpers.test.sql)** - `5c07fce2a` (test)
2. **Task 2: Tenant isolation tests (01) and candidate self-edit tests (02)** - `39c57a97e` (test)

## Files Created/Modified
- `apps/supabase/supabase/tests/database/00-helpers.test.sql` - Shared test infrastructure: set_test_user(), create_test_data() with 2 accounts/projects/full entity hierarchy, predictable UUID helpers, 8 smoke tests
- `apps/supabase/supabase/tests/database/01-tenant-isolation.test.sql` - QUAL-01: 28 assertions testing cross-project data isolation for SELECT/INSERT/UPDATE/DELETE across all project_id tables and join tables
- `apps/supabase/supabase/tests/database/02-candidate-self-edit.test.sql` - QUAL-02: 15 assertions testing candidate own-record read/update, cross-candidate isolation, insert/delete denial, published data visibility

## Decisions Made
- **Persistent helper functions**: Functions defined outside BEGIN/ROLLBACK in 00-helpers so they persist for subsequent test files in the same pg_prove session. Test data and assertions remain inside BEGIN/ROLLBACK for clean rollback.
- **pgTAP counter reset via __tcache__ drop**: Each subsequent test file drops the __tcache__ temp table to reset the TAP counter, preventing sequence continuation from previous files.
- **Unpublished data for isolation tests**: Project B data is created with published=false while Project A is published=true. This correctly tests that admin_a (Project A) cannot see Project B data through the admin path, while published Project A data is intentionally visible to all authenticated users (correct RLS design).
- **lives_ok + verification instead of DO blocks**: Avoided PL/pgSQL DO blocks for assertions because `PERFORM ok(...)` swallows TAP output. Instead used `lives_ok()` for UPDATE/DELETE operations followed by `reset_role()` + verification queries.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SECURITY DEFINER incompatible with set_config('role', ...)**
- **Found during:** Task 1 (create_test_data)
- **Issue:** `set_config('role', 'postgres', true)` inside SECURITY DEFINER function raises "cannot set parameter role within security-definer function"
- **Fix:** Removed SECURITY DEFINER; function must be called while already in postgres role
- **Files modified:** apps/supabase/supabase/tests/database/00-helpers.test.sql
- **Verification:** supabase test db passes
- **Committed in:** 39c57a97e (Task 2 commit, alongside restructure)

**2. [Rule 3 - Blocking] Helper functions not persisting between test files**
- **Found during:** Task 2 (01-tenant-isolation.test.sql calling create_test_data)
- **Issue:** Functions created inside BEGIN/ROLLBACK in 00-helpers were rolled back, making them unavailable to subsequent test files
- **Fix:** Restructured 00-helpers to create functions outside transaction (committed to DB), with smoke tests in separate BEGIN/ROLLBACK block
- **Files modified:** apps/supabase/supabase/tests/database/00-helpers.test.sql
- **Verification:** supabase test db passes all 3 files
- **Committed in:** 39c57a97e (Task 2 commit)

**3. [Rule 3 - Blocking] pgTAP counter persisting across test files**
- **Found during:** Task 2 (test counter starting at 13 instead of 1)
- **Issue:** pgTAP stores counter in __tcache__ temp table which persists across test files within same pg_prove session
- **Fix:** Added `DROP TABLE IF EXISTS __tcache__` at start of each test file before `plan(N)`
- **Files modified:** 01-tenant-isolation.test.sql, 02-candidate-self-edit.test.sql
- **Verification:** supabase test db passes with correct test numbering
- **Committed in:** 39c57a97e (Task 2 commit)

**4. [Rule 1 - Bug] DO block PERFORM swallows TAP output**
- **Found during:** Task 2 (missing test numbers in TAP output)
- **Issue:** `PERFORM ok(...)` inside DO blocks calls the function but discards the TAP text return value, causing gaps in test output
- **Fix:** Replaced DO blocks with `lives_ok()` for UPDATE/DELETE tests + separate `reset_role()` + verification SELECT assertions
- **Files modified:** 01-tenant-isolation.test.sql, 02-candidate-self-edit.test.sql
- **Verification:** All 51 tests output correctly with sequential numbering
- **Committed in:** 39c57a97e (Task 2 commit)

**5. [Rule 1 - Bug] Incorrect tenant isolation assertion (published data visible cross-project)**
- **Found during:** Task 2 (admin_b seeing Project A published data)
- **Issue:** Plan assumed admin_b cannot see ANY Project A data, but RLS policies correctly allow published data to all authenticated users via `OR published = true`
- **Fix:** Restructured test to verify admin_a cannot see unpublished Project B data (correct isolation test), while acknowledging published data visibility is intentional
- **Files modified:** 01-tenant-isolation.test.sql
- **Verification:** All isolation tests pass correctly
- **Committed in:** 39c57a97e (Task 2 commit)

---

**Total deviations:** 5 auto-fixed (2 bugs, 3 blocking)
**Impact on plan:** All auto-fixes were necessary for test infrastructure to function correctly. The published-data visibility fix corrected a misunderstanding in the plan about RLS behavior -- the actual RLS policies are correct (published data should be visible to voters). No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Test infrastructure (helpers, fixtures) ready for plans 02 and 03 to add remaining test files (03-anon-read through 09-column-restrictions)
- Pattern established: each new test file uses `DROP TABLE IF EXISTS __tcache__` + `plan(N)` + `create_test_data()` + assertions + `finish()` + `ROLLBACK`

## Self-Check: PASSED

- All 3 test files exist with correct line counts (460, 330, 200)
- Both task commits verified (5c07fce2a, 39c57a97e)
- `supabase test db` exits 0 with all 51 tests passing

---
*Phase: 13-quality-assurance*
*Completed: 2026-03-15*
