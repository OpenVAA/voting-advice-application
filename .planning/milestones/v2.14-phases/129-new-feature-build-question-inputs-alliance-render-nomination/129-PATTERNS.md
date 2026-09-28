# Phase 129: New-Feature Build — Question Inputs + Alliance Render + Nominations Fetch — Pattern Map

**Mapped:** 2026-07-17
**Files analyzed:** 13 (create/modify)
**Analogs found:** 12 / 13 (1 net-new UI — reorder affordance — has no in-repo analog)

> This phase is an in-repo feature build with **zero new external deps**. Every new file EXTENDS an existing dispatch site or data class. Analogs below are the exact reference impls to copy from, verified by source read this session.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` | component (dispatch) | request-response (answer persist) | self (existing `isSingleChoiceQuestion`/`isBooleanQuestion` branches) | exact (extend in place) |
| `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` | component (input) | transform (value↔choice) | self (radio mode → parallel checkbox mode) | exact (extend in place) |
| `apps/frontend/src/lib/components/input/QuestionInput.svelte` | component (dispatch) | request-response | self (`Input`-wrapper dispatch; currently throws for MultipleText) | exact (extend in place) |
| (new) MultipleText row-list input | component (input) | transform (`Array<string>`) | `Input.svelte` `select-multiple` (add/remove); reorder = **net-new** | role-match (reorder no analog) |
| (new) number-scale slider input | component (input) | transform (JS number) | `Input.svelte:319-322` `number` `valueAsNumber` coerce | role-match (range is new type) |
| `packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.ts` | model (matching methods) | transform (value→subdimensions) | `singleChoiceCategoricalQuestion.ts:31-62` | exact |
| `apps/frontend/src/routes/(voters)/nominations/+layout.ts` | route (loader) | request-response (fetch) | `(voters)/(located)/+layout.ts:98-112` | exact |
| `packages/app-shared/src/data/customData.type.ts` | config (types) | — | self (`Question` block: `longText`/`maxlength`/`filterable`) | exact (add keys) |
| `packages/dev-seed/src/templates/e2e/base.ts` | config (seed) | batch | self (existing base-1..5 opinion Qs + `sections` array) | exact |
| `packages/dev-seed/src/templates/default.ts` | config (seed) | batch | self + `e2e/base` question rows | exact |
| `packages/dev-seed/src/templates/_helpers/buildMinimal.ts` | utility (seed helper) | transform | self (`defaultAnswerForQuestion:156-180` type-branch ladder) | exact (add number branch) |
| `tests/tests/specs/voter/voter-journey.spec.ts` | test | — | self (existing per-question walk) | exact (re-baseline) |
| `tests/tests/utils/testIds.ts` | test (locator catalogue) | — | self (existing testId registry) | exact (add locators) |

---

## Pattern Assignments

### `OpinionQuestionInput.svelte` — number + multi-choice branches (C-2, C-3 / UNBLK-05, UNBLK-02)

**Analog:** self — the existing dispatch `{#if}` chain is the pattern to extend.

**Dispatch chain to extend** (`OpinionQuestionInput.svelte:88-114`): add `{:else if isNumberQuestion(question)}` (slider) and `{:else if isMultipleChoiceQuestion(question)}` (extended `QuestionChoices` checkbox mode) branches BEFORE the `error.unsupportedQuestion` fallback at line 113. Reuse the `mode`/`answer`/`otherAnswer`/`otherLabel`/`onChange`/`...restProps` plumbing verbatim.

**Existing single-choice branch** (the shape to mirror — value ensured through the data class, onChange re-wrapped):
```svelte
{#if isSingleChoiceQuestion(question)}
  {@const selectedId = question.ensureValue(answer?.value)}
  {@const otherSelected = question.ensureValue(otherAnswer?.value)}
  <QuestionChoices
    {question} {mode} {selectedId} {otherSelected} {otherLabel}
    onChange={onChange ? (d) => onChange({ value: d.value, question: d.question }) : undefined}
    {...restProps} />
```

**Imports** (line 33): add `isNumberQuestion`, `isMultipleChoiceQuestion` to the `@openvaa/data` import. Context read pattern (line 62): `const { t } = getComponentContext();` — `t` is a STABLE destructure (CLAUDE.md).

**Number persist:** coerce `valueAsNumber` → JS number (see `Input.svelte:319-322`), route through `question.ensureValue` before bubbling `onChange({ value, question })` (V5 input-validation; backend `validate_answer_value` requires JSON number).

**D-04 display mode:** wrapper is `<div data-testid="opinion-question-input">` (line 88); slider display branch renders read-only with voter + entity markers mirroring `QuestionChoices` display-mode (see below).

**D-07 candidate/voter divergence:** do NOT hard-disable inside this shared component — surface selection-validity to the caller via prop/callback (candidate Save gates on it; voter action button stays Skip). See Pitfall 4 in RESEARCH.

---

### `QuestionChoices.svelte` — checkbox multi-select mode (C-3 / UNBLK-02, D-05, D-07)

**Analog:** self — radio mode is the parallel to build checkbox mode against.

**Locator contract (PRESERVE):** each input keeps `data-testid="question-choice"` (line 270); container keeps `data-testid="question-choices"` (line 218). Phase-130 fixtures depend on both — never rename/drop.

**Radio input to parallel for checkbox** (`QuestionChoices.svelte:263-273`):
```svelte
<input
  type="radio"
  class="radio-primary radio border-lg bg-base-100 relative h-32 w-32 outline outline-4 outline-[var(--radio-bg)] disabled:opacity-100"
  class:entitySelected={otherSelected == id}
  name="questionChoices-{question.id}"
  disabled={mode !== 'answer'}
  value={id}
  data-testid="question-choice"
  bind:this={inputs[id]}
  bind:group={selected}
  onkeyup={(e) => handleKeyUp(e, id)} />
```
Checkbox mode: `type="checkbox"`, `class="checkbox checkbox-primary … h-32 w-32 …"` (reuse the exact `h-32 w-32` control box per UI-SPEC), parallel `selected: Array<Id>` state (not `bind:group` scalar) + own change-dispatch.

**Display-mode marker pattern to reuse for multi-select** (`:243-253`) — `yourAnswer` (`text-primary`) for voter-selected, `otherLabel` for entity-selected; the `entity-selected-answer` sr-only marker (`:284-286`) is preserved.

**Change dispatch shape** (`:200-210`): builds `{ question, value }` details, calls `onReselect` when re-picking the current value, else `onChange`.

**D-07 helper text (NEW locator `question-choice-helper`):** render localized `questions.multiChoice.selectRange` / `selectExact` as a `small-label` below the group when `customData.minSelections`/`maxSelections` set. Zero selections = unanswered.

---

### `QuestionInput.svelte` + new MultipleText input (C-1 / UNBLK-01, D-01, D-02)

**Analog:** self (dispatch) + `Input.svelte` `select-multiple` (add/remove list).

**Current throw to remove** (`QuestionInput.svelte:54-59`):
```ts
$effect(() => {
  if (question.type === QUESTION_TYPE.MultipleText)
    throw new Error(`MultipleTextQuestions are not yet supported by QuestionInput. Question id: ${question.id}.`);
  …
});
```
`INPUT_TYPES` map (`:40-49`) `Exclude`s `MultipleText` — D-01 adds a `multiple-text` branch (either a new `Input` type or a bespoke branch before `<Input>`; UI-SPEC leaves the exact home to the planner).

**customData read pattern** (`:61`): `const customData = $derived(getCustomData(question));` — read `minItems`/`maxItems` (D-02) from here. Value binding via the data class `_ensureValue` (= `ensureArray(ensureString)` → `Array<string>`); empty rows dropped on save.

**Reorder affordance = NET-NEW UI** — no drag/up-down reorder exists in the codebase (`Input.svelte` `select-multiple` is order-BY-SELECTION only). UI-SPEC C-1 pins: up/down **icon buttons** (`Button variant="icon"`, icons `previous`/`next` or `sort`), up disabled on first row, down on last, reorder allowed even at `min` rows. NEW locators: `multiple-text-row`, `multiple-text-add`, `multiple-text-remove`, `multiple-text-move-up`, `multiple-text-move-down`.

---

### `multipleChoiceCategoricalQuestion.ts` — fill matching TODO (UNBLK-02, D-06)

**Analog:** `singleChoiceCategoricalQuestion.ts:31-62` (exact reference — change single-index-Max to selected-set-Max).

**The TODO to fill** (`multipleChoiceCategoricalQuestion.ts:34`): `// TODO: Implement for matching: _normalizeValue, get isMatchable, get normalizedDimensions`

**Reference single-choice impl** (`singleChoiceCategoricalQuestion.ts:31-62`):
```ts
get isMatchable(): boolean { return true; }

get normalizedDimensions(): number {
  return this.choices.length === 2 ? 1 : this.choices.length;
}

protected _normalizeValue(value): CoordinateOrMissing | Array<CoordinateOrMissing> {
  const choices = this.choices;
  if (isMissingValue(value)) return choices.length === 2 ? MISSING_VALUE : choices.map(() => MISSING_VALUE);
  const index = this.getChoiceIndex(value)!;
  if (choices.length === 2) return index === 0 ? COORDINATE.Min : COORDINATE.Max;
  return Array.from({ length: choices.length }, (_, i) => (i === index ? COORDINATE.Max : COORDINATE.Min));
}
```

**Multi-choice adaptation** (value is `Array<Id>` via `MultipleChoiceQuestion._ensureValue`): `normalizedDimensions = this.choices.length` (no 2-choice single-dim shortcut — each choice is an independent binary subdimension); `_normalizeValue` maps each selected choice → `COORDINATE.Max`, unselected → `COORDINATE.Min`; whole-value-missing → `choices.map(() => MISSING_VALUE)`. Imports from `../../../internal`: `COORDINATE, isMissingValue, MISSING_VALUE, OBJECT_TYPE`. **No `@openvaa/matching` engine change** — it already consumes `normalizedDimensions` subdimensions.

**Unit test:** add cases to `multipleChoiceCategoricalQuestion.test.ts` (`cd packages/data && yarn test:unit`).

---

### `nominations/+layout.ts` — add question fetch (C-5 / UNBLK-04, D-11)

**Analog:** `(voters)/(located)/+layout.ts:98-112`.

**Current return** (`nominations/+layout.ts:32-38`): only `nominationData`.

**Parity reference** (`(located)/+layout.ts:98-112`) — the `getQuestionData` call to add (locale-only; `electionId` optional):
```ts
return {
  questionData: dataProvider.getQuestionData({ electionId, locale: lang }).catch((e) => e),
  nominationData: dataProvider.getNominationData({ electionId, constituencyId, locale: lang }).catch((e) => e)
};
```
**Fix:** add to the nominations loader return:
```ts
questionData: dataProvider.getQuestionData({ locale: lang }).catch((e) => e)
```
Provider already initialised (`dataProvider.init({ fetch })`, line 31). Confirm the `/nominations` `+page.svelte` reads `questionData` the same way the located route does.

---

### `customData.type.ts` — new count-constraint keys (D-02, D-07)

**Analog:** self — the `Question` block (`:22-79`) with `longText`/`maxlength`/`filterable`/`terms` is the established extension point.

**Existing key shape to mirror** (`:52-58`):
```ts
/** For `QuestionInput`. If provided, will set the `maxlength` of text inputs. */
maxlength?: number;
```
Add (researcher recommendation; planner confirms names): `minItems?`/`maxItems?` (MultipleText, D-02) and `minSelections?`/`maxSelections?` (multi-choice, D-07). JSONB blob — **no DB migration**. Read via `getCustomData(question)` in the input components (already imported).

---

### Seed authoring — `e2e/base.ts`, `default.ts`, `buildMinimal.ts` (D-12, D-15, D-16)

**`e2e/base.ts` alliance one-line fix (UNBLK-06 — THE residual gap):**
```ts
// packages/dev-seed/src/templates/e2e/base.ts:214
sections: ['candidate', 'organization']            // BEFORE
sections: ['candidate', 'organization', 'alliance'] // AFTER — 'alliance' LAST (Org-first cascade invariant)
```
`default.ts:259` already has all three — no alliance-section change needed there.

**Main-category question additions (D-12):** MAIN opinion category `test-e2e-base-qg-opin-base` (`base.ts:546`) holds base-1..5 at `sort_order` 100-104. Add one `number` opinion Q (`min`/`max` set → matchable) + one `multipleChoiceCategorical` opinion Q at `sort_order` 105-106. Mirror the existing base-4 (`singleChoiceCategorical`) row shape. Extend the `POLAR_MAX`/`NEAR_MAX`/`POLAR_MIN`/`GENERIC` opinion-answer templates (`base.ts:280-340`) + CA-AA-Special answer map with number values / choice-id arrays. `default.ts` D-15 parity: add one number + one multi-choice opinion Q.

**`buildMinimal.ts` number branch (D-16):**

**Analog:** the `defaultAnswerForQuestion` type-branch ladder (`buildMinimal.ts:156-180`):
```ts
if (type === 'singleChoiceOrdinal') {
  const choices = question.choices as Array<{ id: string }> | undefined;
  if (Array.isArray(choices) && choices.length > 0) {
    return { value: choices[Math.floor((choices.length - 1) / 2)].id };
  }
  return { value: '3' };
}
```
The `number` type falls through to the categorical/else fallback `{ value: '' }` (line 179) — invalid (RPC needs JSON number). Add a `number` branch returning the min/max midpoint (read `question.custom_data.min/max` or `question.min/max`), else `0`. Unit case → `buildMinimal.test.ts`.

---

### `voter-journey.spec.ts` re-baseline + `testIds.ts` (D-13, D-14)

**Analog:** self — existing per-question walk + testId registry.

**At-risk assertions (re-baseline empirically per RESEARCH table):** `:85` `answerCount: /Answer 4/i` (likely shifts); `:499` `categoryCheckboxes.toHaveCount(5)` (likely unchanged — adding Qs to existing category adds no category); `:535-599` radio walk **BREAKS** for slider/checkbox Qs (per-type handling = D-14 fixture work); score gauges `toHaveCount(4)` (likely unchanged, per-category); results-CTA boundary (`~:600-620`, timing shifts).

**Method:** `yarn db:reset` + fresh :5173 + `yarn test:e2e` (cardinal rule; "did not run" = failure), read failures, adjust literals. Seed change + spec re-baseline in the SAME plan wave (D-13).

**`testIds.ts`:** register all NEW locators — `question-number-slider`, `question-number-value`, `multiple-text-row`/`-add`/`-remove`/`-move-up`/`-move-down`, `question-choice-helper` (per UI-SPEC Locator Contract).

---

## Shared Patterns

### Context Destructuring Rule (Svelte 5) — all new/edited components
**Source:** CLAUDE.md + `OpinionQuestionInput.svelte:62`
**Apply to:** every new component consuming a context.
Stable members (`t`, `getRoute`) → destructure OK. Reactive accessors (`appSettings`, `dataRoot`, `locale`, `matches`, etc.) → read via `ctx.X` inside the tracking scope; read `ctx.dataRoot.<prop>` DIRECTLY (never via an intermediate `$derived` alias — the `#version`-bridge stale-on-cold-nav hole).

### Value validation through the data class (V5 input validation)
**Source:** `QuestionInput.svelte:112` (`value = question.ensureValue(value)`) + `OpinionQuestionInput.svelte:90` (`question.ensureValue(answer?.value)`)
**Apply to:** number slider (C-2) and multi-choice (C-3) persist paths.
Route every new answer value through `Question.ensureValue`/`_ensureValue` before persist — client smart-default + backend `validate_answer_value` RPC both enforce (number → JSON number; choice ids must exist).

### customData extension point
**Source:** `customData.type.ts:22-79` + `getCustomData(question)` (imported in `QuestionInput`/`QuestionChoices`)
**Apply to:** all new question settings (min/max item + selection counts). JSONB blob — no migration.

### Localization — all 4+ locales
**Source:** UI-SPEC Copywriting Contract
**Apply to:** every new user-facing string. `staticSettings.supportedLocales` = en, fi, sv (source of truth); dirs da, et, fr, lb also maintained. New keys under `questions.multiChoice.*`, `input.multipleText.*`. Reuse existing (`questions.skip`, `questions.answers.yourAnswer`, `error.unsupportedQuestion`) — do NOT duplicate.

### Settings-driven results rendering (UNBLK-06)
**Source:** `voterContext.svelte.ts:271` (`#entityTypes = results.sections`) + `matchState.svelte.ts:103-124` (org→alliance imputation)
**Apply to:** the alliance seed change ONLY. Adding an entity type to `results.sections` is the sole switch needed to surface a fully-wired (Phase-69) entity type — do NOT rebuild the card/drawer/cascade.

---

## No Analog Found

| File / Surface | Role | Data Flow | Reason |
|----------------|------|-----------|--------|
| MultipleText row **reorder** affordance (up/down buttons) | component (interaction) | transform | No drag/up-down reorder UI exists in the codebase; `Input.svelte` `select-multiple` is order-BY-SELECTION only. Net-new per UI-SPEC C-1 (`Button variant="icon"` up/down, keyboard-accessible). Add/remove HAVE precedent; only the reorder is greenfield. |
| number-scale **slider** (`<input type=range>`) | component (input) | transform | `Input.svelte` has a `number` type (`valueAsNumber` coerce, `:319-322`) but NO `range` slider type. Native `<input type=range>` chosen (keyboard-arrow exact-value stepping free — D-03 hard contract). Coercion pattern reused from the `number` type. |

---

## Metadata

**Analog search scope:** `apps/frontend/src/lib/components/questions/`, `apps/frontend/src/lib/components/input/`, `apps/frontend/src/routes/(voters)/`, `packages/data/src/objects/questions/variants/`, `packages/app-shared/src/data/`, `packages/dev-seed/src/templates/`, `tests/tests/`
**Files scanned (read this session):** 9 (all key analogs verified) + 3 upstream docs
**Pattern extraction date:** 2026-07-17
</content>
</invoke>
