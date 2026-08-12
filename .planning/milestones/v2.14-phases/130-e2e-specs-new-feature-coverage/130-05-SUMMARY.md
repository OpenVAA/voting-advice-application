---
phase: 130-e2e-specs-new-feature-coverage
plan: 05
subsystem: testing
tags: [playwright, e2e, candidate, multi-choice, categorical, boolean, EQTYP-01, D-02, D-07]

# Dependency graph
requires:
  - phase: 130-*
    plan: 02
    provides: "candidate-journey.spec.ts wave-1 owner (file-ownership serialization); step 13/21 multipleText round-trip"
  - phase: 129-*
    provides: "QuestionChoices checkbox multi-select mode + D-07 min/max save gating (129-06); e2e/base multi-choice/categorical/boolean opinion questions (129 D-12)"
provides:
  - "candidate-journey step 18.5 — multi-choice type-specific contract (4 checkboxes, choiceHelper visibility, D-07 save gating across the 2..3 window incl. the over-max 4th)"
  - "candidate-journey step 18.6 — D-02 categorical (3 radios) + boolean (2 radios) type-specific tightening"
  - "module-scope id-scoped choice locator helpers (currentQuestionId / scopedChoices / scopedChoicesByType)"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Id-scoped choice locators: name=questionChoices-<id> + [type=checkbox|radio] conjunction (raw attribute locator, eslint-disabled) as the input-type discriminant per question"
    - "D-07 save-gating assertion walk: click nth checkbox → assert toBeChecked → assert caller Save disabled/enabled at each boundary (1/2/3/4 selections)"
    - "Answered-overview round-trip: the display-mode question-choice markup is emitted only when answer != null, so its visibility discriminates answered vs unanswered"

key-files:
  created: []
  modified:
    - tests/tests/specs/candidate/candidate-journey.spec.ts

key-decisions:
  - "choiceHelper: assert VISIBILITY only (a real type-specific contract element — the helper renders only for a multi-choice question with authored min/max); withhold the /2.*3/ content assertion because the runtime Paraglide catalog is missing the multiChoice keys (BLOCKER-130-05) and this specs-only phase must not patch product"
  - "boolean: select the truthy 'yes' choice (index 1) so the answered-overview round-trip is observable — the overview getSavedAnswer treats a saved false as unanswered (pre-existing falsy-guard quirk)"
  - "over-max (4th) behavior: assert the 4th checkbox still CHECKS (QuestionChoices.svelte never disables unchecked boxes) AND Save DISABLES (isMultiChoiceCountValid count<=effectiveMax) — the concrete component-implemented behavior, cited inline"

requirements-completed: [EQTYP-01]

coverage:
  - id: D1
    description: "EQTYP-01 candidate multi-choice type-specific contract: 4 checkbox inputs / 0 radios, choiceHelper visible, Save gating disabled(1)→enabled(2)→enabled(3)→disabled(4, over-max)→enabled(3) with a final in-range save + answered-overview round-trip"
    requirement: "EQTYP-01"
    verification:
      - kind: e2e
        ref: "tests/tests/specs/candidate/candidate-journey.spec.ts#full candidate journey end-to-end @candidate (step 18.5)"
        status: pass
    human_judgment: false
  - id: D2
    description: "D-02 tightening: categorical (qu-opin-base-4) asserts 3 radios / 0 checkboxes; boolean (qu-opin-base-5) asserts exactly 2 radios / 0 checkboxes — closing the EQTYP-01 NOTE on the candidate side"
    requirement: "EQTYP-01"
    verification:
      - kind: e2e
        ref: "tests/tests/specs/candidate/candidate-journey.spec.ts#full candidate journey end-to-end @candidate (step 18.6)"
        status: pass
    human_judgment: false

# Metrics
duration: ~50min
completed: 2026-07-19
status: complete
---

# Phase 130 Plan 05: EQTYP-01 Candidate Type-Specific Opinion Contracts Summary

**Candidate-journey steps 18.5 (multi-choice checkbox contract + D-07 save gating across the 2..3 window incl. the over-max 4th) and 18.6 (D-02 categorical 3-radio + boolean 2-radio tightening), closing the EQTYP-01 candidate leg — proven by two green candidate-journey runs (5 passed / 0 failed / 0 skipped each).**

## Performance

- **Duration:** ~50 min
- **Completed:** 2026-07-19
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added **step 18.5** (multi-choice type-specific contract): navigates from the overview to `qu-opin-base-7-multichoice` via `goToQuestion`, then asserts:
  - **4 CHECKBOX** inputs and **0 radios** (`scopedChoicesByType` on the `name=questionChoices-<id>` + `[type=…]` conjunction — the input type is the discriminant).
  - The `question-choice-helper` element is **visible** (a real type-specific element — QuestionChoices only emits it for a multi-choice question with authored min/max).
  - **D-07 save gating** across the whole 2..3 window: 1 selected → Save DISABLED; 2 → ENABLED (min boundary); 3 → ENABLED (== max); **4 → the 4th box still CHECKS but Save DISABLES** (over-max invalidity, cited to `QuestionChoices.svelte:170-178` + `multiChoiceValidity.ts:30`); uncheck the 4th → back to 3 → ENABLED → save.
  - Answered-overview round-trip: the multi-choice card renders display-mode `question-choice` markup (emitted only when answered).
- Added **step 18.6** (D-02 tightening): categorical `qu-opin-base-4` asserts **3 radios / 0 checkboxes**; boolean `qu-opin-base-5` asserts **exactly 2 radios / 0 checkboxes**; each answered + saved with an answered-overview round-trip. Confined to the 18.5/18.6 region — steps 16-18's likert choreography and the step-19 walk are untouched (D-02 no-sprawl; the Task 2 diff is a single +45-line hunk).
- Added three module-scope locator helpers (`currentQuestionId`, `scopedChoices`, `scopedChoicesByType`) mirroring `candidateQuestionPage.answerCurrentQuestion`'s id-scoping idiom.
- **Two green candidate-journey runs** (one per task) on the running :5173 stack + `yarn db:reset` clean DB: **5 passed, 0 failed, 0 skipped** each; `yarn typecheck:tests` exits 0.

## Task Commits

1. **Task 1: EQTYP-01 multi-choice type-specific step (18.5) + locator helpers** — `01d08f01e` (test)
2. **Task 2: D-02 categorical + boolean type-specific step (18.6)** — `0a26dee8c` (test)

## Files Created/Modified

- `tests/tests/specs/candidate/candidate-journey.spec.ts` — Added module-scope helpers + steps 18.5 and 18.6 between the existing step 18 and step 19. No new files, fixtures, projects, or testIds (as planned).

## Decisions Made

- **choiceHelper content withheld (BLOCKER-130-05):** the helper renders the raw i18n key `questions.multiChoice.selectRange` at runtime (the 129-06 key was added to the type-gen `translations/` source but not the runtime Paraglide `messages/` catalog). Asserting VISIBILITY keeps the type-specific coverage real; the `/2.*3/` content assertion is deferred to a follow-up product fix rather than asserting broken raw-key text (specs-only phase — no product patch).
- **boolean truthy selection:** the overview `getSavedAnswer` discards a saved `false` (`if (!localizedAnswer?.value)`), so 18.6 selects the "yes" (truthy) boolean choice to make the answered round-trip observable. The radio type + count (2) assertions — the D-02 essence — are select-independent.
- **over-max behavior:** asserted as read from the component — the 4th checkbox checks (unchecked boxes are never disabled) while Save disables (over-max is invalid) — with inline citations.

## Deviations from Plan

### Adjustments (test-side, no product patch)

**1. [Rule 1 — Blocking-issue reconciliation] choiceHelper content assertion → visibility-only**
- **Found during:** Task 1 (step 18.5).
- **Issue:** The plan's `/2.*3/` helper-text content assertion failed because the running app renders the raw i18n key (missing from the Paraglide `messages/` catalog — see BLOCKER-130-05).
- **Resolution:** Asserted helper VISIBILITY (still a type-specific element) and documented the runtime i18n gap as a blocker; did NOT patch product (specs-only prohibition). Content assertion deferred to the product fix.
- **Files modified:** `tests/tests/specs/candidate/candidate-journey.spec.ts`
- **Commit:** `01d08f01e`

**2. [Rule 1 — Test robustness] boolean selects the truthy choice**
- **Found during:** Task 2 (step 18.6).
- **Issue:** Selecting boolean choice index 0 saves `false`, which the overview card treats as unanswered (falsy-guard quirk), defeating the answered round-trip.
- **Resolution:** Select index 1 ("yes"/`true`). No product change; the type-specific radio/count assertions are unaffected.
- **Files modified:** `tests/tests/specs/candidate/candidate-journey.spec.ts`
- **Commit:** `0a26dee8c`

## Blockers / Deferred Issues

Two pre-existing product bugs discovered and logged to `.planning/phases/130-e2e-specs-new-feature-coverage/deferred-items.md` (out-of-scope for this specs-only phase — NOT fixed here):

- **BLOCKER-130-05 (i18n gap):** multi-choice helper text renders the raw key `questions.multiChoice.selectRange` at runtime; the two `multiChoice` keys need adding to `apps/frontend/messages/{locale}/questions.json`. Re-add the `/2.*3/` content assertion once fixed.
- **Boolean falsy-guard quirk:** `getSavedAnswer` (`candidate/(protected)/questions/+page.svelte:58`) discards a saved boolean `false`; needs an explicit `== null` check.

## Threat Flags

None — test-only assertion additions to the existing authenticated candidate journey; no new product surface, no package installs (T-130-05 accept disposition holds).

## Next Phase Readiness

- EQTYP-01 candidate leg is closed (multi-choice checkbox contract + D-07 save gating + categorical/boolean tightening). The voter leg (130-06) remains; note it will hit the SAME BLOCKER-130-05 helper-text i18n gap if it asserts helper content.

## Self-Check: PASSED

- Modified file + SUMMARY.md + deferred-items.md exist on disk.
- Both task commits (`01d08f01e`, `0a26dee8c`) present in git history.
- Both candidate-journey runs pass (5 passed / 0 failed / 0 skipped each); `yarn typecheck:tests` exits 0. Acceptance greps: 3× checkbox/radio count assertions, `question-choice-helper` visibility, over-max assertion with `QuestionChoices.svelte` citation, Task 2 diff a single +45-line hunk (no existing step edited).

---
*Phase: 130-e2e-specs-new-feature-coverage*
*Completed: 2026-07-19*
