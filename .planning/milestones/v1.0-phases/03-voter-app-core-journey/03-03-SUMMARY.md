---
phase: 03-voter-app-core-journey
plan: 03
subsystem: testing
tags: [playwright, e2e, voter-app, results-page, entity-detail, drawer, tabs]

# Dependency graph
requires:
  - phase: 03-voter-app-core-journey
    provides: Voter page objects, fixtures, datasets, data setup from Plan 01
provides:
  - E2E spec for results display with candidates, organizations, and entity type tabs
  - E2E spec for candidate and party detail pages via drawer interaction and tab navigation
affects: [03-04, voter-app-specs]

# Tech tracking
tech-stack:
  added: []
  patterns: [url-change-detection-for-auto-advance, party-card-header-link-click, section-heading-count-assertion]

key-files:
  created:
    - tests/tests/specs/voter/voter-results.spec.ts
    - tests/tests/specs/voter/voter-detail.spec.ts
  modified:
    - tests/tests/fixtures/voter.fixture.ts

key-decisions:
  - "Candidate count 11 (not 6): combined default+voter datasets yield 12 candidates minus 1 hidden = 11 visible"
  - "Entity tab label 'Parties' (not 'Organizations'): i18n key common.organization.plural renders as 'Parties'"
  - "Party card heading assertion via h3.first() to avoid entity-card testId overlap with nested subcards"
  - "Party drawer opened via header link (.getByRole('link').first()) because cards with subcards use split action"
  - "URL-based auto-advance detection in fixture instead of nextButton waitFor to reliably detect page transitions"

patterns-established:
  - "URL change detection: use page.waitForURL() for auto-advance instead of waiting for element visibility"
  - "Section heading assertion: verify entity count via h3 heading text rather than counting entity-card testIds (avoids subcard overlap)"
  - "Party card click via header link: cards with subcards only make the header clickable, not the whole card"

requirements-completed: [VOTE-08, VOTE-09, VOTE-10, VOTE-11, VOTE-12]

# Metrics
duration: 47min
completed: 2026-03-07
---

# Phase 3 Plan 3: Voter Results and Entity Detail Summary

**E2E specs for voter results display (11 candidates, 4 parties, entity type tabs) and entity detail drawers with info/opinions/candidates tab navigation**

## Performance

- **Duration:** 47 min
- **Started:** 2026-03-07T13:20:36Z
- **Completed:** 2026-03-07T14:08:37Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created voter-results.spec.ts with 3 tests covering candidate results display, entity type tabs, and party section switching (VOTE-08, VOTE-09, VOTE-10)
- Created voter-detail.spec.ts with 3 tests covering candidate drawer interaction, tab navigation, and party detail with submatches tab (VOTE-11, VOTE-12)
- Fixed voter fixture auto-advance mechanism to use URL change detection and correct question count (16 not 8)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create voter-results.spec.ts** - `fbbc239fd` (feat)
2. **Task 2: Create voter-detail.spec.ts** - `e56e720a3` (feat)

## Files Created/Modified
- `tests/tests/specs/voter/voter-results.spec.ts` - 3 tests: candidate section display, entity type tabs, party section switching
- `tests/tests/specs/voter/voter-detail.spec.ts` - 3 tests: candidate drawer open/close, candidate tabs, party drawer with all tabs
- `tests/tests/fixtures/voter.fixture.ts` - Fixed voterAnswerCount (8->16), URL-based auto-advance, last-question results navigation

## Decisions Made
- Combined default+voter datasets produce 11 visible candidates and 4 parties, not the 6 and 2 originally expected in the plan. Updated assertions to match actual data.
- Tab labels use i18n-rendered text ("Parties" not "Organizations"), so tab selectors use `/parties/i` regex.
- Party entity cards nest candidate subcards sharing the same `entity-card` testId, so party count is verified via section heading text ("4 parties") rather than counting entity-card elements.
- Party drawer click uses header link locator because EntityCard only makes the header clickable when subcards are present (split action pattern).
- Voter fixture auto-advance changed from nextButton.waitFor to page.waitForURL for reliable page transition detection.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed voter fixture voterAnswerCount from 8 to 16**
- **Found during:** Task 1 (voter-results.spec.ts)
- **Issue:** Combined default (8 opinion) + voter (8 opinion) datasets create 16 opinion questions, but fixture defaulted to 8. Fixture got stuck on question 4/16 because it stopped answering too early.
- **Fix:** Updated voterAnswerCount default from 8 to 16
- **Files modified:** tests/tests/fixtures/voter.fixture.ts
- **Verification:** Fixture successfully answers all 16 questions and reaches results page
- **Committed in:** fbbc239fd (Task 1 commit)

**2. [Rule 1 - Bug] Fixed fixture auto-advance detection using URL change**
- **Found during:** Task 1 (voter-results.spec.ts)
- **Issue:** Fixture waited for nextButton visibility after answering, but the next button was already visible on the current page (before auto-advance). This caused the fixture to re-click the same question or miss the URL transition.
- **Fix:** Changed to URL-based detection: record URL before click, wait for URL to differ after click
- **Files modified:** tests/tests/fixtures/voter.fixture.ts
- **Verification:** All 16 questions answered sequentially with URL changes between each
- **Committed in:** fbbc239fd (Task 1 commit)

**3. [Rule 1 - Bug] Fixed fixture last-question results navigation**
- **Found during:** Task 1 (voter-results.spec.ts)
- **Issue:** After answering the last question, auto-advance navigates directly to results. The fixture tried to click nextButton but the element was detached (page already navigated away).
- **Fix:** After last question answer, wait for URL change (auto-advance to results). If URL isn't results yet, fall back to clicking nextButton.
- **Files modified:** tests/tests/fixtures/voter.fixture.ts
- **Verification:** Fixture reliably reaches results page after answering last question
- **Committed in:** fbbc239fd (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (3 bugs in voter fixture)
**Impact on plan:** All fixes necessary for fixture to work correctly with the combined dataset. No scope creep. The fixture bugs were pre-existing from plan 03-01 where the fixture was created before the combined dataset impact was fully understood.

## Issues Encountered
- Candidate count discrepancy: Plan expected 6 visible candidates but combined datasets produce 11. Root cause was the plan assuming only voter dataset candidates appear, while default dataset candidates (5) are also visible since hideIfMissingAnswers is disabled.
- Tab label mismatch: Plan suggested `/organization/i` for tab locator but the i18n rendering produces "Parties" as the tab label. Changed to `/parties/i`.
- Entity card testId overlap: Party cards on results page include nested candidate subcards that also have `entity-card` testId, making count-based assertions unreliable. Used section heading text assertion instead.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Results and detail specs complete, covering VOTE-08 through VOTE-12
- Voter fixture is now reliable for use in plan 03-04 (matching verification)
- All 6 voter spec tests run in parallel with each other

## Self-Check: PASSED

All 2 created files verified present. All 2 task commits verified in git history.

---
*Phase: 03-voter-app-core-journey*
*Completed: 2026-03-07*
