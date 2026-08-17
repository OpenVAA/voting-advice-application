---
phase: 129-new-feature-build-question-inputs-alliance-render-nomination
reviewed: 2026-07-18T00:00:00Z
depth: standard
files_reviewed: 39
files_reviewed_list:
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
  - apps/frontend/src/lib/components/input/MultipleTextInput.svelte
  - apps/frontend/src/lib/components/input/MultipleTextInput.type.ts
  - apps/frontend/src/lib/components/input/QuestionInput.svelte
  - apps/frontend/src/lib/components/input/index.ts
  - apps/frontend/src/lib/components/questions/NumberScaleInput.svelte
  - apps/frontend/src/lib/components/questions/NumberScaleInput.type.ts
  - apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte
  - apps/frontend/src/lib/components/questions/OpinionQuestionInput.type.ts
  - apps/frontend/src/lib/components/questions/QuestionChoices.svelte
  - apps/frontend/src/lib/components/questions/QuestionChoices.type.ts
  - apps/frontend/src/lib/components/questions/index.ts
  - apps/frontend/src/lib/types/generated/translationKey.ts
  - apps/frontend/src/lib/utils/multiChoiceValidity.test.ts
  - apps/frontend/src/lib/utils/multiChoiceValidity.ts
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
  critical: 1
  warning: 2
  info: 3
  total: 6
status: issues_found
---

# Phase 129: Code Review Report (re-review after gap-closure 129-09)

**Reviewed:** 2026-07-18
**Depth:** standard
**Files Reviewed:** 39 (core input / data / provider / layout source read in full; the dev-seed, integration-test, and Playwright spec files reviewed for the changed regions)
**Status:** issues_found

## Summary

This is a re-review of Phase 129 (three new opinion inputs — native-range `NumberScaleInput`, checkbox multi-select `QuestionChoices`, row-list `MultipleTextInput` — plus the `MultipleChoiceCategoricalQuestion` matching normalization, the `custom_data.{min,max}` → `NumberQuestionData` bridge, and the dev-seed + E2E re-baseline) after the gap-closure plan 129-09 landed (commits `47374aec1`, `321c4987b`, `f92896248`).

**Prior WR-01 is RESOLVED.** The unconditional voter multi-choice persistence is now correctly gated:
- `handleAnswer` deletes on empty selection (D-07) AND returns without persisting when `!opinionInputValid` for a non-empty out-of-range selection (`questions/+layout.svelte:184-198`).
- `opinionInputValid` is fresh at that read site because `OpinionQuestionInput` assigns the bound `valid` **synchronously** in the multi-choice `onChange` wrapper before bubbling (`OpinionQuestionInput.svelte:202-214`). Traced the `$bindable` write path: the child assignment invokes the parent binding setter, which writes the parent `$state` synchronously, so `handleAnswer` (called later in the same stack) reads the updated value — the mechanism the comment claims is correct.
- Both the `answered` prop and the last-question "Results" `nextLabel` now AND-in `opinionInputValid` (`+layout.svelte:318, 320-324`), closing the CTA-advances-on-invalid hole.
- The wipe-proof seed (question-keyed `untrack` in both `OpinionQuestionInput` `currentMultiSelection` and `QuestionChoices` `selectedMulti`) plus the `deleteEpoch`-keyed `{#key}` remount are coherent: an auto-delete of an invalid in-progress selection deliberately does NOT bump `deleteEpoch` (boxes stay checked so the user sees their over-selection), while an explicit delete bumps it to force a visual clear. The Svelte 5 reactivity reasoning holds up.

The `multiChoiceValidity` helper, the `_normalizeValue` binary-subdimension mapping (`String()`-normalized, empty/missing → all-`MISSING_VALUE`), and the number `min/max` JSONB bridge (guarded on `typeof === 'number'`, `type === 'number'`-only, `0` handled) are all sound and well-tested. No security issues: the data provider uses the PostgREST builder / RPC (no string-concatenated SQL); JSONB casts are runtime-guarded.

Remaining findings: one BLOCKER is a **pre-existing** keyboard double-dispatch defect that lives in the file this phase reworked (so it is in scope), one WARNING is a minor asymmetry introduced by 129-09, and the rest are carried-forward low-severity items.

## Structural Findings (fallow)

No `<structural_findings>` block was provided with this review; there is no structural pre-pass to reconcile.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Duplicate `onkeyup` on the radio `<label>` and `<input>` double-dispatches keyboard answers (can skip a question)

**File:** `apps/frontend/src/lib/components/questions/QuestionChoices.svelte:378, 390`

**Issue:** In the single-choice / boolean radio branch the wrapping `<label>` carries `onkeyup={(e) => handleKeyUp(e, id)}` (line 378) and the child `<input type="radio">` carries the *same* handler (line 390). A `keyup` on the input bubbles to the label, so `handleKeyUp` fires **twice** for one physical Space/Enter press. `handleKeyUp` calls `triggerCallback(value)`, which — because `selectedId` (the prop) has not yet re-derived within the synchronous event stack — takes the same `onChange` branch both times. In the voter flow `onChange` is `handleAnswer`, which for single-choice / boolean does `disabled = true; setTimeout(handleJump, DELAY.md)` (`+layout.svelte:204-207`). Two dispatches schedule **two** `handleJump` calls back-to-back; because navigation is async, the second `handleJump` can read the already-advanced `questionBlock` and jump again — silently skipping a question (and leaving it unanswered, which then perturbs matching). This is a documented keyboard interaction ("The event is also dispatched when the user presses the Space or Enter key", component header point 4), so it is a real path, not a corner case.

This is **pre-existing** (the input-level `onkeyup` dates to the v1.3 Svelte-5 migration, commit `101d9e3d`), but `QuestionChoices.svelte` was reworked by this phase (`c0eeb864c`) and the radio branch was re-indented into the new non-multi `{:else}` block, so it is in scope. E2E does not catch it: the fixtures answer radios via `.click()` (pointer, `detail !== 0`), never Space/Enter — so the project's keyboard-operability / WCAG AA requirement is unverified here. The new checkbox branch is unaffected (single `onchange` on the input).

**Fix:** Remove the redundant handler from the `<input>` and keep the label-level one (which widens the key target to the whole label):
```svelte
<input
  type="radio"
  ...
  bind:this={inputs[id]}
  bind:group={selected} />   <!-- drop the duplicate onkeyup; the <label> already handles keyup -->
```
Add a keyboard step to the voter/candidate journey fixtures (answer at least one radio via `press('Enter')`) so the regression is guarded by the suite.

## Warnings

### WR-01: Empty-selection branch deletes unconditionally, firing a spurious `answer_delete` when nothing was persisted

**File:** `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:184-187`

**Issue:** The zero-selection branch calls `answers.deleteAnswer(question.id)` unconditionally, whereas the very next branch (the non-empty invalid case, lines 195-197) guards the delete with `if (answers.answers[question.id] != null)` precisely to avoid "a spurious `answer_delete` tracking event / store churn" (its own comment). The empty branch is asymmetric: on a never-answered multi-choice question with `minSelections ≥ 2`, a voter who ticks one box (invalid → guarded no-op) and then unticks it (empty → unconditional delete) fires an `answer_delete` for an answer that never existed. Introduced by 129-09; low functional impact (analytics noise + store churn, no data loss), but it defeats the guard added two lines below.

**Fix:** Mirror the guard in the empty branch:
```ts
if (Array.isArray(value) && value.length === 0) {
  if (answers.answers[question.id] != null) answers.deleteAnswer(question.id);
  return;
}
```

### WR-02: `MultipleTextInput` keyed by array index — reorder moves values under the cursor, not the focused row

**File:** `apps/frontend/src/lib/components/input/MultipleTextInput.svelte:159, 161-169`

**Issue:** The row list is `{#each rows as row, index (index)}` (keyed by position) with a one-way `value={row}` binding. Because the key is the index, `moveUp`/`moveDown` reassign the `value` attribute of DOM inputs that stay physically in place, so a keyboard user driving the reorder buttons sees the text swap out from under the cursor rather than the focused row travelling with them; an in-progress IME/composition on a focused row can also be visually clobbered. No data loss (the model reorders correctly and `emit()` preserves order), but index keying is the documented Svelte anti-pattern for reorderable lists.

**Fix:** Key by a stable per-row identity (a parallel `Array<symbol>` mutated alongside `rows`) so Svelte moves the DOM node with its value, or explicitly restore focus to the moved row after `moveUp`/`moveDown`.

## Info

### IN-01: Stale `TERM_EVERY` comment references "24 questions"

**File:** `packages/dev-seed/src/templates/defaults/questions-override.ts:120-124`

**Issue:** The module doc (lines 15-16) now correctly says "indices 0, 5, 10, 15, 20, 25", but the `TERM_EVERY` block comment still says "1/5 of the 24 questions → indices 0, 5, 10, 15, 20" — stale since the plan is 26 questions (index 25, the `multipleChoiceCategorical`, also receives a term). Code is correct; only the comment is misleading.

**Fix:** Update the `TERM_EVERY` comment to "26 questions → indices 0, 5, 10, 15, 20, 25".

### IN-02: E2E checkbox branches hardcode exactly 2 clicks, coupled to the seed

**File:** `tests/tests/fixtures/voter/voter-journey.fixture.ts:400-415`; `tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts:118-127`

**Issue:** Both fixtures answer a multi-choice question by clicking exactly the first 2 choices, relying on the seeded `minSelections=2 / maxSelections=3`. The coupling is acknowledged in a comment, but any future seed authoring a multi-choice opinion question with `minSelections > 2` (or `maxSelections < 2`) would make the fixtures produce an invalid selection — Next never advances (the 129-09 gate now blocks it), stalling the walk. Given the E2E hard rule, this is a latent full-suite flake source.

**Fix:** Derive the click count from the authored `minSelections` (e.g. read the `question-choice-helper` text, or select `min` choices) instead of the literal `2`.

### IN-03: `NumberScaleInput` display thumb reflects only one of two answers

**File:** `apps/frontend/src/lib/components/questions/NumberScaleInput.svelte:154`

**Issue:** In `display` mode the single disabled `<input type="range">` sets `value={value ?? otherValue ?? midpoint}`, so the physical thumb shows only the voter's value (falling back to the entity's, then midpoint). Both answers are conveyed by the proportional `.marker` labels above the track, so no information is lost, but the thumb can mismatch the entity marker, which may read as inconsistent. Purely presentational.

**Fix:** Optional — neutralize/hide the thumb in display mode (render only the markers) so it does not imply one answer over the other.

---

_Reviewed: 2026-07-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
