---
phase: 129-new-feature-build-question-inputs-alliance-render-nomination
plan: 06
subsystem: frontend
tags: [question-inputs, multi-choice, checkbox, categorical, opinion-input, validity-gate, i18n, auto-advance]

# Dependency graph
requires:
  - phase: 129-01
    provides: MultipleChoiceCategoricalQuestion matchable + isMultipleChoiceQuestion type guard exported from @openvaa/data
  - phase: 129-02
    provides: CustomData['Question'] minSelections/maxSelections keys (JSONB-backed selection-count constraints)
  - phase: 129-04
    provides: NumberScaleInput + isNumberQuestion dispatch branch in OpinionQuestionInput.svelte (this plan adds the number auto-advance suppression)
provides:
  - "QuestionChoices checkbox multi-select mode (selectedIds/otherSelectedIds props, widened ChoiceEventData.value to Id | Array<Id> | null) preserving the question-choice + name=questionChoices-{id} locator contract (D-05)"
  - "OpinionQuestionInput isMultipleChoiceQuestion branch + $bindable valid prop (min/max selection validity surfaced to callers, D-07)"
  - "data-testid=question-choice-helper (new locator — registered in testIds.ts by plan 07)"
  - "questions.multiChoice.{selectRange,selectExact} i18n keys ×7 locales + regenerated TranslationKey union"
  - "Voter layout auto-advance type guard (only single-choice/boolean auto-jump; number + multi-choice never jump) + Skip-gate; candidate Save gate"
affects: [129-07 testId registration for question-choice-helper, 129-08 multi-choice opinion seed rows, Phase-130 answerMultiChoice fixture + min/max boundary tests]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single choice-rendering component (QuestionChoices) hosts both radio (single/boolean) and checkbox (multi) modes, gated by isMultipleChoiceQuestion — keeps one locator contract (D-05)"
    - "Constraint validity is surfaced, never enforced, inside shared components: OpinionQuestionInput computes a bindable `valid`; callers gate Save (candidate) / keep Skip (voter). Over-selection stays physically possible (D-07)"
    - "Auto-advance is per-question-type: only instant single-choice/boolean inputs auto-jump; number (slider) and multi-choice (checkbox) inputs persist without jumping so keyboard/multi-select interaction is not broken"
    - "Zero multi-choice selections = unanswered: an empty-array onChange routes to deleteAnswer, not setAnswer (D-07)"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/components/questions/QuestionChoices.svelte
    - apps/frontend/src/lib/components/questions/QuestionChoices.type.ts
    - apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte
    - apps/frontend/src/lib/components/questions/OpinionQuestionInput.type.ts
    - apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte
    - apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte
    - apps/frontend/src/lib/i18n/translations/{en,fi,sv,da,et,fr,lb}/questions.json
    - apps/frontend/src/lib/types/generated/translationKey.ts

key-decisions:
  - "Checkbox mode branches inside the existing each-loop rather than a separate component — preserves the question-choice testid + name attr contract and reuses the grid/variant/display scaffolding (D-05)"
  - "MultipleChoiceCategoricalQuestion added to the `vertical` default so long localized labels wrap in a vertical checkbox list (matches SingleChoiceCategorical); radio/boolean layout untouched"
  - "Helper text (`question-choice-helper`) rendered OUTSIDE the grid <fieldset> so it does not create a stray grid cell; only in answer mode and only when minSelections/maxSelections authored"
  - "Validity computed in OpinionQuestionInput from a locally-tracked selection (seeded untracked from ensureValue, updated on each toggle, reset on question-id change) and pushed to the bound `valid` via $effect — non-multi branches leave valid true"
  - "Voter layout resets opinionInputValid to true on question-id change (belt-and-braces for same-type Q→Q reuse where the input is not remounted); the child recomputes the correct value immediately after"

patterns-established:
  - "Shared choice component with radio+checkbox modes under one locator contract"
  - "Bindable validity gate: shared input surfaces validity, callers enforce Save/Skip divergence (D-07)"

requirements-completed: [UNBLK-02]

coverage:
  - id: D1
    description: "QuestionChoices renders a checkbox multi-select mode for MultipleChoiceCategoricalQuestion, preserving data-testid=question-choice and name=questionChoices-{id} on every checkbox; over-selection is not hard-disabled; localized helper text (question-choice-helper) shows select-range/select-exact"
    requirement: "UNBLK-02"
    verification:
      - kind: build
        ref: "yarn build --filter=@openvaa/frontend (exit 0)"
        status: pass
      - kind: unit
        ref: "apps/frontend yarn test:unit --run (53 files, 742 tests pass)"
        status: pass
      - kind: source
        ref: "QuestionChoices.svelte checkbox input carries data-testid=question-choice, name=questionChoices-{question.id}, class checkbox-primary + h-32 w-32; no maxSelections-derived disabled binding; helper text in 7 locales verified via CLI"
        status: pass
    human_judgment: false
  - id: D2
    description: "OpinionQuestionInput dispatches multi-choice to QuestionChoices and surfaces a $bindable valid computed from minSelections ?? 1 / maxSelections ?? choices.length; zero selections invalid-as-unanswered"
    requirement: "UNBLK-02"
    verification:
      - kind: build
        ref: "yarn build --filter=@openvaa/frontend (exit 0)"
        status: pass
      - kind: source
        ref: "OpinionQuestionInput.svelte has isMultipleChoiceQuestion branch before the ErrorMessage fallback + $bindable valid; validity formula uses minSelections ?? 1 and maxSelections ?? question.choices.length"
        status: pass
    human_judgment: false
  - id: D3
    description: "Callers gate on validity: candidate canSubmit ANDs answerValid (Save disabled at 1/4, enabled at 2/3 for min2/max3); voter QuestionActions answered ANDs opinionInputValid (Skip outside range); voter handleAnswer suppresses auto-advance for number + multi-choice and deletes the answer on empty selection"
    requirement: "UNBLK-02"
    verification:
      - kind: build
        ref: "yarn build --filter=@openvaa/frontend (exit 0); frontend unit suite green"
        status: pass
      - kind: source
        ref: "voter +layout.svelte: handleAnswer wraps disabled+setTimeout(handleJump) in isSingleChoiceQuestion||isBooleanQuestion guard; empty-array → answers.deleteAnswer; QuestionActions answered ANDs opinionInputValid. candidate +page.svelte: canSubmit ANDs answerValid"
        status: pass
      - kind: manual_procedural
        ref: "Dev-server matrix (min2/max3 at 0/1/2/3/4 selections × candidate Save state / voter action-button label) + long-label wrap backstop — deferred to plan-08 seed (no matchable multi-choice opinion question in the running app yet)"
        status: unknown
    human_judgment: true
    rationale: "The 0/1/2/3/4-selection Save/Skip matrix and dark/light long-label wrap need a running app with a seeded multi-choice opinion question, which lands in plan 08; static source + build/unit verification is complete here."

# Metrics
duration: 9min
completed: 2026-07-18
status: complete
---

# Phase 129 Plan 06: Multi-Choice Categorical Opinion Input Summary

**`QuestionChoices` gains a checkbox multi-select mode (D-05 locator contract preserved), dispatched from `OpinionQuestionInput` with a `$bindable` validity prop; the two callers gate on it (candidate Save disabled, voter action button stays Skip) and the voter layout stops auto-advancing for the number + multi-choice input types — the UNBLK-02 input half with full D-07 constraint UX.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-07-18T08:02:42Z
- **Completed:** 2026-07-18T08:11:49Z
- **Tasks:** 3
- **Files modified:** 14 (2 component + 2 type + 2 route + 7 i18n locales + 1 generated type)

## Accomplishments
- **Checkbox multi-select mode in `QuestionChoices.svelte`** (D-05/D-07): activated by `isMultipleChoiceQuestion(question)`. Every checkbox carries `data-testid="question-choice"` and `name="questionChoices-{question.id}"` (both fixture-scoping contracts), the `h-32 w-32` control box, and DaisyUI `checkbox checkbox-primary` styling. A `selectedMulti: Array<Id>` state re-syncs from the new `selectedIds` prop on same-type Q→Q reuse (mirroring the radio `selected = selectedId` sync); every toggle dispatches `onChange({ question, value: [...selected] })` with choice Ids only. Unchecked boxes are **never** disabled at `maxSelections` — over-selection stays possible and surfaces as invalidity (D-07). Display mode renders `yourAnswer`/`otherLabel` markers across all voter-/entity-selected choices via `selectedIds`/`otherSelectedIds` arrays. Radio and boolean modes are behavior-identical.
- **Localized helper text** (`data-testid="question-choice-helper"`): `t('questions.multiChoice.selectExact', {count})` when effectiveMin === effectiveMax else `selectRange` — `effectiveMin = minSelections ?? 1`, `effectiveMax = maxSelections ?? choices.length`. Added `multiChoice.{selectRange,selectExact}` to all 7 locales (en/fi/sv/da/et/fr/lb).
- **`OpinionQuestionInput` multi-choice branch + `$bindable valid`**: the `isMultipleChoiceQuestion` branch renders `QuestionChoices` in multi mode before the unsupported fallback. `valid` is computed from the current selection (`count >= effectiveMin && count <= effectiveMax`; zero = invalid-as-unanswered) and pushed to the bound prop; non-multi branches leave it `true`. The component itself never disables anything (D-07).
- **Caller wiring** (D-07 divergence): candidate `canSubmit` ANDs `answerValid` (Save disabled at 1 & 4 selections, enabled at exactly 2 & 3 for min2/max3); voter `QuestionActions.answered` ANDs `opinionInputValid` (action button reads Skip at 1 & 4). Voter `handleAnswer` now only runs the `disabled = true; setTimeout(handleJump)` auto-advance for `isSingleChoiceQuestion || isBooleanQuestion` — number (slider) and multipleChoiceCategorical (checkbox) inputs persist without jumping (covers plan 04's slider too), and an empty-array value routes to `answers.deleteAnswer` (zero = unanswered).
- **svelte-check ZERO maintained**: 2674 files, 0 errors / 0 warnings after regenerating the `TranslationKey` union.

## Task Commits

Each task was committed atomically:

1. **Task 1: QuestionChoices checkbox multi-select mode + helper text (D-05, D-07)** — `c0eeb864c` (feat)
2. **Task 2: OpinionQuestionInput multi-choice branch + bindable validity (D-07)** — `5e355f37a` (feat)
3. **Task 1 follow-up: regenerate TranslationKey type + prettier format** — `4f77d9a5e` (fix)
4. **Task 3: Caller wiring — Save gate, Skip gate, auto-advance suppression (D-07)** — `ea27e8ae5` (feat)

## Files Created/Modified
- `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` — checkbox multi-select mode, helper text, multi display markers, vertical default for multi-choice categorical.
- `apps/frontend/src/lib/components/questions/QuestionChoices.type.ts` — widened `question` union to include `MultipleChoiceCategoricalQuestion`; added `selectedIds`/`otherSelectedIds`; widened `ChoiceEventData.value` to `Id | Array<Id> | null`.
- `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` — `isMultipleChoiceQuestion` dispatch branch + `$bindable valid` computed from the tracked selection.
- `apps/frontend/src/lib/components/questions/OpinionQuestionInput.type.ts` — documented `valid?: boolean` bindable prop.
- `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte` — `bind:valid`, Skip gate, auto-advance type guard, empty-array delete.
- `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte` — `bind:valid`, `canSubmit` validity AND-term.
- `apps/frontend/src/lib/i18n/translations/{en,fi,sv,da,et,fr,lb}/questions.json` — `multiChoice.{selectRange,selectExact}` keys.
- `apps/frontend/src/lib/types/generated/translationKey.ts` — regenerated union with the two new keys.

## Decisions Made
- **Checkbox branch inside the existing each-loop** (not a new component) — keeps the `question-choice` testid + name-attr contract and reuses the grid/variant/display scaffolding (D-05). Radio/boolean paths kept intact.
- **`MultipleChoiceCategoricalQuestion` added to the `vertical` default** so long localized labels wrap in a vertical checkbox list; only affects the new type.
- **Helper text rendered outside the grid `<fieldset>`** so it does not create a stray grid cell; gated on answer mode + authored min/max.
- **Validity tracked locally in `OpinionQuestionInput`** (seeded untracked from `ensureValue`, updated per toggle, reset on question-id change) and pushed to the bound prop via `$effect` — the child always recomputes the correct value; the voter layout's reset-to-true on id-change is a belt-and-braces for same-type Q→Q reuse.
- **Preserved the Wave-2 post-merge restProps-first pattern** in `OpinionQuestionInput.svelte`'s `NumberScaleInput` branch (untouched); the new multi-choice branch spreads `restProps` LAST like the single-choice/boolean `QuestionChoices` branches (QuestionChoices has no typed `value` prop, so no override hazard).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TranslationKey type required regeneration for the new i18n keys**
- **Found during:** Task 3 verification (the milestone `yarn check` svelte-check gate).
- **Issue:** `t()` is typed against the auto-generated `TranslationKey` union (`src/lib/types/generated/translationKey.ts`); the two new `questions.multiChoice.*` keys were not in the union, so `svelte-check` reported 2 errors (`Argument of type '"questions.multiChoice.selectExact"' is not assignable to parameter of type 'TranslationKey'`).
- **Fix:** Ran `yarn generate:translation-key-type` (the project's codegen script) to regenerate the union; also applied `prettier --write` to `QuestionChoices.svelte` (format-only: `class:entitySelected` shorthand, `??` chaining, line-div wrapping).
- **Files modified:** `apps/frontend/src/lib/types/generated/translationKey.ts`, `apps/frontend/src/lib/components/questions/QuestionChoices.svelte`
- **Verification:** `yarn check` → 0 errors / 0 warnings; `yarn build --filter=@openvaa/frontend` exit 0.
- **Committed in:** `4f77d9a5e`

---

**Total deviations:** 1 auto-fixed (1 × Rule 3 - Blocking)
**Impact on plan:** Necessary to satisfy the milestone svelte-check-zero gate. No behavioral change, no scope creep — the regenerated type and format-only reflow are mechanical follow-ups to the planned i18n additions.

## Issues Encountered
None beyond the TranslationKey regeneration above. The three-task structure executed as written.

## Backstop / Manual Verification

The plan's `<verification>` calls for a dev-server matrix (min2/max3 question at 0/1/2/3/4 selections × candidate Save state / voter action-button label) and a long-label wrap backstop in dark + light. This is **deferred to plan 08**, which authors the multi-choice opinion seed rows (`custom_data: { minSelections, maxSelections }`) that first surface a matchable multi-choice opinion question in the running app — there is no such question in the current seed, so the running-app matrix cannot be exercised here. Static verification is complete:

- **Save/Skip edge truths** are structurally guaranteed by the validity formula (`count >= effectiveMin && count <= effectiveMax`, effectiveMin = `minSelections ?? 1`, effectiveMax = `maxSelections ?? choices.length`) ANDed into candidate `canSubmit` and voter `QuestionActions.answered`: 0 → invalid (unanswered/deleted), 1 → invalid (Skip / Save disabled), 2 & 3 → valid, 4 → invalid.
- **Zero = unanswered** routes to `answers.deleteAnswer` in the voter layout and is caught by `isEmptyValue([]) === true` in candidate `canSubmit`.
- **Long-label wrap** rides the `vertical` layout default now extended to multi-choice categorical (same scaffolding as the shipped SingleChoiceCategorical vertical list).

**Flagged for the verifier:** the running-app 0–4 selection Save/Skip matrix and dark/light long-label wrap — exercised once plan 08 seeds a multi-choice opinion question; Phase-130 adds the `answerMultiChoice` fixture + min/max boundary tests.

## Threat Model Verification
- **T-129-08 (Tampering, multi-choice persist path, medium — mitigate):** mitigated as planned. Client side, values are routed through `question.ensureValue` (→ `MultipleChoiceQuestion._ensureValue`: `ensureArray` + `ensureUnique`) before rendering and the toggle handler emits only choice Ids that exist in `choices`. Backend `validate_answer_value` 'multipleChoiceCategorical' branch validates every item against valid choice ids. No raw label text reaches the value (labels play no role in equality/persistence).
- **T-129-09 (EoP, client-side min/max gate bypass, low — accept):** accepted as planned. The min/max gate is UX-only and never disables inputs; a crafted out-of-range array persists but normalizes safely in matching (plan-01 binary subdimensions) and violates no RLS/authz invariant.
- **XSS via choice labels (canon breadcrumb):** covered by Svelte auto-escaping — labels and helper text are interpolated strings, no `{@html}`.

## User Setup Required
None — no external service configuration. A matchable multi-choice opinion question is not yet in the seed data (plan 08); until then the branch is exercised via build/unit only.

## Next Phase Readiness
- Plan 07 registers `question-choice-helper` in `tests/tests/utils/testIds.ts`.
- Plan 08 authors multi-choice opinion seed rows (`custom_data: { minSelections, maxSelections }`) that first surface the checkbox input in the running app; the Phase-130 `answerMultiChoice(question, ids)` fixture + min/max boundary tests target `question-choice` + `question-choice-helper`.

## Self-Check: PASSED
- FOUND: apps/frontend/src/lib/components/questions/QuestionChoices.svelte (checkbox mode, helper text)
- FOUND: apps/frontend/src/lib/components/questions/QuestionChoices.type.ts (selectedIds/otherSelectedIds, widened value)
- FOUND: apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte (isMultipleChoiceQuestion branch, $bindable valid)
- FOUND: apps/frontend/src/lib/components/questions/OpinionQuestionInput.type.ts (valid prop)
- FOUND: apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte (Skip gate + auto-advance guard)
- FOUND: apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte (Save gate)
- FOUND: apps/frontend/src/lib/types/generated/translationKey.ts (multiChoice keys)
- FOUND commits: c0eeb864c, 5e355f37a, 4f77d9a5e, ea27e8ae5
- No unexpected file deletions in the plan commits
- yarn check (svelte-check) 0 errors / 0 warnings; build + 742 unit tests green; eslint clean
