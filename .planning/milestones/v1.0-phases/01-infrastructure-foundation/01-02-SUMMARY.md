---
phase: 01-infrastructure-foundation
plan: 02
subsystem: testing
tags: [playwright, e2e, test-data, setup-projects, admin-tools-api, data-isolation]

# Dependency graph
requires:
  - phase: 01-01
    provides: StrapiAdminClient, testIds constants, Playwright project dependencies config
provides:
  - Default test dataset JSON with 9 collections and complete entity coverage
  - Data setup project importing test data via Admin Tools API
  - Data teardown project cleaning up test data by externalId prefix
  - Auth setup project authenticating as candidate and saving storageState
affects: [01-03, 01-04, 01-05]

# Tech tracking
tech-stack:
  added: []
  patterns: [data-setup-teardown-lifecycle, prefix-based-cleanup, esm-json-import-assertion]

key-files:
  created:
    - tests/tests/data/default-dataset.json
    - tests/tests/setup/data.setup.ts
    - tests/tests/setup/data.teardown.ts
    - tests/tests/setup/auth.setup.ts
  modified: []

key-decisions:
  - 'Used assert { type: json } import syntax for JSON modules to match existing codebase pattern'
  - 'Used import.meta.url with fileURLToPath for ESM-compatible path resolution (no __dirname)'
  - 'Delete order is reverse of import order to safely handle FK constraints'
  - 'Auth setup creates playwright/.auth directory at runtime rather than tracking via git'

patterns-established:
  - 'Data lifecycle: delete-by-prefix -> import-fresh -> run-tests -> teardown-by-prefix'
  - 'Test data naming: all externalIds prefixed with test- for reliable prefix-based cleanup'
  - 'Auth setup: browser-based login saving storageState for downstream project consumption'

requirements-completed: [INFRA-06, INFRA-07, INFRA-08]

# Metrics
duration: 5min
completed: 2026-03-03
---

# Phase 1 Plan 02: Test Dataset and Setup/Teardown Projects Summary

**Complete data isolation layer with 9-collection test dataset, API-driven import/cleanup lifecycle, and candidate auth storageState for Playwright project dependencies**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-03T20:11:08Z
- **Completed:** 2026-03-03T20:16:38Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created comprehensive test dataset with 6 question types, 10 questions across 2 categories, 5 candidates with Likert answers, 2 parties, 2 constituencies, and 1 election
- Built data setup project that deletes stale test data then imports fresh dataset via Admin Tools API
- Built data teardown project that cleans up all test-prefixed records in reverse FK order
- Built auth setup project that logs in as candidate via testId-based locators and saves storageState

## Task Commits

Each task was committed atomically:

1. **Task 1: Create default test dataset JSON** - already committed in `b0fbfb419` (feat, part of 01-05)
2. **Task 2: Create data setup, teardown, and auth setup projects** - `d44565a20` (feat)

## Files Created/Modified

- `tests/tests/data/default-dataset.json` - 9-collection test dataset with test- prefix on all externalIds
- `tests/tests/setup/data.setup.ts` - Deletes existing test data then imports default dataset via StrapiAdminClient
- `tests/tests/setup/data.teardown.ts` - Cleans up all test-prefixed data in reverse import order
- `tests/tests/setup/auth.setup.ts` - Authenticates as mock.candidate.2 and saves storageState for candidate-app tests

## Decisions Made

- Used `assert { type: 'json' }` import syntax for JSON modules to match existing codebase conventions (candidateApp-advanced.spec.ts, global-setup.ts)
- Used `import.meta.url` with `fileURLToPath` for path resolution since `__dirname` is not available in ES modules (matching testsDir.ts pattern)
- Auth setup creates `playwright/.auth/` directory at runtime via `fs.mkdirSync` rather than tracking it in git, since the `tests/.gitignore` already ignores `playwright*/`
- Delete collections in reverse import order (nominations first, questionTypes last) to safely respect foreign key constraints, even though Admin Tools handles cascading

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed ESM compatibility: \_\_dirname and JSON import assertion**

- **Found during:** Task 2 (setup project creation)
- **Issue:** Initial auth.setup.ts used `__dirname` which is not available in ESM, and data.setup.ts lacked `assert { type: 'json' }` for JSON import
- **Fix:** Replaced `__dirname` with `fileURLToPath(import.meta.url)` pattern; added `assert { type: 'json' }` to JSON import
- **Files modified:** tests/tests/setup/auth.setup.ts, tests/tests/setup/data.setup.ts
- **Verification:** `npx playwright test --list` successfully lists all 3 projects
- **Committed in:** d44565a20 (Task 2 commit)

**2. [Deviation - Pre-existing] Task 1 dataset already committed in Plan 01-05**

- **Found during:** Task 1 (dataset creation)
- **Issue:** default-dataset.json was already created and committed as part of the 01-05 plan execution (commit b0fbfb419)
- **Fix:** Verified existing content matches all plan requirements; no changes needed
- **Impact:** No additional commit for Task 1; content verified as correct

---

**Total deviations:** 1 auto-fixed (1 blocking), 1 pre-existing
**Impact on plan:** Auto-fix was necessary for ESM compatibility. Pre-existing dataset was already correct. No scope creep.

## Issues Encountered

None beyond the ESM compatibility fix documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Data isolation lifecycle (setup -> test -> teardown) is fully wired into Playwright project dependencies
- Default dataset provides complete entity coverage for candidate app and voter app E2E tests
- Auth setup saves storageState consumed by candidate-app project via `use.storageState` config
- All three setup files recognized by `npx playwright test --list`

## Self-Check: PASSED

All files verified present. Both commit hashes (b0fbfb419, d44565a20) confirmed in git log.

---

_Phase: 01-infrastructure-foundation_
_Completed: 2026-03-03_
