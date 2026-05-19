---
phase: 03-voter-app-core-journey
plan: 02
subsystem: testing
tags: [playwright, e2e, voter-app, voter-journey, serial-tests, auto-implication]

# Dependency graph
requires:
  - phase: 03-voter-app-core-journey
    provides: Voter page objects (HomePage, IntroPage, QuestionsPage), testIds, voter dataset, data.setup.ts with app settings
  - phase: 01-infrastructure-foundation
    provides: Playwright config, testIds, buildRoute utility, fixtures/index.ts
provides:
  - Voter journey E2E spec covering home through questions to results
  - Data setup fix for questionsIntro bypass and hideIfMissingAnswers
affects: [03-03, 03-04, voter-app-specs]

# Tech tracking
tech-stack:
  added: []
  patterns: [serial-mode-shared-page, trace-off-for-serial, dynamic-question-count-loop]

key-files:
  created:
    - tests/tests/specs/voter/voter-journey.spec.ts
  modified:
    - tests/tests/setup/data.setup.ts

key-decisions:
  - "Set questionsIntro.show to false in data setup so the questions intro page is bypassed, matching the expected Home -> Intro -> Questions flow"
  - "Added hideIfMissingAnswers.candidate: false because 16 opinion questions exist and no candidate answers all of them"
  - "Used different Likert option index (3 vs 4) when re-answering Q1 because reselecting the same option fires onReselect which does not auto-advance"
  - "Dynamic question count loop instead of hardcoded 8 because default + voter datasets create 16 opinion questions total"
  - "Disabled Playwright trace for serial spec via test.use({ trace: 'off' }) to avoid ENOENT errors with shared browser context"

patterns-established:
  - "Serial spec with shared page: use browser.newPage() in beforeAll with test.use({ trace: 'off' }) to avoid trace writer conflicts"
  - "Auto-advance wait pattern: capture URL before click, waitForURL with inequality check, 3s timeout for last-question detection"
  - "Dynamic question loop: answer in while loop, detect last question via timeout catch, click results button explicitly"

requirements-completed: [VOTE-01, VOTE-02, VOTE-03, VOTE-04, VOTE-06]

# Metrics
duration: 19min
completed: 2026-03-07
---

# Phase 3 Plan 2: Voter Journey Spec Summary

**Serial E2E spec covering voter happy path from home through auto-implied election/constituency, intro page, and all 16 Likert questions with previous/skip/re-answer navigation to results**

## Performance

- **Duration:** 19 min
- **Started:** 2026-03-07T13:19:47Z
- **Completed:** 2026-03-07T13:38:47Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Created voter-journey.spec.ts with 4 serial tests covering the full voter happy path
- Verified auto-implication: single election + single constituency skip selection pages entirely
- Exercised all question navigation: answer, previous, skip, re-answer, last-question results button
- Fixed data setup to bypass questions intro page and handle 16-question dataset

## Task Commits

Each task was committed atomically:

1. **Task 1: Create voter-journey.spec.ts covering home, auto-implication, intro, and questions flow** - `eaea5ead5` (feat)

## Files Created/Modified
- `tests/tests/specs/voter/voter-journey.spec.ts` - 4 serial tests: home page load (VOTE-01), election/constituency auto-implication (VOTE-02/03), intro page without category intros (VOTE-04), full question answering with navigation (VOTE-06)
- `tests/tests/setup/data.setup.ts` - Changed questionsIntro.show to false, added hideIfMissingAnswers.candidate: false

## Decisions Made
- Changed `questionsIntro.show` from `true` to `false` in data.setup.ts because the plan's expected flow (Home -> Intro -> Questions) requires bypassing the separate questions intro page at `/en/questions`. The questionsIntro page was showing a second "Start" button between the general intro and the first question, which the plan and voter fixture did not account for.
- Added `entities.hideIfMissingAnswers.candidate: false` to prevent a blocking dialog ("There are no candidates or parties who have responded") that appeared because 16 opinion questions exist across both datasets but no single candidate answers all of them.
- Used `test.use({ trace: 'off' })` at file level because Playwright 1.58.2 has ENOENT errors when the trace writer handles a manually created page that spans multiple serial tests within one worker.
- Used a dynamic question loop rather than hardcoded count of 8, because the combined default + voter datasets produce 16 opinion questions. The loop detects the last question by catching a URL change timeout and then clicking the "Results" button.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed questionsIntro.show setting preventing direct question navigation**
- **Found during:** Task 1
- **Issue:** With `questionsIntro.show: true`, navigating from the intro page landed on a secondary questions intro page at `/en/questions` instead of directly reaching the first question. The voter fixture and plan both expected direct navigation to questions.
- **Fix:** Changed `questionsIntro.show` to `false` in data.setup.ts
- **Files modified:** tests/tests/setup/data.setup.ts
- **Verification:** Tests pass with direct Intro -> first question navigation
- **Committed in:** eaea5ead5 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed "no candidates responded" dialog blocking question answering**
- **Found during:** Task 1
- **Issue:** A modal dialog "There are no candidates or parties in your constituency who have responded" intercepted all clicks on answer options. The 16-question dataset meant no candidate answered all questions, triggering Strapi's hideIfMissingAnswers filter.
- **Fix:** Added `entities.hideIfMissingAnswers.candidate: false` to data.setup.ts app settings
- **Files modified:** tests/tests/setup/data.setup.ts
- **Verification:** No blocking dialog appears during question answering
- **Committed in:** eaea5ead5 (Task 1 commit)

**3. [Rule 1 - Bug] Used different answer option for re-answer to trigger onChange**
- **Found during:** Task 1
- **Issue:** Re-selecting the same Likert option (index 4) on Q1 after navigating back fired `onReselect` instead of `onChange`, so no auto-advance happened. The QuestionChoices component distinguishes between selecting a new value (onChange) and clicking the already-selected value (onReselect).
- **Fix:** Used option index 3 for re-answer instead of 4 to trigger onChange and auto-advance
- **Files modified:** tests/tests/specs/voter/voter-journey.spec.ts
- **Verification:** Re-answer triggers auto-advance successfully
- **Committed in:** eaea5ead5 (Task 1 commit)

**4. [Rule 1 - Bug] Handled 16 questions instead of expected 8**
- **Found during:** Task 1
- **Issue:** Plan assumed 8 Likert questions, but the combined default + voter datasets contain 16 opinion questions. After answering Q8, the test expected to be on the results page but was still on Q9.
- **Fix:** Replaced hardcoded Q4-Q8 loop with dynamic question answering loop that detects the last question
- **Files modified:** tests/tests/specs/voter/voter-journey.spec.ts
- **Verification:** All 16 questions answered, results page reached
- **Committed in:** eaea5ead5 (Task 1 commit)

**5. [Rule 3 - Blocking] Disabled Playwright tracing for serial spec**
- **Found during:** Task 1
- **Issue:** Playwright 1.58.2 trace writer throws ENOENT when a manually created page (via browser.newPage() in beforeAll) spans multiple serial tests. The trace recording collides between the worker-level trace and the shared context.
- **Fix:** Added `test.use({ trace: 'off' })` at file level to disable tracing for this spec
- **Files modified:** tests/tests/specs/voter/voter-journey.spec.ts
- **Verification:** Tests pass without ENOENT errors
- **Committed in:** eaea5ead5 (Task 1 commit)

---

**Total deviations:** 5 auto-fixed (4 bugs, 1 blocking)
**Impact on plan:** All fixes necessary for test correctness. The plan's assumptions about question count and questionsIntro behavior differed from reality; the fixes align the test with actual app behavior. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Voter journey spec validates the complete happy path from home to results
- Data setup now correctly bypasses questionsIntro and handles multi-dataset question counts
- Results page is verified reachable with visible results list, ready for results and detail specs (03-03, 03-04)

## Self-Check: PASSED

- voter-journey.spec.ts exists (193 lines, exceeds min_lines: 80 requirement)
- Task commit eaea5ead5 verified in git history
- data.setup.ts modification verified in commit

---
*Phase: 03-voter-app-core-journey*
*Completed: 2026-03-07*
