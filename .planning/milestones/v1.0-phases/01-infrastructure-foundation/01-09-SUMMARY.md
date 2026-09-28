---
phase: 01-infrastructure-foundation
plan: 09
subsystem: testing
tags: [playwright, testid, page-objects, e2e, data-testid, svelte]

# Dependency graph
requires:
  - phase: 01-infrastructure-foundation
    provides: testIds.ts constants, page object stubs, component data-testid attributes
provides:
  - Reconciled testIds.ts constants matching actual Svelte component data-testid values
  - Updated page objects with working locators for voter questions and candidate home
  - Shared component testId entries (questionActions, questionDelete)
affects: [01-infrastructure-foundation, 02-test-coverage]

# Tech tracking
tech-stack:
  added: []
  patterns: [shared-component-natural-naming, nth-pattern-for-indexed-elements, skip-is-next-button]

key-files:
  created: []
  modified:
    - tests/tests/utils/testIds.ts
    - tests/tests/pages/voter/QuestionsPage.ts
    - tests/tests/pages/candidate/HomePage.ts
    - frontend/src/lib/components/errorMessage/ErrorMessage.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/(protected)/questions/[questionId]/+page.svelte
    - frontend/src/lib/components/questions/QuestionChoices.svelte
    - frontend/src/lib/components/electionSelector/ElectionSelector.svelte

key-decisions:
  - 'Shared components keep natural testId names; testIds.ts adapts to match them'
  - 'Skip button removed from page object; skip() delegates to nextButton since same DOM element'
  - 'Index suffixes removed from QuestionChoices and ElectionSelector for Playwright nth() pattern'

patterns-established:
  - 'Shared component testIds use natural naming without page prefix (question-next, entity-card)'
  - 'Indexed elements use base testId without suffix for Playwright getByTestId().nth(i) pattern'
  - 'Page objects document behavioral equivalence (skip = next when unanswered) via JSDoc'

requirements-completed: [INFRA-01, INFRA-04, INFRA-08]

# Metrics
duration: 3min
completed: 2026-03-04
---

# Phase 01 Plan 09: testId Reconciliation Summary

**Reconciled 30+ testIds.ts constants with actual Svelte component data-testid values, fixing naming convention violations and index suffix patterns**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-04T07:44:16Z
- **Completed:** 2026-03-04T07:47:59Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Reconciled all testIds.ts constants to match actual component data-testid values for shared components (QuestionActions, EntityCard, ElectionSelector, QuestionChoices)
- Fixed naming convention violations: ErrorMessage.svelte (camelCase to kebab-case), candidate question page (singular to plural prefix)
- Updated page objects (QuestionsPage, HomePage) to use reconciled constants with correct locator patterns
- Removed phantom skipButton property from QuestionsPage (no separate skip button exists in the DOM)

## Task Commits

Each task was committed atomically:

1. **Task 1: Reconcile testIds.ts constants and fix component naming mismatches** - `88786cbb4` (fix)
2. **Task 2: Update page objects to use reconciled testIds constants** - `e2f279964` (fix)

## Files Created/Modified

- `tests/tests/utils/testIds.ts` - Reconciled constants: candidate.home.statusMessage, voter.questions with shared component values, voter.results.card -> entity-card, voter.elections.card -> election-selector-option, added shared.questionActions and shared.questionDelete
- `frontend/src/lib/components/errorMessage/ErrorMessage.svelte` - Fixed data-testid from camelCase "errorMessage" to kebab-case "error-message"
- `frontend/src/routes/[[lang=locale]]/candidate/(protected)/questions/[questionId]/+page.svelte` - Fixed singular "candidate-question-_" to plural "candidate-questions-_" for 5 testIds
- `frontend/src/lib/components/questions/QuestionChoices.svelte` - Removed index suffix from "question-choice-{i}" for nth() pattern
- `frontend/src/lib/components/electionSelector/ElectionSelector.svelte` - Removed index suffix from "election-selector-option-{i}" for nth() pattern
- `tests/tests/pages/voter/QuestionsPage.ts` - Removed skipButton property, skip() delegates to nextButton, added JSDoc explaining behavior
- `tests/tests/pages/candidate/HomePage.ts` - Renamed readyMessage to statusMessage, expectReady to expectStatus

## Decisions Made

- Shared components keep their natural testId naming (e.g., "question-next" not "voter-questions-next") because they are used across both voter and candidate apps
- Skip button removed from QuestionsPage rather than pointing both skip and next to the same testId, avoiding confusion for test authors
- Index suffixes removed from data-testid attributes to enable Playwright's `getByTestId().nth(i)` pattern instead of string interpolation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All testIds.ts constants now match actual DOM data-testid values, unblocking reliable E2E test authoring
- Page objects have working locators that will resolve to real elements when the app runs
- Remaining plan 01-10 can proceed to address any final gap closure items

## Self-Check: PASSED

All 7 modified files verified on disk. Both task commits (88786cbb4, e2f279964) verified in git history.

---

_Phase: 01-infrastructure-foundation_
_Completed: 2026-03-04_
