---
phase: 130-e2e-specs-new-feature-coverage
plan: 03
subsystem: testing
tags: [playwright, e2e, voter-journey, matching, number-scale, multi-choice, EQTYP]

# Dependency graph
requires:
  - phase: 130-01
    provides: "answerNumberScale(page, value, min) slider driver + entityDetails.expectQuestionDisplay checkbox counting + expectNumberQuestionDisplay number dual-marker"
  - phase: 129-*
    provides: "e2e/base POLAR_MAX/POLAR_MIN seed with base-6-number + base-7-multichoice opinion questions; the max-walk answering of both new types (129-07/08)"
provides:
  - "voter-journey.spec.ts: 100%-first-card matching-incorporation assertion (EQTYP-01) in the ranking step"
  - "voter-journey.spec.ts: base-6 number dual-marker + base-7 multi-choice drawer displays on the CA-AA-Special opinions tab (EQTYP-01/02 / 129 D-04)"
  - "voter-journey.spec.ts: new 'EQTYP-02: number-scale boundary matching' describe (min-extreme ordering + mid-value monotonic shift, HARD)"
  - "Client-side menu-nav helpers (Opinions/Results) that preserve the in-memory election scope for mid-flow re-answering"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "In-app nav-menu link clicks (Opinions/Results) for mid-flow re-navigation — client-side SvelteKit nav preserves the in-memory election scope; a full page.goto reload bounces to the election selector"
    - "Deterministic client-side traversal to a specific mid-flow question via the spec's existing expectCategoryIntroAndAdvance + settleAndAdvance helpers (no page.goto, no generic skip-loop)"
    - "Force a specific election (expectElectionOptionAndSelect) rather than trusting answerAndAdvanceToResults's non-deterministic options.first() pick"

key-files:
  created: []
  modified:
    - tests/tests/specs/voter/voter-journey.spec.ts

key-decisions:
  - "Reached the mid-flow number question by walking CLIENT-SIDE from results (menu → Opinions), then reusing the spec's plain-click expectCategoryIntroAndAdvance + settleAndAdvance to Base-6 — a full page.goto('/questions') reload drops the in-memory election scope and bounces to the election selector"
  - "Pinned the REGIONAL election explicitly in BOTH the initial read and the return-read; answerAndAdvanceToResults's options.first() pick is non-deterministic between EL-Reg/EL-Mun and POLAR_MIN/POLAR_MAX live only in the Regional CO-Reg-N constituency"
  - "Dropped the plan's 'POLAR_MIN ranks first' sub-claim as an incorrect test assumption (see Deviations) — the must_haves requirement is the ordering + monotonic shift, both asserted HARD"

patterns-established:
  - "goToLocatedQuestionsViaMenu + returnToLocatedResultsViaMenu: the client-side round-trip idiom for re-answering a single question mid-results without losing located scope"

requirements-completed: [EQTYP-01, EQTYP-02]

coverage:
  - id: EQTYP-01-matching
    description: "The ranking step asserts the first (perfect-match POLAR_MAX) card's results-list match-score reads 100% — reachable only if the number (10) and multi-choice (['a','b']) answers incorporate into matching with zero distance"
    requirement: "EQTYP-01"
    verification:
      - kind: e2e
        ref: "tests/tests/specs/voter/voter-journey.spec.ts#matching ranks perfect-match first (100%-first-card assertion)"
        status: pass
    human_judgment: false
  - id: EQTYP-01-drawer
    description: "CA-AA-Special opinions tab asserts the base-7 multi-choice display (voter 2 / entity 2) and base-6 number dual-marker (voter 10 === entity 10) via the plan-130-01 expectQuestionDisplay/expectNumberQuestionDisplay extensions"
    requirement: "EQTYP-01"
    verification:
      - kind: e2e
        ref: "tests/tests/specs/voter/voter-journey.spec.ts#candidate details show the voter-vs-entity answer matrix on CA-AA-Special"
        status: pass
    human_judgment: false
  - id: EQTYP-02-boundary
    description: "All-min voter ranks POLAR_MIN above POLAR_MAX; re-answering ONLY the number question to mid (5) drops POLAR_MIN's score and raises POLAR_MAX's without flipping the ordering — the value-proportional-distance proof + precision backstop"
    requirement: "EQTYP-02"
    verification:
      - kind: e2e
        ref: "tests/tests/specs/voter/voter-journey.spec.ts#EQTYP-02: number-scale boundary matching"
        status: pass
    human_judgment: false

# Metrics
duration: ~55min
completed: 2026-07-19
status: complete
---

# Phase 130 Plan 03: EQTYP Matching-Incorporation + Number-Scale Boundary Summary

**Adds the EQTYP-01/EQTYP-02 assertion depth the 129 re-baseline left out: a 100%-first-card matching-incorporation proof, both new-type drawer displays on the Special drawer, and a dedicated number-scale min/mid boundary test — voter-journey project 2/2 green.**

## Performance

- **Duration:** ~55 min
- **Completed:** 2026-07-19
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- **EQTYP-01 matching incorporation (Task 1):** The ranking step now HARD-asserts the first (perfect-match POLAR_MAX) candidate's results-list match-score reads `100%`. Since the max-walk voter equals POLAR_MAX on every dimension including number (10) and multi-choice (['a','b']), a 100% reading is only reachable if both new opinion types incorporate into matching with zero distance — a broken dispatch would drag the score below 100.
- **EQTYP-01/02 new-type drawer displays (Task 1):** The CA-AA-Special opinions tab now asserts base-7 multi-choice (voter 2 checked / entity 2 markers) and base-6 number dual-marker (voter 10 === entity 10 → single combined marker), consuming the plan-130-01 `expectQuestionDisplay` checkbox counting + `expectNumberQuestionDisplay` (129 D-04).
- **EQTYP-02 number-scale boundary test (Task 2):** New top-level `EQTYP-02: number-scale boundary matching` describe running under the existing `voter-journey` project (serially after the journey). All-min walk: `score(POLAR_MIN) > score(POLAR_MAX)`. Re-answering ONLY the number question to mid (5 of 0..10) via client-side menu navigation shifts the scores monotonically — POLAR_MIN (number 0) drops, POLAR_MAX (number 10) rises — while the ordering is preserved (the precision backstop). All assertions HARD.
- **Dead-code removal (Task 2):** Deleted the commented-out nominations journey step (SKIPPED for the since-fixed 2026-05-31 fetch-all-questions bug); left a one-line pointer to the dedicated `voter-nominations.spec.ts` (plan 130-04, per D-01).

## Task Commits

1. **Task 1: EQTYP-01 matching-incorporation + new-type drawer displays** - `20a54f334` (test)
2. **Task 2: EQTYP-02 number-scale boundary test + remove dead nominations block** - `8b8af0ad5` (test)

## Files Created/Modified

- `tests/tests/specs/voter/voter-journey.spec.ts` — ranking-step 100%-first-card assertion; two new-type drawer displays on the CA-AA-Special step; new EQTYP-02 boundary describe (2 steps) + 4 module-scope helpers (`readCardMatchScore`, `advanceToNumberSlider`, `goToLocatedQuestionsViaMenu`, `returnToLocatedResultsViaMenu`); imports for `answerAndAdvanceToResults`/`answerNumberScale`/`walkUntilQuestionsIntro` + `createNavMenu`; removed the dead nominations block.

## Decisions Made

- **Client-side navigation for mid-flow re-answering.** A full `page.goto('/questions')` reload drops the in-memory election scope and bounces to the election selector (observed live). The boundary test navigates results→questions→results via the in-app nav menu ("Opinions"/"Results" links), which is SvelteKit client-side nav and preserves the located context.
- **Deterministic traversal to Base-6.** `advanceToNumberSlider` was rewritten from the probe's generic page.goto skip-loop (which reloads and loses scope) to a deterministic client-side walk reusing the spec's proven `expectCategoryIntroAndAdvance` + `settleAndAdvance` plain-click helpers — the Base category is base-1..base-7 with the number slider at base-6.
- **Force the Regional election.** `answerAndAdvanceToResults`'s `options.first()` election pick is non-deterministic between EL-Reg/EL-Mun; POLAR_MIN + the POLAR_MAX candidate live only in the Regional CO-Reg-N constituency, so both the initial read and the return-read pin Regional via `expectElectionOptionAndSelect`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dropped the plan's "POLAR_MIN ranks first" sub-claim (incorrect test assumption, not a product finding)**
- **Found during:** Task 2 (boundary test step 1, live run)
- **Issue:** The plan's Task-2 action (b) and acceptance criterion asserted the FIRST card is POLAR_MIN for the all-min voter. Empirically the first card is a different candidate (e.g. "NE AB One"). Root cause: the walk clicks the first-2 checkboxes for multi-choice in BOTH `min` and `max` modes, so the "all-min" voter answers multi-choice `['a','b']` — which AGREES with POLAR_MAX and DISAGREES with POLAR_MIN (`['c','d']`) on that dimension. POLAR_MIN is therefore penalized on multi-choice and is not first. This is CORRECT matching behavior (not a product/matching bug) — the voter is not a pure POLAR_MIN voter on the multi-choice axis.
- **Fix:** Replaced the first-position assertion with a `cards.first()` visibility gate + the ORDERING assertion `score(POLAR_MIN) > score(POLAR_MAX)` (already required). This matches the plan's must_haves TRUTH, which requires the ordering + monotonic shift, NOT first-position. No product code or seed data was modified (specs-only invariant preserved).
- **Files modified:** tests/tests/specs/voter/voter-journey.spec.ts
- **Verification:** boundary test green; ordering + monotonic assertions all HARD and passing.
- **Committed in:** 8b8af0ad5 (Task 2 commit)

**2. [Rule 3 - Blocking] Rewrote the mid-flow navigation to be fully client-side**
- **Found during:** Task 2 (boundary test step 2, live run — repeated timeouts)
- **Issue:** The plan's step-2 recipe used `page.goto('/questions')` + the probe's page.goto-based skip-loop + `page.goto(resultsUrl)`. Each full reload drops the in-memory election scope and bounces to the election selector (the questions-intro guard is stricter than the specific question/category routes), so the number slider never rendered.
- **Fix:** Added `goToLocatedQuestionsViaMenu` + `returnToLocatedResultsViaMenu` (in-app nav-menu link clicks) and rewrote `advanceToNumberSlider` to a deterministic client-side traversal via existing plain-click helpers. All navigation is now client-side, preserving located scope.
- **Files modified:** tests/tests/specs/voter/voter-journey.spec.ts
- **Verification:** boundary test green (26s), full voter-journey project 2/2 green.
- **Committed in:** 8b8af0ad5 (Task 2 commit)

## Verification Evidence

- `npx playwright test --project=voter-journey -c tests/playwright.config.ts` → **4 passed** (data-setup-base + journey + boundary + data-teardown-base), **0 failed, 0 skipped**. Both spec tests RAN (no did-not-run).
- `yarn typecheck:tests` exits 0; `eslint` clean on the spec file (no soft assertions in the new HARD assertion code; no skip/flaky annotations).
- Rigid 129-08 counts untouched in the diff (13-candidate / 14-info-item / 4-gauge / 5-checkbox / 3-delete-boundary expected values unchanged — no re-baseline).
- Env: fresh dev server (frontend on :5174 — a stale wedged server held :5173; targeted via `FRONTEND_PORT=5174`), clean DB (`yarn db:reset`), Supabase up.

## Issues Encountered

- A stale/wedged dev server occupied :5173 (unresponsive, 40+ min old, another session's), forcing the fresh `yarn dev` frontend onto :5174. Ran Playwright with `FRONTEND_PORT=5174` (the config's `baseURL` honors it). No process the user owns was killed.

## Next Phase Readiness

- EQTYP-01 matching criterion closed (100% incorporation proof) + both new-type drawer displays asserted (129 D-04 surface). EQTYP-02 boundary behavior closed (min extreme + mid intermediate + max side via the existing walk), all against the POLAR seed candidates.
- No new files, projects, or fixtures added (consumed plan 130-01's fixtures). Plans 130-04/05/06 unblocked.

## Self-Check: PASSED
