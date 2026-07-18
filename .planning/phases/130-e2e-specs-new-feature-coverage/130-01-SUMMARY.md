---
phase: 130-e2e-specs-new-feature-coverage
plan: 01
subsystem: testing
tags: [playwright, e2e, fixtures, voter, number-scale, multi-choice, probe]

# Dependency graph
requires:
  - phase: 129-*
    provides: "NumberScaleInput (D-03 keyboard contract) + QuestionChoices checkbox multi-select + number/multi-choice dual-marker display modes; e2e/base POLAR_MAX seed (base-6-number=10, base-7-multichoice=['a','b'])"
provides:
  - "Exported answerNumberScale(page, value, min) — value-parametrized native-range slider driver (Home + N×ArrowRight, clamps at max)"
  - "entityDetails.expectQuestionDisplay extended for checkbox multi-choice (voter+entity counts)"
  - "entityDetails.expectNumberQuestionDisplay — number dual-marker read-only display assertion (129 D-04)"
  - "numberScale.probe.spec.ts — @probe smoke proving both fixture capabilities against a live drawer"
affects: [130-03, 130-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fixtures-first probe (@probe, out-of-band seed, _probes project) proves net-new fixture capability before any spec consumes it (SC4)"
    - "Presence-based (not URL-based) page detection with a waiting slider-probe to stop deterministically at a mid-flow question"

key-files:
  created:
    - tests/tests/specs/_probes/numberScale.probe.spec.ts
  modified:
    - tests/tests/fixtures/voter/voter-journey.fixture.ts
    - tests/tests/fixtures/voter/entityDetails.fixture.ts
    - tests/tests/utils/testIds.ts
    - tests/playwright.config.ts

key-decisions:
  - "answerNumberScale takes (value, min) not a full question object — the only consumer-visible inputs are the target value + scale min"
  - "Candidate drawer opened by clicking the card article directly (mirrors voter-journey.spec's specialCard.click), not openEntityDetailsForCard — no-subcard candidate cards wrap the article in the navigating <a> and lack the entity-card-action descendant that helper targets"
  - "Number dual-marker asserted via disabled slider value attribute + combined-marker presence/position (values are encoded as slider value + left:% offset, not as marker text)"

patterns-established:
  - "expectNumberQuestionDisplay: single combined marker when voter===entity (bothEqual); one marker per present value otherwise"
  - "Voter-side selection reads union checked radios AND checked checkboxes so checkbox multi-choice displays are counted"

requirements-completed: [EQTYP-01, EQTYP-02]

coverage:
  - id: D1
    description: "answerNumberScale drives the native range slider to an EXACT value (7, 0) and clamps at max (10) when driven past it — the EQTYP-02 boundary proof"
    requirement: "EQTYP-02"
    verification:
      - kind: e2e
        ref: "tests/tests/specs/_probes/numberScale.probe.spec.ts#exact-value slider driving lands 7, 0, and clamps at max (10)"
        status: pass
    human_judgment: false
  - id: D2
    description: "expectQuestionDisplay counts checkbox multi-choice voter answers + entity markers; expectNumberQuestionDisplay asserts the 129 D-04 number dual-marker view — proven against the Polar-Max candidate drawer (voter a,b / entity a,b; voter 10 / entity 10)"
    requirement: "EQTYP-01"
    verification:
      - kind: e2e
        ref: "tests/tests/specs/_probes/numberScale.probe.spec.ts#new-type drawer displays: multi-choice + number dual-marker"
        status: pass
    human_judgment: false

# Metrics
duration: ~45min
completed: 2026-07-19
status: complete
---

# Phase 130 Plan 01: EQTYP Voter-Side Fixtures (fixtures-first) Summary

**Value-parametrized answerNumberScale slider driver + expectQuestionDisplay checkbox/number dual-marker support, proven by a live @probe smoke before plan 130-03 consumes them.**

## Performance

- **Duration:** ~45 min
- **Completed:** 2026-07-19
- **Tasks:** 2
- **Files modified:** 4 (+1 created)

## Accomplishments
- Exported `answerNumberScale(page, value, min)` — generalizes the walk's extreme-only Home/End branch to land ANY in-range value via the 129 D-03 keyboard contract (Home + N×ArrowRight, step=1); driving past max clamps (out-of-range answer is physically impossible — the EQTYP-02 boundary proof).
- Extended `entityDetails.expectQuestionDisplay`: voter-side reads now union checked checkboxes with checked radios (numSelected/voterAnswer paths), plus new `voterSelectedCount` + `entitySelectedCount` options for checkbox multi-choice displays (EQTYP-01).
- Added `entityDetails.expectNumberQuestionDisplay` asserting the 129 D-04 number dual-marker read-only view (disabled slider value + marker position; single combined marker when voter === entity).
- Created `numberScale.probe.spec.ts` (@probe, 2 tests) proving both capabilities against a real Polar-Max candidate drawer on a live stack — **2 passed, 0 failed, 0 skipped**. Wired into the `_probes` project testMatch; excluded from the default `yarn test:e2e` via the @probe grep-invert.

## Task Commits

1. **Task 1: answerNumberScale fixture + numberScale probe skeleton + _probes wiring** - `bb6992b15` (test)
2. **Task 2: expectQuestionDisplay multi-choice + number display, proven by probe test 2** - `bb85be746` (test)

## Files Created/Modified
- `tests/tests/fixtures/voter/voter-journey.fixture.ts` - Added + exported `answerNumberScale`; the existing answerMode Home/End slider branch is byte-for-byte unchanged.
- `tests/tests/fixtures/voter/entityDetails.fixture.ts` - `expectQuestionDisplay` checkbox union + `voterSelectedCount`/`entitySelectedCount`; new `expectNumberQuestionDisplay`.
- `tests/tests/specs/_probes/numberScale.probe.spec.ts` - New @probe smoke (2 tests): exact-value slider driving + new-type drawer displays.
- `tests/tests/utils/testIds.ts` - Registered `numberScaleInput: 'number-scale-input'` (maps to the EXISTING NumberScaleInput.svelte product testid — not a new product testid).
- `tests/playwright.config.ts` - Extended the `_probes` project testMatch alternation to include `numberScale`.

## Decisions Made
- `answerNumberScale(page, value, min=0)` signature over `(question, value)` — the consumer only needs the target value + scale min; no full question object required.
- Opened the candidate drawer by clicking the card article directly (mirrors voter-journey.spec's `specialCard.click()`) rather than `resultsPage.openEntityDetailsForCard`. No-subcard candidate cards wrap the whole `<article data-testid=entity-card>` in the navigating `<a data-testid=entity-card-action>`, so the action is an ANCESTOR of the card, and the helper's `card.getByTestId('entity-card-action')` descendant search finds nothing → timeout.
- Number dual-marker values asserted via the disabled slider's `value` attribute + combined-marker presence/position: the display markers carry i18n labels (yourAnswer / entity label), not numeric text; the numeric value is encoded in the slider `value` and the marker `left:%` offset. A single combined marker (bothEqual) proves both voter and entity are the same non-null value.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Registered a testId constant for the number-scale-input container**
- **Found during:** Task 2 (expectNumberQuestionDisplay)
- **Issue:** The number dual-marker display must be scoped to the `NumberScaleInput.svelte` root container, but no `testIds.*` constant referenced its existing `data-testid="number-scale-input"`. The repo convention forbids inline testid string literals in fixtures.
- **Fix:** Added `voter.questions.numberScaleInput: 'number-scale-input'` to `testIds.ts` — a test-util registration pointing at an ALREADY-SHIPPED product testid (129). No new product testid was introduced; no product code changed.
- **Files modified:** tests/tests/utils/testIds.ts
- **Verification:** `yarn typecheck:tests` exits 0; probe test 2 asserts the container via the constant and passes.
- **Committed in:** bb85be746 (Task 2 commit)

**2. [Rule 1 - Bug] Probe advance-to-slider overshot the number question (race)**
- **Found during:** Task 2 live probe run (also affected Task 1 test)
- **Issue:** The initial `advanceToNumberSlider` skip-loop detected the current page by URL and used a one-shot `slider.isVisible()`. On the q5→q6 param-only nav the outgoing question's Next button lingers (SETTLE-BEFORE-COUNT), so the loop clicked Next again and skipped q6 to q7.
- **Fix:** Switched to a WAITING slider-probe (`slider.waitFor({state:'visible', timeout: page})`) at the top of each iteration and presence-based (not URL-based) category-vs-question detection, so the still-transitioning nav can't be mistaken for a skippable question.
- **Files modified:** tests/tests/specs/_probes/numberScale.probe.spec.ts
- **Verification:** Both probe tests pass (2 passed, 0 failed) against a live stack.
- **Committed in:** bb85be746 (folded into Task 2 commit; the probe file is shared)

---

**Total deviations:** 2 auto-fixed (1 blocking testId registration, 1 probe-harness race bug)
**Impact on plan:** Both auto-fixes are test-harness-only; no product code, no new product testids, no seed changes (Phase 130 specs-only invariant preserved). No scope creep.

## Issues Encountered
- `openEntityDetailsForCard` cannot open a no-subcard candidate drawer (its `entity-card-action` descendant search misses the ancestor `<a>` wrap). Resolved by clicking the card article directly, matching the established voter-journey.spec pattern. This is a pre-existing fixture-shape limitation, logged here for plan 130-03 (which opens candidate drawers) but NOT changed — out of this plan's scope.

## Next Phase Readiness
- Plan 130-03 can consume `answerNumberScale` for the EQTYP-02 boundary spec and `expectQuestionDisplay`/`expectNumberQuestionDisplay` for the EQTYP-01/EQTYP-02 drawer assertions without re-derivation (SC4 satisfied for the voter side).
- Note for 130-03: open candidate drawers by clicking the card article directly (not `openEntityDetailsForCard`).

## Self-Check: PASSED

- All 5 declared files + SUMMARY.md exist on disk.
- Both task commits (`bb6992b15`, `bb85be746`) present in git history.
- Both probe tests pass live (2 passed / 0 failed / 0 skipped); `yarn typecheck:tests` exits 0; default suite excludes the @probe (grep-invert intact).

---
*Phase: 130-e2e-specs-new-feature-coverage*
*Completed: 2026-07-19*
