---
phase: 03-voter-app-core-journey
plan: 01
subsystem: testing
tags: [playwright, e2e, voter-app, page-objects, test-data, fixtures]

# Dependency graph
requires:
  - phase: 01-infrastructure-foundation
    provides: Playwright config, testIds, StrapiAdminClient, QuestionsPage, data.setup.ts/teardown.ts, buildRoute utility
provides:
  - Voter-specific test dataset with 7 deterministic candidates and 8 Likert questions
  - Candidate addendum dataset decoupling candidate-app data from shared default
  - Single-constituency default dataset enabling auto-implication (no selection pages)
  - 4 voter page objects (HomePage, IntroPage, ResultsPage, EntityDetailPage)
  - Parameterizable voter answer fixture (voterTest with answeredVoterPage)
  - Extended fixture index with all voter page objects registered
affects: [03-02, 03-03, 03-04, voter-app-specs]

# Tech tracking
tech-stack:
  added: []
  patterns: [dataset-separation, voter-fixture-parameterization, drawer-scoped-page-objects]

key-files:
  created:
    - tests/tests/data/voter-dataset.json
    - tests/tests/data/candidate-addendum.json
    - tests/tests/pages/voter/HomePage.ts
    - tests/tests/pages/voter/IntroPage.ts
    - tests/tests/pages/voter/ResultsPage.ts
    - tests/tests/pages/voter/EntityDetailPage.ts
    - tests/tests/fixtures/voter.fixture.ts
  modified:
    - tests/tests/data/default-dataset.json
    - tests/tests/setup/data.setup.ts
    - tests/tests/utils/testIds.ts
    - tests/tests/fixtures/index.ts

key-decisions:
  - "Single-constituency auto-implication: removed test-constituency-beta from default dataset to enable auto-implied election+constituency flow"
  - "Dataset separation: voter-dataset.json for voter-specific data, candidate-addendum.json for unregistered candidates, default keeps shared foundations"
  - "EntityDetailPage dual-mode: constructor accepts inDrawer option to scope locators to dialog or full page"
  - "Voter fixture uses nextButton waitFor instead of waitForTimeout to comply with no-wait-for-timeout ESLint rule"

patterns-established:
  - "Dataset separation: default-dataset.json (shared), voter-dataset.json (voter-specific), candidate-addendum.json (candidate-specific)"
  - "Voter page object naming: voterHomePage, voterIntroPage (prefixed to avoid collision with candidate page objects)"
  - "Drawer-scoped page objects: EntityDetailPage with inDrawer constructor option for drawer vs direct-URL testing"
  - "Parameterizable voter fixture: voterTest with configurable answer count and Likert index"

requirements-completed: [VOTE-01, VOTE-02, VOTE-03, VOTE-04, VOTE-05, VOTE-06, VOTE-07, VOTE-08, VOTE-09, VOTE-10, VOTE-11, VOTE-12]

# Metrics
duration: 4min
completed: 2026-03-07
---

# Phase 3 Plan 1: Voter Test Infrastructure Summary

**Voter E2E test foundation with 3 dataset files, 4 page objects, parameterizable answer fixture, and single-constituency auto-implication for simple voter journey path**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-07T13:12:43Z
- **Completed:** 2026-03-07T13:16:59Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- Created voter-dataset.json with 7 candidates having deterministic Likert answer patterns for predictable match scoring
- Split default dataset into shared foundations + candidate addendum, enabling single-constituency auto-implication
- Built 4 voter page objects (HomePage, IntroPage, ResultsPage, EntityDetailPage) with drawer support
- Created parameterizable voter answer fixture that navigates Home -> Intro -> Questions -> Results

## Task Commits

Each task was committed atomically:

1. **Task 1: Create voter dataset, candidate addendum, and modify data setup/teardown** - `75a994c99` (feat)
2. **Task 2: Create voter page objects** - `d1cbfb2dc` (feat)
3. **Task 3: Create voter answer fixture and register voter page objects** - `90686999f` (feat)

## Files Created/Modified
- `tests/tests/data/voter-dataset.json` - 7 candidates, 8 Likert questions, 2 categories, 2 parties, 7 nominations with deterministic answers
- `tests/tests/data/candidate-addendum.json` - 2 unregistered candidates and nominations (split from default)
- `tests/tests/data/default-dataset.json` - Removed test-constituency-beta for single-constituency auto-implication
- `tests/tests/setup/data.setup.ts` - Imports all 3 datasets, disables category intros via updateAppSettings
- `tests/tests/utils/testIds.ts` - Added entityTabs entry to voter.results
- `tests/tests/pages/voter/HomePage.ts` - Start button locator and clickStart action
- `tests/tests/pages/voter/IntroPage.ts` - Start button locator and clickStart action
- `tests/tests/pages/voter/ResultsPage.ts` - Results list, entity cards, sections, tabs with switching methods
- `tests/tests/pages/voter/EntityDetailPage.ts` - Drawer/direct-URL dual-mode with tab navigation
- `tests/tests/fixtures/voter.fixture.ts` - Parameterizable answeredVoterPage fixture
- `tests/tests/fixtures/index.ts` - Extended with 4 voter page object fixtures and re-exports

## Decisions Made
- Removed `test-constituency-beta` from default dataset rather than creating a voter-specific constituency. This simplifies auto-implication for all tests -- single election with single CG with single constituency.
- Moved gamma/delta nominations from constituency-beta to constituency-alpha to preserve all 5 registered candidates in the default dataset.
- EntityDetailPage accepts `{ inDrawer: boolean }` constructor option to scope locators to either the open dialog or the full page, supporting both drawer interaction and direct URL navigation patterns.
- Used `nextButton.waitFor({ state: 'visible' })` instead of `waitForTimeout` in voter fixture to comply with the `no-wait-for-timeout` ESLint rule while waiting for question auto-advance.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed trailing comma in default-dataset.json after candidate/nomination removal**
- **Found during:** Task 1
- **Issue:** Removing the last candidates and nominations from the JSON arrays left trailing commas before closing brackets, making the JSON invalid
- **Fix:** Removed trailing commas to produce valid JSON
- **Files modified:** tests/tests/data/default-dataset.json
- **Verification:** `node -e "JSON.parse(require('fs').readFileSync(...))"` succeeds
- **Committed in:** 75a994c99 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor JSON syntax fix necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All voter page objects, fixtures, and datasets are ready for spec file creation in plans 03-02, 03-03, and 03-04
- Data setup imports all 3 datasets and configures app settings for the simple voter journey path
- Voter fixture provides pre-answered page for results and detail specs

## Self-Check: PASSED

All 8 created files verified present. All 3 task commits verified in git history.

---
*Phase: 03-voter-app-core-journey*
*Completed: 2026-03-07*
