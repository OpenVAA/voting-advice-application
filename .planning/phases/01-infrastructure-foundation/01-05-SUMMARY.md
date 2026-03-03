---
phase: 01-infrastructure-foundation
plan: 05
subsystem: testing
tags: [playwright, e2e, fixtures, page-objects, test-infrastructure]

# Dependency graph
requires:
  - plan: 01-01
    provides: testIds constants, Playwright config with project dependencies
  - plan: 01-03
    provides: data-testid attributes on candidate app Svelte components
  - plan: 01-04
    provides: data-testid attributes on voter app Svelte components
  - plan: 01-07
    provides: data-testid attributes on shared Svelte components
  - plan: 01-08
    provides: data-testid attributes on candidate protected pages
provides:
  - Extended test fixture (fixtures/index.ts) with page object parameters
  - Worker-scoped auth fixture (auth.fixture.ts) for re-authentication
  - LoginPage page object with login action method and raw locators
  - HomePage page object stub with readyMessage locator
  - QuestionsPage page object stub with voter navigation and answer selection
  - Page object pattern template for Phase 2+ to follow
affects: [02-01, 02-02, 02-03, 02-04, 02-05, 03-01, 03-02]

# Tech tracking
tech-stack:
  added: []
  patterns: [fixture-extended-test, page-object-model, worker-scoped-auth]

key-files:
  created:
    - tests/tests/fixtures/index.ts
    - tests/tests/fixtures/auth.fixture.ts
    - tests/tests/pages/candidate/LoginPage.ts
    - tests/tests/pages/candidate/HomePage.ts
    - tests/tests/pages/voter/QuestionsPage.ts
  modified: []

key-decisions:
  - 'Page objects expose both raw Locators and high-level action methods for flexible assertion and action patterns'
  - 'Auth fixture kept separate from fixtures/index.ts for opt-in re-authentication use cases'
  - 'Fixture index re-exports page object classes for direct construction when needed outside fixtures'

patterns-established:
  - 'Import pattern: all test files use import { test, expect } from ../fixtures instead of @playwright/test'
  - 'Page object pattern: constructor(page) with readonly locators from testIds and async action methods'
  - 'Fixture extension: new page objects added as class + fixture entry in index.ts'

requirements-completed: [INFRA-04, INFRA-08]

# Metrics
duration: 2min
completed: 2026-03-03
---

# Phase 1 Plan 05: Fixture-Extended Test Layer and Page Object Model Stubs Summary

**Extended Playwright test fixture with LoginPage/HomePage/QuestionsPage page objects providing typed locators and action methods as test parameters**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-03T20:10:36Z
- **Completed:** 2026-03-03T20:12:43Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created fixture-extended test layer that all Phase 2+ test files will import from instead of @playwright/test directly
- Built three page object stubs demonstrating both candidate and voter app patterns with testIds-based locators
- Created worker-scoped auth fixture for tests needing re-authentication within a worker session
- Established extensible pattern: adding new page objects requires only a class file and a fixture entry

## Task Commits

Each task was committed atomically:

1. **Task 1: Create page object stubs (LoginPage, HomePage, QuestionsPage)** - `fccec832e` (feat)
2. **Task 2: Create fixture index and auth fixture** - `b0fbfb419` (feat)

## Files Created/Modified

- `tests/tests/fixtures/index.ts` - Main fixture export with page object parameters and JSDoc usage guide
- `tests/tests/fixtures/auth.fixture.ts` - Worker-scoped auth state with per-worker login isolation
- `tests/tests/pages/candidate/LoginPage.ts` - Complete page object with email/password/submit locators and login() method
- `tests/tests/pages/candidate/HomePage.ts` - Minimal stub with readyMessage locator and expectReady() method
- `tests/tests/pages/voter/QuestionsPage.ts` - Voter app stub with answer selection, navigation, and skip methods

## Decisions Made

- Page objects expose both raw Locators (for assertions: `await expect(loginPage.errorMessage).toBeVisible()`) and high-level action methods (for actions: `await loginPage.login(email, password)`) providing maximum flexibility
- Auth fixture is a separate file from fixtures/index.ts since most tests use config-level storageState and only need the auth fixture when testing logout/re-login scenarios
- Fixture index re-exports page object classes so tests that need to construct page objects outside the fixture system can still import them from a single location

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Fixture layer ready for Phase 2 spec files to import `{ test, expect }` from `../fixtures`
- Page object pattern documented via LoginPage as the most complete example for Phase 2+ authors to follow
- Auth fixture ready for candidate app tests requiring re-authentication after logout
- Adding new page objects is straightforward: create class in pages/, add fixture entry in fixtures/index.ts

## Self-Check: PASSED

All 5 files verified present. Both commit hashes (fccec832e, b0fbfb419) confirmed in git log.

---

_Phase: 01-infrastructure-foundation_
_Completed: 2026-03-03_
