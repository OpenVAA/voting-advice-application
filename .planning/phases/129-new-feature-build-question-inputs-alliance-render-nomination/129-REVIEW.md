---
phase: 129-new-feature-build-question-inputs-alliance-render-nomination
reviewed: 2026-07-18T00:00:00Z
depth: standard
files_reviewed: 33
files_reviewed_list:
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
  - apps/frontend/src/lib/components/input/index.ts
  - apps/frontend/src/lib/components/input/MultipleTextInput.svelte
  - apps/frontend/src/lib/components/input/MultipleTextInput.type.ts
  - apps/frontend/src/lib/components/input/QuestionInput.svelte
  - apps/frontend/src/lib/components/questions/index.ts
  - apps/frontend/src/lib/components/questions/NumberScaleInput.svelte
  - apps/frontend/src/lib/components/questions/NumberScaleInput.type.ts
  - apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte
  - apps/frontend/src/lib/components/questions/OpinionQuestionInput.type.ts
  - apps/frontend/src/lib/components/questions/QuestionChoices.svelte
  - apps/frontend/src/lib/components/questions/QuestionChoices.type.ts
  - apps/frontend/src/lib/types/generated/translationKey.ts
  - apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte
  - apps/frontend/src/routes/(voters)/nominations/+layout.svelte
  - apps/frontend/src/routes/(voters)/nominations/+layout.ts
  - apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte
  - packages/app-shared/src/data/customData.type.ts
  - packages/data/src/index.ts
  - packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts
  - packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.ts
  - packages/data/src/utils/typeGuards.ts
  - packages/dev-seed/src/templates/_helpers/buildMinimal.test.ts
  - packages/dev-seed/src/templates/_helpers/buildMinimal.ts
  - packages/dev-seed/src/templates/default.ts
  - packages/dev-seed/src/templates/defaults/questions-override.ts
  - packages/dev-seed/src/templates/e2e/base.ts
  - packages/dev-seed/tests/integration/default-template.integration.test.ts
  - packages/dev-seed/tests/templates/base-app-settings.test.ts
  - packages/dev-seed/tests/templates/default.test.ts
  - tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts
  - tests/tests/fixtures/voter/voter-journey.fixture.ts
  - tests/tests/specs/candidate/candidate-journey.spec.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/utils/candidateJourneyConstants.ts
  - tests/tests/utils/testIds.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 129: Code Review Report

**Reviewed:** 2026-07-18
**Depth:** standard
**Files Reviewed:** 33 (of 37 listed — 3 spec/test files skimmed for the changed sections; the number/multi-choice/multipleText input source is reviewed in full)
**Status:** issues_found

## Summary

Phase 129 adds three new opinion-question inputs (native range `NumberScaleInput`, checkbox multi-select in `QuestionChoices`, row-list `MultipleTextInput`), the `MultipleChoiceCategoricalQuestion` matching normalization, a `custom_data.{min,max}` → `NumberQuestionData` bridge in the Supabase data provider, and the corresponding dev-seed + E2E re-baseline.

The core new logic is generally sound: the `MultipleChoiceCategoricalQuestion._normalizeValue` binary-subdimension mapping is correct and well-tested; the Supabase min/max bridge correctly guards against non-numeric JSONB and only lifts for `type === 'number'`; the `NumberScaleInput` range/percent math clamps correctly. No security vulnerabilities were found (the data provider uses the PostgREST query builder — no string-concatenated SQL — and JSONB casts are runtime-guarded).

The main concerns are behavioral: the **voter** answer path persists multi-choice selections that violate the authored `minSelections`/`maxSelections` constraints (they enter matching), and a **pre-existing** duplicate `onkeyup` on the radio label+input (carried into the reworked branch) double-dispatches keyboard events. Neither is a crash or security issue; both are classified WARNING.

## Structural Findings (fallow)

No `<structural_findings>` block was provided with this review; no structural pre-pass to reconcile.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Voter persists constraint-violating multi-choice answers into matching

**File:** `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:174-191, 295-299`

**Issue:** The new `handleAnswer` multi-choice branch only special-cases the *empty* array (zero selections → `deleteAnswer`, D-07). Any *non-empty* selection is persisted unconditionally via `answers.setAnswer(question.id, value)` — including an under-min (e.g. 1 selection when `minSelections = 2`) or over-max (4 when `maxSelections = 3`) selection. `opinionInputValid` (bound from `OpinionQuestionInput`) is computed but is only consumed to change the action-button label; it does **not** gate persistence. As a result a voter can store an "invalid" multi-choice answer that then feeds the matching algorithm (`_normalizeValue` happily normalizes any subset).

This is asymmetric with the candidate page, which correctly gates via `canSubmit = … && answerValid` (`candidate/(protected)/questions/[questionId]/+page.svelte:132-134`), so the candidate cannot save an invalid selection but the voter silently persists one.

Compounding it, the last-question CTA label ignores validity:
```svelte
nextLabel={questionBlock!.index === questions.length - 1 && answers.answers[question!.id]?.value != null
  ? t('results.title.results')
  : undefined}
```
`?.value != null` is true for an over-max selection, so the final question offers "Results" and advances with the invalid answer stored, even though `answered` (which *does* AND-in `opinionInputValid`) is false.

**Fix:** Gate persistence on validity, or clear the answer when the selection is out of range. e.g. thread the validity into `handleAnswer`:
```ts
function handleAnswer({ question, value }): void {
  if (Array.isArray(value) && value.length === 0) {
    answers.deleteAnswer(question.id);
    return;
  }
  // Only persist a multi-choice value that satisfies min/max; otherwise treat
  // as an in-progress (unanswered) selection so it never reaches matching.
  if (Array.isArray(value) && !opinionInputValid) {
    answers.deleteAnswer(question.id);
    return;
  }
  answers.setAnswer(question.id, value);
  …
}
```
and include `&& opinionInputValid` in the `nextLabel` guard so the final-question CTA does not advance on an invalid selection.

### WR-02: Duplicate `onkeyup` on radio `<label>` and `<input>` double-dispatches keyboard events

**File:** `apps/frontend/src/lib/components/questions/QuestionChoices.svelte:370, 382`

**Issue:** In the single-choice/boolean radio branch the wrapping `<label>` carries `onkeyup={(e) => handleKeyUp(e, id)}` and the child `<input type="radio">` also carries `onkeyup={(e) => handleKeyUp(e, id)}`. A `keyup` on the input bubbles to the label, so `handleKeyUp` fires **twice** for a single Space/Enter press. `handleKeyUp` calls `triggerCallback`, so `onChange`/`onReselect` is dispatched twice. On the voter question flow, `handleAnswer` schedules `setTimeout(handleJump, DELAY.md)` for single-choice/boolean questions, so a double dispatch schedules **two** auto-advances — a keyboard user pressing Space/Enter can skip a question. E2E does not catch this because the fixtures answer radios via `.click()` (pointer, `detail !== 0`), never Space/Enter.

Note: this duplication is **pre-existing** (present in `c0eeb864c^`), but it lives in a file reworked by this phase and the branch was re-indented into the new `{:else}` (non-multi) block, so it is in scope. The new checkbox branch is unaffected (it uses only a single `onchange` on the input).

**Fix:** Remove the redundant handler from the `<input>` (keep the label-level one that widens the target), or vice-versa:
```svelte
<input
  type="radio"
  …
  bind:this={inputs[id]}
  bind:group={selected} />   <!-- drop onkeyup here; the <label> already handles it -->
```

### WR-03: `MultipleTextInput` keyed by array index makes reorder move values, not focus

**File:** `apps/frontend/src/lib/components/input/MultipleTextInput.svelte:159, 161-169`

**Issue:** The row list is `{#each rows as row, index (index)}` (keyed by position) with a one-way `value={row}` binding. Because the key is the index, `moveUp`/`moveDown` reassign the value *attributes* of DOM inputs that stay physically in place — so the focused input does not travel with the row the user moved; instead the text under the cursor swaps out. It also means an in-progress IME/composition on a focused row can be visually clobbered by the reorder. There is no data loss (the model reorders correctly and `emit()` preserves order), but the interaction is surprising for a keyboard user driving the reorder buttons, and index keying is the documented Svelte anti-pattern for reorderable lists.

**Fix:** Key by a stable per-row identity rather than the index, so Svelte moves the DOM node with the value:
```svelte
{#each rows as row, index (rowKeys[index])}   <!-- rowKeys: a parallel Array<symbol|string> mutated alongside rows -->
```
or, if identity tracking is too invasive, explicitly restore focus to the moved row after `moveUp`/`moveDown`.

## Info

### IN-01: Stale count/index comments in `questions-override.ts`

**File:** `packages/dev-seed/src/templates/defaults/questions-override.ts:15, 121-124`

**Issue:** The module doc and `TERM_EVERY` comment describe "1/5 of the questions (indices 0, 5, 10, 15, 20, 25)" in one place but "1/5 of the 24 questions → indices 0, 5, 10, 15, 20" in another. The plan is now 26 questions (18 ordinal + 5 categorical + 1 boolean + 1 number + 1 multi-choice), so index 25 (the `multipleChoiceCategorical`) also receives a term. The code is correct; the "24" comments are stale and misleading.

**Fix:** Update the `TERM_EVERY` comment to reference 26 questions and indices `0, 5, 10, 15, 20, 25`.

### IN-02: E2E checkbox answer branch hardcodes exactly 2 clicks, coupled to the seed

**File:** `tests/tests/fixtures/voter/voter-journey.fixture.ts:400-415`; `tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts:119-127`

**Issue:** Both fixtures answer a multi-choice question by clicking exactly the first 2 choices, relying on the seeded `minSelections=2 / maxSelections=3`. The coupling is acknowledged in a comment, but if any future seed authors a multi-choice opinion question with `minSelections > 2` (or `maxSelections < 2`), the fixtures would produce an invalid selection and the walk would stall (Next never advances) — a latent full-suite flake source given the E2E hard-rule.

**Fix:** Derive the click count from the question's authored `minSelections` (e.g. read the helper text `question-choice-helper`, or select `min` choices), rather than the literal `2`.

### IN-03: `NumberScaleInput` display thumb shows only one of two values

**File:** `apps/frontend/src/lib/components/questions/NumberScaleInput.svelte:154`

**Issue:** In `display` mode the single disabled `<input type="range">` sets `value={value ?? otherValue ?? midpoint}`, so the physical thumb reflects only the voter's value (falling back to the entity's, then midpoint). The two answers are conveyed by the proportional `.marker` labels above the track, so no information is lost, but the thumb position can mismatch the entity marker, which may read as inconsistent. Low priority — purely presentational.

**Fix:** Optional — consider hiding/neutralizing the thumb in display mode (e.g. render only the markers) so the single thumb does not imply one answer over the other.

---

_Reviewed: 2026-07-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
