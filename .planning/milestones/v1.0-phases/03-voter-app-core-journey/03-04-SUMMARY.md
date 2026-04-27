---
phase: 03-voter-app-core-journey
plan: 04
subsystem: testing
tags: [playwright, e2e, voter-app, matching-algorithm, openvaa-matching, ranking-verification]

# Dependency graph
requires:
  - phase: 03-voter-app-core-journey
    plan: 01
    provides: Voter dataset with deterministic candidate answer patterns, voter page objects, testIds, data.setup.ts with combined dataset import
  - phase: 01-infrastructure-foundation
    provides: Playwright config, buildRoute utility, testIds constants, StrapiAdminClient
provides:
  - Independent matching algorithm verification comparing @openvaa/matching computation against UI-displayed rankings
  - Tier-based ranking comparison pattern for handling equal-distance candidate ties
  - Custom navigateToResults() helper with URL-change detection for question auto-advance
  - VOTE-05 partial negative coverage (category intros confirmed disabled)
  - VOTE-07 partial above-threshold coverage (results accessible after all questions answered)
affects: [04-voter-settings-edge-cases, phase-4-boundary-testing]

# Tech tracking
tech-stack:
  added: []
  patterns: [independent-matching-computation, tier-based-ranking-comparison, url-change-detection-for-auto-advance]

key-files:
  created:
    - tests/tests/specs/voter/voter-matching.spec.ts
  modified:
    - tests/tests/setup/data.setup.ts

key-decisions:
  - "Combined dataset matching: spec imports both default-dataset.json and voter-dataset.json to compute rankings across all 16 opinion questions and 11 visible candidates"
  - "Tier-based ranking comparison: candidates with equal distances grouped into tiers where any order within a tier is acceptable, avoiding false failures from non-deterministic sort"
  - "URL-change detection for auto-advance: navigateToResults() uses page.waitForURL() to detect actual navigation after answer click rather than element waitFor which could find stale elements"
  - "Serial spec with trace off: uses test.use({ trace: 'off' }) pattern to avoid Playwright 1.58.2 ENOENT trace writer conflicts"
  - "OrdinalQuestion choice ID mapping: dataset raw values (1-5) mapped to choice_N format required by OrdinalQuestion.fromLikert"

patterns-established:
  - "Independent algorithm verification: import @openvaa/matching in test, compute expected results, compare against UI display"
  - "Tier-based ranking: group candidates by distance, verify all tier members present in correct position range, accept any order within tier"
  - "URL-change detection: capture URL before action, waitForURL with predicate comparing against captured URL, then waitFor element visibility"

requirements-completed: [VOTE-05, VOTE-07, VOTE-08, VOTE-09, VOTE-10]

# Metrics
duration: 28min
completed: 2026-03-07
---

# Phase 3 Plan 4: Matching Verification Summary

**Independent @openvaa/matching algorithm verification E2E spec with tier-based ranking comparison across 16 questions and 11 visible candidates from combined datasets**

## Performance

- **Duration:** 28 min
- **Started:** 2026-03-07T13:20:55Z
- **Completed:** 2026-03-07T13:48:52Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Created voter-matching.spec.ts with 7 E2E tests verifying matching algorithm correctness against independent computation
- Implemented tier-based ranking comparison that groups candidates by equal distances, eliminating false failures from non-deterministic sort order
- Built custom navigateToResults() helper using URL-change detection to reliably handle the 350ms question auto-advance behavior
- Provided partial coverage for VOTE-05 (category intros disabled) and VOTE-07 (results accessible above threshold), with full boundary testing explicitly deferred to Phase 4

## Task Commits

Each task was committed atomically:

1. **Task 1: Create voter-matching.spec.ts with independent ranking verification** - `f5a54a993` (feat)

## Files Created/Modified
- `tests/tests/specs/voter/voter-matching.spec.ts` - 278-line E2E spec with independent matching computation, 7 tests covering ranking order, perfect/worst match positions, partial candidate visibility, hidden candidate absence, VOTE-05 and VOTE-07 partial coverage
- `tests/tests/setup/data.setup.ts` - Import sort order fix (ESLint autofix only; hideIfMissingAnswers setting was already applied by plan 03-02)

## Decisions Made
- Imported both default-dataset.json and voter-dataset.json to match the combined 16-question, 11-visible-candidate dataset that the frontend uses, rather than only voter-dataset.json (8 questions, 6 visible candidates) as the plan initially suggested.
- Used tier-based ranking comparison instead of strict position-by-position comparison. Three candidates (Neutral Middle, Mixed Views, Partial Answers) all computed at 25% distance, and two more (Beta Bravo, Alpha Able) at ~20-22%. Strict comparison would produce flaky failures from non-deterministic tie-breaking.
- Built custom navigateToResults() function with URL-change detection instead of using the voterTest fixture. The fixture's waitFor(nextButton) pattern found the existing button before navigation completed, causing all clicks on the same question. The URL-change approach reliably detects actual page transitions.
- Used `test.describe.configure({ mode: 'serial' })` with `test.use({ trace: 'off' })` to avoid Playwright 1.58.2 ENOENT trace writer conflicts when tests share contexts in serial mode.
- Mapped dataset answer values (raw strings "1"-"5") to OrdinalQuestion.fromLikert choice IDs ("choice_1" through "choice_5") since fromLikert creates values with `{id: "choice_N", value: N}` format.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed answer value format for OrdinalQuestion compatibility**
- **Found during:** Task 1
- **Issue:** Plan showed `{ value: Number(ans.value) }` for candidate answers and `{ value: VOTER_ANSWER_VALUE }` for voter answers. OrdinalQuestion.fromLikert creates choice IDs as strings ("choice_1" through "choice_5"), and normalizeValue expects the string choice ID, not a numeric value.
- **Fix:** Changed to `{ value: \`choice_\${ans.value}\` }` for candidates and `{ value: \`choice_\${VOTER_ANSWER_VALUE}\` }` for voter answers.
- **Files modified:** tests/tests/specs/voter/voter-matching.spec.ts
- **Committed in:** f5a54a993

**2. [Rule 1 - Bug] Combined datasets for accurate ranking computation**
- **Found during:** Task 1
- **Issue:** Plan only imported voter-dataset.json (8 questions, 6 visible candidates). The frontend matches against ALL imported data (default + voter datasets = 16 questions, 11 visible candidates). Using only voter data produced incorrect expected rankings.
- **Fix:** Imported both default-dataset.json and voter-dataset.json, collected all opinion questions from both, and included all visible candidates from both datasets.
- **Files modified:** tests/tests/specs/voter/voter-matching.spec.ts
- **Committed in:** f5a54a993

**3. [Rule 1 - Bug] Implemented tier-based ranking comparison for tied distances**
- **Found during:** Task 1
- **Issue:** Strict position-by-position ranking comparison failed because 3 candidates had equal distances (25%) and 2 more were within 2% of each other. The matching algorithm does not guarantee stable sort order for equal distances.
- **Fix:** Implemented tier-based comparison: group candidates by distance (within 0.0001 tolerance), verify all tier members present in the correct position range, accept any order within a tier.
- **Files modified:** tests/tests/specs/voter/voter-matching.spec.ts
- **Committed in:** f5a54a993

**4. [Rule 3 - Blocking] Replaced voterTest fixture with custom navigateToResults()**
- **Found during:** Task 1
- **Issue:** The voterTest fixture's answeredVoterPage navigated 8 questions (default voterAnswerCount) but the combined dataset has 16 opinion questions. Increasing voterAnswerCount to 16 still failed because the fixture's waitFor(nextButton) pattern found the existing next button before auto-advance navigation completed, causing all clicks on the same question.
- **Fix:** Created custom navigateToResults() function using `page.waitForURL()` to detect actual URL changes after each answer click, ensuring navigation completes before the next click.
- **Files modified:** tests/tests/specs/voter/voter-matching.spec.ts
- **Committed in:** f5a54a993

---

**Total deviations:** 4 auto-fixed (3 bugs, 1 blocking)
**Impact on plan:** All fixes necessary for correctness. The plan's simplified view of the data model (voter-only dataset, numeric answer values, strict ranking comparison) did not account for the combined dataset reality. No scope creep -- same 7 tests with the same coverage goals.

## Issues Encountered
- Playwright trace writer ENOENT errors from stale artifact files in `tests/playwright-results/` caused "Something went wrong, sorry!" error pages. Resolved by cleaning the results directory before test runs.
- ESLint flagged 5 issues in initial spec (import sort order, import type annotation, Array<> syntax, await on expect, toBeHidden over not.toBeVisible). All resolved via `eslint --fix` and manual corrections.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 voter app core journey testing is complete (plans 03-01 through 03-04)
- All voter page objects, fixtures, datasets, and specs are in place
- Phase 4 (voter settings and edge cases) can build on the voter infrastructure for boundary testing of VOTE-05 and VOTE-07
- The tier-based ranking comparison pattern is reusable for any future matching verification tests

## Self-Check: PASSED

All created files verified present. Task commit f5a54a993 verified in git history.

---
*Phase: 03-voter-app-core-journey*
*Completed: 2026-03-07*
