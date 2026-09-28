---
phase: 129-new-feature-build-question-inputs-alliance-render-nomination
plan: 08
subsystem: dev-seed + e2e-tests
tags: [dev-seed, e2e, alliance, number-scale, multi-choice, multipleText, re-baseline, d-10, d-12, d-13, d-15, d-16, unblk-06]

# Dependency graph
requires:
  - phase: 129-03
    provides: "/nominations question data + alliance nomination triangles in e2e/base"
  - phase: 129-04
    provides: "NumberScaleInput slider (question-number-slider / question-number-value)"
  - phase: 129-05
    provides: "MultipleTextInput row-list (multiple-text-* testids)"
  - phase: 129-06
    provides: "QuestionChoices checkbox multi-select + min/max validity gate"
  - phase: 129-07
    provides: "fixture-layer locators + inert slider/checkbox walk branches"
provides:
  - "e2e/base seed: results.sections gains 'alliance' (LAST) — UNBLK-06 one-line fix; alliance cards + MatchScore gauge render via org→alliance imputation (D-09, zero frontend build)"
  - "e2e/base MAIN opinion category: qu-opin-base-6-number (min 0/max 10) + qu-opin-base-7-multichoice (4 choices, minSelections 2/maxSelections 3) at sort_order 105-106 (D-12)"
  - "e2e/base qu-info-multipleText restored (sort_order 8) + DEFAULT_INFO_ANSWERS keyword pair (UNBLK-01 round-trip data)"
  - "default template: +1 number +1 multi-choice demo opinion questions (D-15); count 24→26"
  - "buildMinimal.defaultAnswerForQuestion: number (numeric midpoint) + multipleChoiceCategorical (choice-id array) branches (D-16)"
  - "Re-baselined voter-journey + candidate-journey specs incl. D-10 alliance presence assertions; full E2E suite green"
affects: [Phase-130 EQTYP assert-only alliance card+drawer + answerNumberScale/answerMultiChoice boundary tests]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Alliance render is a single seed switch: adding 'alliance' (LAST) to results.sections turns on alliance matching + the results tab; Org-first cascade invariant preserved (matchState.svelte.ts:104-110)"
    - "Candidate opinion-walk answering is type-aware and scoped by URL question id: id-scoped question-choice wait (4s) distinguishes choice vs number questions, defeating the number→multi-choice transition's lingering-slider race"
    - "Number values seed as JSON numbers; multi-choice values as choice-id arrays with POLAR_MAX/POLAR_MIN disjoint for maximal subdimension distance"

key-files:
  created:
    - .planning/phases/129-new-feature-build-question-inputs-alliance-render-nomination/129-08-SUMMARY.md
  modified:
    - packages/dev-seed/src/templates/e2e/base.ts
    - packages/dev-seed/tests/templates/base-app-settings.test.ts
    - packages/dev-seed/src/templates/_helpers/buildMinimal.ts
    - packages/dev-seed/src/templates/_helpers/buildMinimal.test.ts
    - packages/dev-seed/src/templates/default.ts
    - packages/dev-seed/src/templates/defaults/questions-override.ts
    - packages/dev-seed/tests/templates/default.test.ts
    - packages/dev-seed/tests/integration/default-template.integration.test.ts
    - tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts
    - tests/tests/specs/candidate/candidate-journey.spec.ts
    - tests/tests/specs/voter/voter-journey.spec.ts
    - tests/tests/utils/candidateJourneyConstants.ts

key-decisions:
  - "UNBLK-06 closed by the one-line sections change (D-08 research verdict) — zero Phase-69 rebuilds; alliance card MatchScore gauge is the free org→alliance imputation output (D-09)"
  - "Candidate walk root-cause was test-side, not frontend: the number→multi-choice transition's lingering Base-6 slider short-circuited the settle so Base-7 was never answered. Fixed by waiting on the id-scoped choices; an exploratory QuestionChoices reactivity change was applied then REVERTED after the DBG trace proved the value persists correctly"
  - "Voter delete-boundary re-baselined to 3 deletes: with Base-6/Base-7 the voter holds 7 base answers, so one delete no longer crosses minimumAnswers=5 (D-13 boundary shift)"
  - "categoryCheckboxes count (5) and score-gauge count (4) verified UNCHANGED empirically (A2 confirmed — main-category placement adds no category/gauge)"

requirements-completed: [UNBLK-01, UNBLK-02, UNBLK-05, UNBLK-06]

coverage:
  - id: UNBLK-06-alliance
    description: "'alliance' added LAST to e2e/base + default sections; alliance tab + card + MatchScore gauge + member-org subcards render for the voter-journey voter's scope (Alliance A in CO-Reg-N)"
    requirement: "UNBLK-06 / D-09 / D-10"
    verification:
      - kind: e2e
        ref: "voter-journey D-10 step: voter-results-alliance-section visible + Alliance A card + match-score gauge + 2nd member-org subcard visible — green"
        status: pass
      - kind: unit
        ref: "base-app-settings.test.ts sections === ['candidate','organization','alliance']"
        status: pass
    human_judgment: false
  - id: D12-D15-seed
    description: "number + multi-choice opinion questions in e2e/base MAIN category + default template; multipleText restored; all seed cleanly (zero validate_answer_value rejections)"
    requirement: "UNBLK-01 / UNBLK-02 / UNBLK-05"
    verification:
      - kind: cli
        ref: "yarn db:seed --template e2e/base (25 questions) + yarn db:seed:default (26 questions) exit 0, no RPC validation errors"
        status: pass
      - kind: unit
        ref: "dev-seed yarn test:unit 444 passed (incl. 3 new buildMinimal D-16 cases + re-baselined type-mix/count assertions)"
        status: pass
    human_judgment: false
  - id: D13-suite
    description: "voter + candidate journeys re-baselined for the new questions + multipleText; full E2E suite green at phase close"
    requirement: "UNBLK-01 / UNBLK-02 / UNBLK-05 (cardinal rule)"
    verification:
      - kind: e2e
        ref: "yarn test:e2e on fresh :5173 + clean DB — 125 passed / 0 failed / 0 did-not-run (10.4m)"
        status: pass
    human_judgment: false

# Metrics
duration: 250min
completed: 2026-07-18
status: complete
---

# Phase 129 Plan 08: Coupled Seed + Journey Re-Baseline (Alliance Render + Number/Multi-Choice/MultipleText) Summary

**Landed the integration wave: flipped the one-line alliance `sections` gap (UNBLK-06), authored the number + multi-choice opinion questions into the `e2e/base` MAIN category and the `default` demo template, restored the multipleText info question, added the `buildMinimal` number/multi-choice answer branches (D-16), and empirically re-baselined the voter + candidate journeys (including D-10 alliance render presence) to a fully green 125-test E2E suite — with zero Phase-69 rebuilds and zero net frontend changes.**

## Performance
- **Duration:** ~4h10m (dominated by the E2E re-baseline + a test-side root-cause on the candidate multi-choice walk + a recurring local `db:reset` storage 502-wedge)
- **Completed:** 2026-07-18
- **Tasks:** 3
- **Files:** 12 modified (+ this SUMMARY)

## Accomplishments

### Task 1 — e2e/base seed authoring (D-12, D-08, UNBLK-06)
- `results.sections` → `['candidate', 'organization', 'alliance']` (alliance strictly LAST, Org-first cascade invariant). This single element is the whole UNBLK-06 fix (D-08 research verdict) — `entityDetails.contents.alliance`, `results.cardContents.alliance`, and the Alliance A/B nomination triangles were already seeded.
- Added `qu-opin-base-6-number` (type `number`, `custom_data { min: 0, max: 10 }`, matchable) and `qu-opin-base-7-multichoice` (type `multipleChoiceCategorical`, new 4-choice `OPIN_MULTICHOICE_EN`, `custom_data { minSelections: 2, maxSelections: 3 }`) at sort_order 105/106 in the MAIN category.
- Extended POLAR_MAX/NEAR_MAX/POLAR_MIN/GENERIC + CA-AA-Special with both questions (number = JSON numbers 10/8/0/5; multi-choice = disjoint 2..3-choice arrays). CA-AA-Special stays a perfect max-match (case (a) both-answered).
- Restored `qu-info-multipleText` (sort_order 8) + a two-keyword `DEFAULT_INFO_ANSWERS` entry; deleted both stale omission NOTEs.
- Seed verify: `yarn db:seed --template e2e/base` — 25 questions, zero validation rejections.
- Re-baselined the coupled `base-app-settings.test.ts` sections assertion.

### Task 2 — buildMinimal branches (D-16, TDD) + default parity (D-15)
- RED → GREEN: `defaultAnswerForQuestion` gained a `number` branch (midpoint of custom_data/top-level min/max, else `0`) and a `multipleChoiceCategorical` branch (array of the first `minSelections` choice ids) — the backend validate_answer_value requires a JSON number / choice-id array, and the prior `{ value: '' }` fall-through was invalid. Exported the function for direct unit coverage (3 new cases).
- `default` template: extended `questions-override.ts` TYPE_PLAN + branches with one `number` (min 0/max 10) and one `multipleChoiceCategorical` (4 choices, minSelections 2/maxSelections 3); bumped count 24→26. The latent emitter emits both types for free.
- Re-baselined coupled `default.test.ts` (count/type-mix, forbidden-type set) + `default-template.integration.test.ts` (26 questions).
- `yarn db:seed:default` — 26 questions, 327 candidates, zero rejections. dev-seed unit suite: 444 passed.

### Task 3 — Empirical re-baseline + D-10 alliance verify + full-suite gate (D-13, D-10)
- **voter-journey:** added `expectNumberQuestionAndAdvance` (slider End→max) + `expectMultiChoiceQuestionAndAdvance` (2 checkboxes) + `settleAndAdvance` (re-advance answered number/multi-choice) walk helpers; inserted Base-6/Base-7 into the main walk and the type-boundary-survival round-trip. Re-baselined the delete→results-CTA boundary to **3 deletes** (7 base answers now; one delete no longer crosses minimumAnswers=5). infoItems 13→14 + multipleText keyword assertions (UNBLK-01 read proof). Added the D-10 alliance step: `voter-results-alliance-section` visible + Alliance A card + `match-score` gauge + 2nd member-org subcard visible. `categoryCheckboxes`(5) and score-gauge(4) counts verified UNCHANGED (A2).
- **candidate-journey:** replaced the radio-only `selectChoice(0)` walk with a type-aware `answerCurrentQuestion(questionId)` (slider / 2-checkbox / radio) scoped by the URL question id. Restored `qu-info-multipleText` to `expectQuestionsVisible`; updated the constants NOTE.
- **Gate:** `yarn test:e2e` on a fresh :5173 dev server + clean DB — **125 passed / 0 failed / 0 did-not-run (10.4m)**.

## Task Commits
1. **Task 1 — e2e/base seed (D-12/D-08/UNBLK-06)** — `1af8cd4a4` (feat)
2. **Task 2 RED — buildMinimal number/multi-choice failing cases (D-16)** — `9c7934691` (test)
3. **Task 2 GREEN — buildMinimal branches + default parity (D-16/D-15)** — `454e91876` (feat)
4. **Task 3 — journey re-baseline + D-10 alliance (D-13/D-10)** — `2a2882b2b` (test)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Candidate opinion-walk stalled on the number→multi-choice transition**
- **Found during:** Task 3 (candidate-journey step 19). The walk never answered Base-7: a lingering Base-6 slider satisfied the naive `slider OR scoped-choices` settle, so the id-scoped Base-7 checkboxes were read as absent and the walk fell to the slider path — Save stayed disabled and `clickContinue` hung 90s.
- **Root cause (confirmed by a temporary browser-console DBG trace):** the multi-choice answer was simply never issued — no `setAnswer(['a','b'])` fired. The multi-choice value persists correctly once actually clicked. This was a **test-timing bug, not a frontend defect.**
- **Fix:** `answerCurrentQuestion` now waits on the id-scoped `question-choice[name=questionChoices-{id}]` (4s) to classify the question; only a genuine number question (no id-scoped choices) takes the slider path. Page-level slider locator used because the number input's root carries its own `number-scale-input` testid (overriding the `candidate-questions-answer` restProp).
- **Files:** `tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts`, `tests/tests/specs/candidate/candidate-journey.spec.ts`
- **Commit:** `2a2882b2b`

**2. [Rule 3 - Blocking] Seed-coupled dev-seed unit assertions re-baselined**
- **Found during:** Tasks 1 & 2. `base-app-settings.test.ts` pinned `sections` to the old 2-element array; `default.test.ts` + `default-template.integration.test.ts` pinned the 24-question count / type mix / forbidden-type set.
- **Fix:** updated to the alliance-inclusive sections and the 26-question / number+multi-choice mix (these are D-12/D-15 re-baselines coupled into this wave by design).
- **Commits:** `1af8cd4a4`, `454e91876`

### Investigated-and-Reverted (no net change)

**Exploratory frontend change — QuestionChoices `selectedMulti` re-sync.** Suspecting a prop-clobber anti-pattern (`$effect` re-seeding `selectedMulti` from `selectedIds` on every parent round-trip), I temporarily rewrote it to a `question.id`-keyed untracked seed (mirroring `OpinionQuestionInput.currentMultiSelection`). After the DBG trace proved the candidate multi-choice value persists correctly (the real fault was test-side), I **reverted** it — the frontend is byte-for-byte unchanged this plan (verified: `git status apps/frontend/` clean). Frontend unit suite stayed green (742) throughout.

### Environmental

**Local `db:reset` storage 502-wedge (documented gotcha).** `supabase db reset`'s post-migration container restart intermittently returns a 502, leaving `storage.buckets` empty (portrait upload → "Bucket not found"). Recovered via a full `db:stop && db:start && db:reset` cycle, which re-provisions `public-assets`/`private-assets` from `config.toml`. Not a product issue.

## Known Stubs
None. All seed rows import cleanly; all new inputs are exercised live in the running app (voter slider/checkbox walk + candidate profile + preview). The alliance card renders with a real imputed match-score gauge and ≥2 member-org subcards.

## Threat Model Verification
- **T-129-11 (Tampering, seeded answer values, low — mitigate):** mitigated. `yarn db:seed --template e2e/base` and `yarn db:seed:default` complete with zero `validate_answer_value` rejections — number values are JSON numbers, multi-choice values are valid choice-id arrays. buildMinimal's number/multi-choice branches emit the same validated shapes (3 unit cases green).
- **T-129-12 (DoS, alliance cascade mis-order, medium — mitigate):** mitigated. 'alliance' is strictly LAST in both templates (enforced by `base-app-settings.test.ts`); the voter-journey D-10 step confirms Alliance A's match-score gauge is present and plausible (member-org subcards render), i.e. the Org-first imputation cascade did not silently degrade (RESEARCH Pitfall 1 symptom absent).

## User Setup Required
None — no external service configuration. Standard E2E prereqs (one fresh dev server on :5173, `yarn db:reset` clean DB) were used for the gate.

## Next Phase Readiness
- **Phase-130** (EQTYP) can now target live locators: `question-number-slider` / `question-number-value` / `question-choice` (checkbox) / `question-choice-helper`, plus the alliance card+drawer (assert-only per D-10) — all rendering against the e2e/base seed authored here.

## Self-Check: PASSED
- FOUND: 129-08-SUMMARY.md + all 12 modified source/test files
- FOUND commits: 1af8cd4a4, 9c7934691, 454e91876, 2a2882b2b
- No unexpected file deletions in the plan commits
- Frontend byte-for-byte unchanged (git status apps/frontend/ clean)
- Full E2E suite: 125 passed / 0 failed / 0 did-not-run
</content>
</invoke>
