---
phase: 05-configuration-variants
plan: 02
subsystem: testing
tags: [playwright, e2e, multi-election, results-sections, configuration-variants]

# Dependency graph
requires:
  - phase: 05-configuration-variants
    plan: 01
    provides: mergeDatasets utility, multi-election overlay dataset, variant setup/teardown projects, Playwright config entries
  - phase: 01-infrastructure-foundation
    provides: StrapiAdminClient, testIds, Playwright project dependencies pattern, data.setup/teardown
provides:
  - Multi-election voter journey spec covering election selection, per-election results, disallowSelection
  - Results section configuration spec covering candidates-only, organizations-only, and both-sections
affects: [05-03, 05-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [serial shared-page voter journey with answerAllQuestions helper, settings-toggle results section testing]

key-files:
  created:
    - tests/tests/specs/variants/multi-election.spec.ts
    - tests/tests/specs/variants/results-sections.spec.ts
  modified: []

key-decisions:
  - "Shared answerAllQuestions helper function for dynamic question loop with category intro handling"
  - "Serial shared-page describe blocks for multi-election journey (4 tests) reusing browser state"
  - "Results-sections spec navigates full journey once in beforeAll then reloads for each settings toggle"
  - "resultsSettings helper function to ensure complete sibling settings in every results component update"

patterns-established:
  - "answerAllQuestions helper: dynamic loop answering all visible questions with category intro and last-question handling"
  - "Settings-toggle results test: navigate once, reload per setting change, verify section visibility"

requirements-completed: [CONF-01, CONF-02, CONF-04, CONF-05, CONF-06]

# Metrics
duration: 2min
completed: 2026-03-09
---

# Phase 5 Plan 02: Multi-Election and Results Sections Specs Summary

**Multi-election voter journey spec with election selection, per-election results accordion, disallowSelection bypass, and results-sections spec with candidates-only/organizations-only/both settings toggles**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-09T19:22:04Z
- **Completed:** 2026-03-09T19:24:54Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created multi-election.spec.ts with 5 tests covering election selection page (2 elections), full question journey with per-election results accordion, constituency auto-implication, election-specific questions, and disallowSelection mode
- Created results-sections.spec.ts with 3 tests covering candidates-only (CONF-05), organizations-only (CONF-06), and both-sections-with-tabs results configurations
- Both specs follow established patterns: testIds constants, buildRoute navigation, StrapiAdminClient settings with complete sibling settings, afterAll restore, trace: 'off' for serial specs

## Task Commits

Each task was committed atomically:

1. **Task 1: Create multi-election variant spec** - `f171fb752` (feat)
2. **Task 2: Create results-sections variant spec** - `d5cd5b0a8` (feat)

## Files Created/Modified
- `tests/tests/specs/variants/multi-election.spec.ts` - Multi-election voter journey with election selection, per-election results, disallowSelection, question filtering (287 lines)
- `tests/tests/specs/variants/results-sections.spec.ts` - Results section configuration tests for candidates-only, organizations-only, and both-sections (268 lines)

## Decisions Made
- **Shared answerAllQuestions helper:** Extracted dynamic question-answering loop into a reusable function that handles category intros, URL-based auto-advance detection, and last-question handling
- **Serial shared-page for multi-election journey:** Used 4 sequential tests sharing a browser page for the main journey (election selection -> questions -> results -> verify accordion), matching the voter-journey.spec.ts pattern
- **Separate describe for disallowSelection:** Used a fresh page with StrapiAdminClient settings toggle, separate from the shared serial journey, to avoid state pollution
- **Results-sections beforeAll journey:** Navigated the full voter journey once in beforeAll and reloaded the page for each settings toggle, avoiding redundant 18-question journeys per test
- **resultsSettings helper:** Created a function to generate complete results component settings (sections + cardContents + showFeedbackPopup + showSurveyPopup) ensuring Pitfall 2 avoidance

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Both spec files are in place for Plans 03 (constituency) and 04 (startFromConstituencyGroup)
- The `answerAllQuestions` helper pattern established here can be reused in constituency and startfromcg specs
- Variant infrastructure (Playwright projects, setup/teardown) from Plan 01 is validated by these spec files

## Self-Check: PASSED

- [x] tests/tests/specs/variants/multi-election.spec.ts exists (287 lines, 5 tests)
- [x] tests/tests/specs/variants/results-sections.spec.ts exists (268 lines, 3 tests)
- [x] Commit f171fb752 exists (Task 1)
- [x] Commit d5cd5b0a8 exists (Task 2)

---
*Phase: 05-configuration-variants*
*Completed: 2026-03-09*
