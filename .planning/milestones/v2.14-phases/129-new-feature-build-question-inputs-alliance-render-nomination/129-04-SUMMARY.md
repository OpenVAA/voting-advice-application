---
phase: 129-new-feature-build-question-inputs-alliance-render-nomination
plan: 04
subsystem: frontend
tags: [question-inputs, number-scale, slider, opinion-input, daisyui-range, display-mode]

# Dependency graph
requires:
  - phase: 129-01
    provides: isNumberQuestion type guard exported from @openvaa/data
  - phase: 129-02
    provides: NumberQuestionData.min/max bridged from custom_data (makes NumberQuestion.isMatchable true)
provides:
  - "NumberScaleInput component (native range slider, range-primary, live value label, read-only dual-marker display mode) exported from $lib/components/questions"
  - "isNumberQuestion dispatch branch in OpinionQuestionInput.svelte (gated on question.isMatchable)"
  - "data-testid question-number-slider + question-number-value (new locators; registered in testIds.ts by plan 07)"
affects: [129-06 voter-layout auto-advance suppression, 129-07 testId registration, 129-08 number opinion seed rows, Phase-130 answerNumberScale fixture + boundary test]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Native <input type=range> for number opinion input so keyboard exact-value stepping (ArrowUp/Down, Home/End) works for free (UI-SPEC C-2 / D-03)"
    - "Persist on the change event only (release / keyboard step), live label on input event — no auto-advance from a per-pixel drag stream (Phase-130 prohibition)"
    - "Read-only dual-marker display mode reusing the QuestionChoices yourAnswer/otherLabel convention; equal voter+entity values render a single combined marker (overlap backstop)"

key-files:
  created:
    - apps/frontend/src/lib/components/questions/NumberScaleInput.svelte
    - apps/frontend/src/lib/components/questions/NumberScaleInput.type.ts
  modified:
    - apps/frontend/src/lib/components/questions/index.ts
    - apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte

key-decisions:
  - "Native range over a custom slider (UI-SPEC C-2): keyboard exact-value stepping and min/max clamping are native, satisfying the D-03 hard boundary contract without JS key handling"
  - "onChange fires on the DOM change event only (release / keyboard step), never on input — the label tracks the thumb via a separate live-value state so a drag does not stream persist calls (auto-advance suppression is plan 06's scope but the persist boundary is set here)"
  - "Dispatch guarded by isNumberQuestion(question) && question.isMatchable so rangeless number questions keep the error.unsupportedQuestion fallback rather than rendering a broken 0-width range"
  - "Answer values routed through question.ensureValue then narrowed with typeof === 'number' — ensureValue returns the MISSING_VALUE symbol for null/invalid, so the typeof guard coerces missing/invalid answers to null (unanswered) instead of leaking a symbol into the slider"
  - "Value label is text-primary + bold (700) only when the voter has set a value; unset sliders sit at midpoint with a non-primary label (unanswered-opinion convention)"

patterns-established:
  - "Number opinion input via native DaisyUI range range-primary with an adjacent live value label and read-only dual-marker display mode"

requirements-completed: [UNBLK-05]

coverage:
  - id: D1
    description: "NumberScaleInput renders a native range (range-primary, step=1, min/max from question) with a live value label; answer values persist through question.ensureValue on the change event only"
    requirement: "UNBLK-05"
    verification:
      - kind: build
        ref: "yarn build --filter=@openvaa/frontend (exit 0)"
        status: pass
      - kind: source
        ref: "NumberScaleInput.svelte contains type=range, data-testid question-number-slider + question-number-value, step=1, min/max bound from question, onChange routed through question.ensureValue"
        status: pass
    human_judgment: false
  - id: D2
    description: "Matchable number opinion questions dispatch to NumberScaleInput from OpinionQuestionInput; rangeless number questions keep the unsupported fallback; display mode flows to EntityOpinions"
    requirement: "UNBLK-05"
    verification:
      - kind: source
        ref: "OpinionQuestionInput.svelte has an isNumberQuestion branch guarded by question.isMatchable, placed before the ErrorMessage fallback, routing values through ensureValue"
        status: pass
      - kind: unit
        ref: "apps/frontend yarn test:unit --run (53 files, 742 tests pass)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Display mode renders both a voter marker (text-primary, yourAnswer) and an otherLabel entity marker on a disabled range; equal values render a single combined marker (overlap backstop)"
    requirement: "UNBLK-05"
    verification:
      - kind: source
        ref: "NumberScaleInput.svelte display branch renders voter + entity markers, sets disabled on the range, combines the label when value === otherValue"
        status: pass
      - kind: visual
        ref: "Static backstop analysis (see Backstop Verification) — dev-server visual smoke deferred; no running dev server in this execution context"
        status: partial
    human_judgment: true

# Metrics
duration: 18min
completed: 2026-07-18
status: complete
---

# Phase 129 Plan 04: Number-Scale Opinion Input Summary

**A new `NumberScaleInput` component (native `<input type="range">`, DaisyUI `range range-primary`, live value label, read-only dual-marker display mode) dispatched from a new `isNumberQuestion && isMatchable` branch in `OpinionQuestionInput.svelte` — the UNBLK-05 input half (D-03/D-04).**

## Performance

- **Duration:** ~18 min
- **Completed:** 2026-07-18
- **Tasks:** 2
- **Files:** 2 created, 2 modified

## Accomplishments
- Built `NumberScaleInput.svelte` + `NumberScaleInput.type.ts`: native range slider (`range range-primary`, `step="1"`, `min`/`max` from `question.min`/`question.max`), a live value label (`data-testid="question-number-value"`, `text-primary`+bold only when the voter has set a value), and endpoint min/max labels. `valueAsNumber` coercion mirrors the `Input.svelte` number pattern; the answer persists through `question.ensureValue` on the `change` event only (release / keyboard step), while the label tracks the thumb live via the `input` event — so a drag never streams persist calls (Phase-130 auto-advance prohibition).
- Read-only display mode (D-04): the same track rendered `disabled` with two proportionally-positioned markers — the voter's value (`text-primary`, reusing the existing `questions.answers.yourAnswer` i18n key, no new strings) and the entity's value labeled with `otherLabel`. When the two values are equal, a single combined marker renders so neither label hides the other (overlap backstop).
- Exported the component from the questions barrel (`index.ts`).
- Added the dispatch branch to `OpinionQuestionInput.svelte`: `{:else if isNumberQuestion(question) && question.isMatchable}` before the `error.unsupportedQuestion` fallback. Values routed through `question.ensureValue` and narrowed to `number | null`. Rangeless number questions (no min/max) fail `isMatchable` and keep the unsupported fallback. Display mode flows to `EntityOpinions` through the existing `mode='display'` pass-through with no `EntityOpinions` edit.
- Native range gives keyboard exact-value stepping (Arrow keys ±1, Home→min, End→max) and min/max clamping for free — the D-03 hard contract — without intercepting keys.

## Task Commits

Each task committed atomically:

1. **Task 1: NumberScaleInput slider component (D-03/D-04)** — `54dccb77a` (feat)
2. **Task 2: dispatch matchable number questions to NumberScaleInput** — `9d9e69ccf` (feat)

## Files Created/Modified
- `apps/frontend/src/lib/components/questions/NumberScaleInput.svelte` — new native-range number input + dual-marker display mode.
- `apps/frontend/src/lib/components/questions/NumberScaleInput.type.ts` — `NumberScaleInputProps` (extends `SvelteHTMLElements['div']`).
- `apps/frontend/src/lib/components/questions/index.ts` — barrel export (alphabetical, before `OpinionQuestionInput`).
- `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` — `isNumberQuestion && isMatchable` dispatch branch + import.

## Decisions Made
- **Native `<input type="range">`** over a custom slider (UI-SPEC C-2) — keyboard exact-value stepping and clamping are native, satisfying D-03 with no key handling.
- **Persist on `change` only**, live label on `input` via a separate `$state` — sets the persist boundary so a drag stream cannot auto-advance mid-interaction (Phase-130 fixture prohibition). Caller wiring (auto-advance suppression + validity) remains plan 06's single-owner scope.
- **`typeof === 'number'` narrowing after `ensureValue`** — `Question.ensureValue` returns the `MISSING_VALUE` symbol for null/invalid answers; the guard coerces those to `null` (unanswered) so no symbol reaches the slider's `value != null` checks.
- **`isMatchable` guard** keeps rangeless number questions on the existing `error.unsupportedQuestion` fallback (`NumberQuestion.isMatchable` is true only when both `min` and `max` are defined — the plan-02 provider bridge is what populates them).

## Deviations from Plan

**1. [Rule 3 - Blocking] `h-11` Tailwind utility not generated by the project theme**
- **Found during:** Task 1 (`yarn build --filter=@openvaa/frontend` failed with "Cannot apply unknown utility class `h-11`").
- **Issue:** The project's Tailwind v4 theme (`tailwind-theme.css`) exposes a restricted spacing scale; the default `h-11` utility (used for the ≥44px WCAG touch target on the range thumb) is not generated.
- **Fix:** Replaced `@apply h-11` with `@apply h-[2.75rem]` (arbitrary value, same 44px) — always resolves regardless of the theme scale.
- **Files modified:** `NumberScaleInput.svelte`
- **Commit:** `54dccb77a` (folded into Task 1 before commit)

No other deviations — the two-task structure and dispatch shape executed as written.

## Backstop Verification

Two UI-SPEC backstop rows apply to this plan. A dev-server visual smoke (answer + display, light + dark) was **not** run — no dev server is running in this execution context; the seed rows that surface a number opinion question in the running app land in plan 08. Static analysis of the shipped implementation:

- **Equal voter+entity marker overlap (D-04 backstop):** handled structurally — when `value === otherValue` the display branch renders a **single combined marker** (`{yourAnswer} & {otherLabel}`), mirroring the `QuestionChoices` display-mode combined-label pattern, so the two labels cannot occlude each other.
- **Value-label width at narrow viewport (overflow backstop):** the label sits in a `flex justify-between` row between static `min`/`max` endpoint spans; its width is bounded by the digit count of `max`. The slider is `w-full` on its own line below the label row, so a changing label width does not reflow the track. A live visual confirmation is deferred to the plan-08 seed + Phase-130 visual pass.

**Flagged for the verifier:** the dev-server visual smoke (D-04 dual-marker render, light + dark) is the one item not exercised here; it rides the plan-08 seed authoring that first surfaces a matchable number opinion question in the running app.

## Threat Model Verification
- **T-129-04 (Tampering, `NumberScaleInput` persist path, medium — mitigate):** mitigated as planned. Client side: `valueAsNumber` coercion at the input (`NaN` guarded in `handleChange`) + `question.ensureValue` (→ `ensureNumber`) before the value bubbles. Backend `validate_answer_value` 'number' branch rejects non-number JSONB (verified in plan context, `00001_initial_schema.sql:201-204`). No raw string reaches persistence.
- **T-129-05 (Tampering, crafted min/max, low — accept):** accepted as planned. `min`/`max` originate from seeded question rows via the plan-02 typeof-guarded bridge; the `NumberQuestion` constructor throws on a zero range, and the dispatch `isMatchable` guard drops rangeless questions before the slider renders.
- **XSS via rendered labels (canon breadcrumb):** covered by Svelte auto-escaping — the value label and marker text are interpolated numbers / existing i18n strings, no `{@html}`.

## User Setup Required
None — no external service configuration. A matchable number opinion question is not yet in the seed data (plan 08); until then the branch is exercised via unit/build only.

## Next Phase Readiness
- Plan 06 (voter questions layout single owner) can wire auto-advance suppression + validity for number questions against the now-shipped `NumberScaleInput` persist boundary.
- Plan 07 registers `question-number-slider` / `question-number-value` in `tests/tests/utils/testIds.ts`.
- Plan 08 authors number opinion seed rows (`custom_data: { min, max }`) that first surface the slider in the running app; the Phase-130 `answerNumberScale(question, value)` fixture + boundary test target the two new locators.

## Self-Check: PASSED
- FOUND: apps/frontend/src/lib/components/questions/NumberScaleInput.svelte
- FOUND: apps/frontend/src/lib/components/questions/NumberScaleInput.type.ts
- FOUND: apps/frontend/src/lib/components/questions/index.ts (NumberScaleInput export)
- FOUND: apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte (isNumberQuestion branch)
- FOUND commits: 54dccb77a, 9d9e69ccf
- No unexpected file deletions in the plan commits

---
*Phase: 129-new-feature-build-question-inputs-alliance-render-nomination*
*Completed: 2026-07-18*
