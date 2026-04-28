# Phase 61: Voter-App Question Flow - Pattern Map

**Mapped:** 2026-04-24
**Files analyzed:** 7 (3 modified, 1 added optional, 3 read-only references)
**Analogs found:** 7 / 7

All Phase 61 work edits existing files. No new components, routes, or services. Most "analogs" are the file's own siblings inside the same module (e.g., the `isSingleChoiceQuestion` branch is the analog for the new `isBooleanQuestion` branch in `OpinionQuestionInput.svelte`). This is by design — Phase 61 is a bug-fix + reactivity-fix phase whose explicit charter (UI-SPEC) is "preserve every existing pattern, change only the missing branch / broken binding".

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` (MODIFY) | component (Svelte type-switch dispatcher) | request-response (event-driven UI) | Same file — existing `isSingleChoiceQuestion` branch (lines 61-71) | exact (sibling-branch) |
| `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` (MODIFY) | component (radio-group renderer) | event-driven (radio change) | Same file — existing `choices = $derived(question.choices)` (line 87) | exact (in-place) |
| `apps/frontend/src/lib/components/questions/QuestionChoices.type.ts` (MODIFY) | type (component props) | n/a | Same file — existing `question` union type (line 9) | exact (in-place) |
| `packages/data/src/utils/typeGuards.ts` (MODIFY — add `isBooleanQuestion`) | utility (type guard) | transform (predicate) | Same file — existing `isSingleChoiceQuestion` (lines 49-60) | exact (sibling-guard) |
| `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` (MODIFY) | provider (Svelte context factory) | event-driven (reactive state) | `apps/frontend/src/routes/+layout.svelte` (Phase 60 `$effect` + `untrack(() => store.update(...))` idiom, lines 116-133) | role-match (different file but Phase 60 canonical pattern) |
| `apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte` (MODIFY) | route (SvelteKit page) | event-driven (`bind:group` checkbox) | `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` (lines 115-136 — `$effect` snapshot + `untrack`) — **only if planner picks page-level `$effect`-sync approach** | role-match |
| `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte` (DIAGNOSE; possibly MODIFY) | route (SvelteKit page) | event-driven (reads context `$derived`) | `apps/frontend/src/routes/+layout.svelte` (Phase 60 `$derived.by` validation + `$effect`+`untrack` data-provision) | role-match |
| `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` (DIAGNOSE; possibly MODIFY) | provider (Svelte context factory) | event-driven (reactive state) | Same file — existing `unansweredOpinionQuestions` `$derived.by` (lines 274-278); Phase 60 untrack pattern from root layout | role-match |

**Note on QUESTION-04:** The candidate-app pages are *diagnose-first*. The starting hypothesis is "same reactivity class as QUESTION-03"; if diagnosis reveals a different cause (e.g., race on `userData.savedCandidateData`), the planner may add a different fix shape, but the testIds/markup contract is locked.

---

## Pattern Assignments

### `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` (component, request-response) — QUESTION-01 + QUESTION-02

**Analog:** Same file, existing `isSingleChoiceQuestion` branch (lines 61-71).

**Imports pattern** (lines 32-38):
```svelte
<script lang="ts">
  import { isSingleChoiceQuestion } from '@openvaa/data';
  import { getComponentContext } from '$lib/contexts/component';
  import { logDebugError } from '$lib/utils/logger';
  import QuestionChoices from './QuestionChoices.svelte';
  import ErrorMessage from '../errorMessage/ErrorMessage.svelte';
  import type { OpinionQuestionInputProps } from './OpinionQuestionInput.type';
</script>
```
*Add for the boolean branch:* import either the new `isBooleanQuestion` guard from `@openvaa/data` (preferred — see typeGuards pattern below) OR `isObjectType` + `OBJECT_TYPE` for inline `isObjectType(question, OBJECT_TYPE.BooleanQuestion)`. Also import `Choice` type if synthesizing the pseudo-choice array.

**Props destructure pattern** (lines 40-48):
```svelte
let {
  question,
  mode = 'answer',
  answer = undefined,
  otherAnswer = undefined,
  otherLabel = undefined,
  onChange,
  ...restProps
}: OpinionQuestionInputProps = $props();
```
*Reuse unchanged.* Boolean branch consumes the same props.

**Context-getter pattern** (line 57):
```svelte
const { t } = getComponentContext();
```
*Reuse unchanged.* `t('common.answer.yes')` / `t('common.answer.no')` are called inside the boolean branch.

**Existing `isSingleChoiceQuestion` branch — the canonical sibling pattern to mirror** (lines 60-74):
```svelte
<div data-testid="opinion-question-input">
  {#if isSingleChoiceQuestion(question)}
    {@const selectedId = question.ensureValue(answer?.value)}
    {@const otherSelected = question.ensureValue(otherAnswer?.value)}
    <QuestionChoices
      {question}
      {mode}
      {selectedId}
      {otherSelected}
      {otherLabel}
      onChange={onChange ? (d) => onChange({ value: d.value, question: d.question }) : undefined}
      {...restProps} />
  {:else}
    <ErrorMessage inline message={t('error.unsupportedQuestion')} class="text-center" />
  {/if}
</div>
```

**New boolean branch (mirrors the above, with id↔boolean translation):**
- Insert a `{:else if isBooleanQuestion(question)}` branch **before** the `{:else}` fallback.
- Synthesize `[{ id: 'no', label: t('common.answer.no') }, { id: 'yes', label: t('common.answer.yes') }]` (note: `'no'` first matches the ordinal "low→high" left-to-right convention; if the existing UX prefers `'yes'` first, planner decides at execution time — UI-SPEC is silent on order, both are acceptable).
- Map answer value to pseudo-choice id with a small helper: `answer?.value === true → 'yes'`, `answer?.value === false → 'no'`, else `null`.
- In the `onChange` adapter, translate the pseudo-choice id back to a boolean: `(d) => onChange({ value: d.value === 'yes', question: d.question })`.
- Pass `showLine` and `variant="horizontal"` explicitly OR extend `QuestionChoices` defaults (see QuestionChoices pattern below).

**Why this pattern works for QUESTION-02 too:** `EntityOpinions.svelte` already routes its display path through `OpinionQuestionInput {mode='display'}` (see analog below). The new boolean branch handles `mode='display'` automatically because the `selectedId` / `otherSelected` mapping is the same code path. Zero changes needed in `EntityOpinions.svelte`.

**Error handling pattern** (line 73):
```svelte
{:else}
  <ErrorMessage inline message={t('error.unsupportedQuestion')} class="text-center" />
```
*Preserve.* The fallback now only fires for genuinely unsupported types (e.g., text/numeric/date opinion questions if any are added later).

---

### `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` (component, event-driven) — QUESTION-01 support

**Analog:** Same file, existing `choices = $derived(question.choices)` (line 87) and the `doShowLine` / `vertical` variant defaults (lines 101-109).

**Current consumption of `question.choices`** (line 87):
```svelte
let choices = $derived(question.choices);
let text = $derived(question.text);
```

**Required modification — accept explicit `choices` prop override:**
```svelte
let {
  question,
  choices: explicitChoices = undefined,   // NEW
  disabled = false,
  selectedId = undefined,
  // ... rest unchanged
}: QuestionChoicesProps = $props();

let choices = $derived(explicitChoices ?? question.choices);
let text = $derived(question.text);
```

**Variant defaults pattern** (lines 101-109):
```svelte
let doShowLine = $derived.by(() => {
  if (showLine) return showLine;
  return isObjectType(question, OBJECT_TYPE.SingleChoiceOrdinalQuestion);
});
let vertical = $derived.by(() => {
  if (variant) return variant === 'vertical';
  return isObjectType(question, OBJECT_TYPE.SingleChoiceCategoricalQuestion) || !!getCustomData(question).vertical;
});
```
*Recommended extension (planner discretion):* extend `doShowLine` to also return `true` for `OBJECT_TYPE.BooleanQuestion` so booleans default to ordinal-like 2-point line without callers needing to pass `showLine={true}` explicitly. `vertical` already defaults to `false` (horizontal) for boolean — no change needed there.

**Render contract preserved** (lines 209-275): `<fieldset data-testid="question-choices">` + `{#each choices ?? [] as { id, label }, i}` over the new pseudo-choices works without further changes. The radio inputs (`data-testid="question-choice"`, `bind:group={selected}`, etc.) are choice-id-agnostic — they consume whatever `id`/`label` shape `Choice` defines.

---

### `apps/frontend/src/lib/components/questions/QuestionChoices.type.ts` (type, n/a) — QUESTION-01 support

**Analog:** Same file, existing `QuestionChoicesProps` type (lines 5-50).

**Current shape** (lines 5-12):
```typescript
import type { Id } from '@openvaa/core';
import type { SingleChoiceCategoricalQuestion, SingleChoiceOrdinalQuestion } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';

export type QuestionChoicesProps = SvelteHTMLElements['fieldset'] & {
  /**
   * The `ChoiceQuestion` object.
   */
  question: SingleChoiceCategoricalQuestion | SingleChoiceOrdinalQuestion;
```

**Required modifications:**
1. Widen `question` type to `SingleChoiceCategoricalQuestion | SingleChoiceOrdinalQuestion | BooleanQuestion`. Import `BooleanQuestion` from `@openvaa/data`.
2. Add new optional `choices?: Array<Choice>` prop (override). Import `Choice` from `@openvaa/data`.
3. Add the same prop's docblock following the existing JSDoc style (see existing `disabled`, `mode`, `selectedId` docblocks for tone).
4. Update the inner `ChoiceEventData.question` type (line 59) to match the widened union.

---

### `packages/data/src/utils/typeGuards.ts` (utility, transform) — QUESTION-01 support (RECOMMENDED ADD)

**Analog:** Same file, existing `isSingleChoiceQuestion` (lines 49-60).

**Sibling-guard pattern to mirror** (lines 49-60):
```typescript
/**
 * Check if an object is a any subtype of `SingleChoiceQuestion`.
 */
export function isSingleChoiceQuestion(
  obj: unknown
): obj is SingleChoiceCategoricalQuestion | SingleChoiceOrdinalQuestion {
  return (
    isDataObject(obj) &&
    (obj.objectType === OBJECT_TYPE.SingleChoiceCategoricalQuestion ||
      obj.objectType === OBJECT_TYPE.SingleChoiceOrdinalQuestion)
  );
}
```

**New `isBooleanQuestion` guard (mirror exact shape):**
- Add `BooleanQuestion` to the type imports at the top of the file (lines 2-12).
- Add the function next to `isSingleChoiceQuestion` for alphabetical/visual locality.
- Return `isDataObject(obj) && obj.objectType === OBJECT_TYPE.BooleanQuestion`.
- Match the JSDoc tone (one-line description).

**Export pattern** — add to `packages/data/src/index.ts` next to `isChoiceQuestion` (line 110) and `isSingleChoiceQuestion` (line 121). The existing barrel re-exports the utility one symbol per line in alphabetical groups.

**Build pattern** — `@openvaa/data` is consumed by `apps/frontend` at runtime, so executor MUST run `yarn build --filter=@openvaa/data` after adding the guard for the frontend to import it. Document this in the plan.

**Alternative if planner skips the guard:** use the existing `isObjectType(question, OBJECT_TYPE.BooleanQuestion)` pattern (already used in `QuestionChoices.svelte` line 103). Trade-off documented in RESEARCH §"Alternatives Considered".

---

### `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` (provider, event-driven) — QUESTION-03

**Analog (Phase 60 canonical):** `apps/frontend/src/routes/+layout.svelte` lines 116-133 — `$effect` + snapshot + `untrack(() => get(store).update(...))` idiom for in-effect store/state mutation.

**Phase 60 reference excerpt** (`apps/frontend/src/routes/+layout.svelte:116-133`):
```svelte
$effect(() => {
  if ('error' in validity) return;
  // Snapshot validity fields inside the effect's tracked scope, then apply
  // side-effects inside `untrack` to prevent the DataRoot subscriber
  // `version++` from retriggering this effect (Svelte 5
  // `effect_update_depth_exceeded`).
  const snapshot = {
    electionData: validity.electionData,
    constituencyData: validity.constituencyData
  };
  untrack(() => {
    const dr = get(dataRootStore);
    dr.update(() => {
      dr.provideElectionData(snapshot.electionData);
      dr.provideConstituencyData(snapshot.constituencyData);
    });
  });
});
```

**Current state to replace** (`voterContext.svelte.ts:144-145, 242, 299-304`):
```typescript
const _selectedQuestionCategoryIds = sessionStorageWritable('voterContext-selectedCategoryIds', new Array<Id>());
const selectedQuestionCategoryIdsState = fromStore(_selectedQuestionCategoryIds);
// ...
_selectedQuestionCategoryIds.set([]);   // inside resetVoterData()
// ...
get selectedQuestionCategoryIds() {
  return selectedQuestionCategoryIdsState.current;
},
set selectedQuestionCategoryIds(v) {
  _selectedQuestionCategoryIds.set(v);
}
```

**Target state — pure `$state` (drop sessionStorage per D-11):**
```typescript
let _selectedQuestionCategoryIds = $state<Array<Id>>([]);
let hasSeededCategorySelection = $state(false);

// Default-seed once opinionQuestionCategories are available (RESEARCH Pattern 2).
// Guard with a flag so user de-selects don't get overwritten on subsequent
// _opinionQuestionCategories reactions.
$effect(() => {
  if (hasSeededCategorySelection) return;
  const cats = _opinionQuestionCategories.value;
  if (cats.length === 0) return;
  untrack(() => {
    _selectedQuestionCategoryIds = cats.map((c) => c.id);
    hasSeededCategorySelection = true;
  });
});

// resetVoterData(): replace `_selectedQuestionCategoryIds.set([])` with:
_selectedQuestionCategoryIds = [];
hasSeededCategorySelection = false;

// Context accessors — return $state directly (no fromStore bridge):
get selectedQuestionCategoryIds() {
  return _selectedQuestionCategoryIds;
},
set selectedQuestionCategoryIds(v) {
  _selectedQuestionCategoryIds = v;
}
```

**Downstream consumer chain (lines 150-156)** stays unchanged — `questionBlockStore` already accepts a getter callback:
```typescript
const _selectedQuestionBlocks = questionBlockStore({
  firstQuestionId: () => firstQuestionIdState.current,
  opinionQuestionCategories: () => _opinionQuestionCategories.value,
  selectedQuestionCategoryIds: () => selectedQuestionCategoryIdsState.current,  // change to: () => _selectedQuestionCategoryIds
  selectedElections: () => selectedElections,
  selectedConstituencies: () => selectedConstituencies
});
```
Only the `selectedQuestionCategoryIds` getter callback changes from `selectedQuestionCategoryIdsState.current` to direct `_selectedQuestionCategoryIds` (rune-tracked `$state` array).

**Imports cleanup** — `sessionStorageWritable` import (line 18) can stay (still used for `_firstQuestionId` line 147) or be removed if planner also migrates `firstQuestionId` (NOT in Phase 61 scope per CONTEXT). Default: leave the import; only the `selectedCategoryIds` line is touched.

---

### `apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte` (route, event-driven) — QUESTION-03 page side

**Analog:** Same file's existing `onMount` (lines 49-69) + the `bind:group` checkbox (line 126).

**Existing `bind:group` pattern (the bug site)** (lines 121-127):
```svelte
<input
  type="checkbox"
  class="checkbox"
  name="vaa-selectedCategories"
  value={category.id}
  bind:group={voterCtx.selectedQuestionCategoryIds}
  data-testid="voter-questions-category-checkbox" />
```

**Behavior post-fix:** When the context migrates to pure `$state`, the same `bind:group={voterCtx.selectedQuestionCategoryIds}` line works because the getter/setter accessors now read/write a rune-tracked `$state` directly, eliminating the `fromStore` round-trip. **No markup change required** if planner picks the context-only fix (recommended).

**Existing `onMount` defaults** (lines 49-69) — simplification target:
```svelte
onMount(() => {
  voterCtx.firstQuestionId = null;
  voterCtx.selectedQuestionCategoryIds = voterCtx.selectedQuestionCategoryIds.filter((id) =>
    opinionQuestionCategories.find((c) => c.id === id)
  );
  if (voterCtx.selectedQuestionCategoryIds.length === 0)
    voterCtx.selectedQuestionCategoryIds = opinionQuestionCategories.map((c) => c.id);
  if (!$appSettings.questions.questionsIntro.show) {
    // redirect logic ...
  }
});
```

**Refactor (RESEARCH Example 4):** keep the stale-ID filter (it's a navigation-level concern), drop the default-seed (now handled in context):
```svelte
onMount(() => {
  voterCtx.firstQuestionId = null;
  // Filter stale IDs that no longer apply to the current election/constituency.
  // Default-seeding is now handled inside voterContext via $effect.
  const filtered = voterCtx.selectedQuestionCategoryIds.filter((id) =>
    opinionQuestionCategories.find((c) => c.id === id)
  );
  if (filtered.length !== voterCtx.selectedQuestionCategoryIds.length) {
    voterCtx.selectedQuestionCategoryIds = filtered;
  }
  // Redirect logic unchanged
  if (!$appSettings.questions.questionsIntro.show) {
    const categoryId = selectedQuestionBlocks.blocks[0]?.[0]?.category.id;
    return goto(
      $getRoute(
        $appSettings.questions.categoryIntros?.show && categoryId
          ? { route: 'QuestionCategory', categoryId }
          : { route: 'Question' }
      ),
      { replaceState: true }
    );
  }
});
```

**Counter binding pattern (preserved)** (lines 156-160):
```svelte
text={t('questions.intro.start', {
  numQuestions: voterCtx.selectedQuestionCategoryIds.length > 0 ? selectedQuestionBlocks.questions.length : 0
})}
```
*No change.* Once the context-level reactivity is fixed, this `$derived`-driven interpolation correctly re-computes on every checkbox toggle.

**TestIds preserved** (mandatory — see UI-SPEC §Component Inventory):
- `data-testid="voter-questions-category-list"` (line 118)
- `data-testid="voter-questions-category-checkbox"` (line 127)
- `data-testid="voter-questions-start"` (line 160)

---

### `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte` (route, event-driven) — QUESTION-04 (DIAGNOSE-FIRST)

**Analog (Phase 60 canonical):** `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` lines 115-136 — Phase 60's `$effect` + snapshot + `untrack(() => { dr.update(...); userData.init(...); })` idiom.

**Phase 60 reference excerpt** (`apps/frontend/src/routes/candidate/(protected)/+layout.svelte:115-136`):
```svelte
$effect(() => {
  if (validity.state !== 'resolved') return;
  const snapshot = {
    questionData: validity.questionData,
    entities: validity.entities,
    nominations: validity.nominations,
    userData: validity.userData
  };
  untrack(() => {
    const dr = get(dataRoot);
    dr.update(() => {
      dr.provideQuestionData(snapshot.questionData);
      dr.provideEntityData(snapshot.entities);
      dr.provideNominationData(snapshot.nominations);
    });
    userData.init(snapshot.userData);
  });
});
```

**Existing page completion-enum pattern (preserve)** (lines 49-55):
```svelte
let completion = $derived<'empty' | 'partial' | 'full'>(
  unansweredOpinionQuestions.length === 0
    ? 'full'
    : unansweredOpinionQuestions.length === opinionQuestions.length
      ? 'empty'
      : 'partial'
);
```

**Branch markup with testIds (mandatory contract — UI-SPEC §Interaction Contract):**
- `{#if completion === 'empty' && !answersLocked}` → `data-testid="candidate-questions-start"` Button (line 109).
- `{:else}` → `data-testid="candidate-questions-list"` div (line 139), with optional `data-testid="candidate-questions-continue"` (line 135), `data-testid="candidate-questions-progress"` (line 121), `data-testid="candidate-questions-card"` (line 184), `data-testid="candidate-questions-home"` (line 199).

**DO NOT** rename, relocate, or move these testIds. Playwright assertions in `tests/tests/specs/candidate/candidate-questions.spec.ts:34-38` use `.or()` over `list` and `start` to handle either render branch.

**Diagnostic-first protocol (RESEARCH Pattern 3):**
1. Run `yarn playwright test -c ./tests/playwright.config.ts tests/tests/specs/candidate/candidate-questions.spec.ts --workers=1 --trace=on`.
2. Inspect trace to determine which layout-state branch persists (loading / error / terms / ready).
3. If layout is `ready` but neither testId visible: log/inspect `completion` value and `unansweredOpinionQuestions.length` / `opinionQuestions.length` at first paint.
4. Fix shape decision tree:
   - **If reactivity (Hypothesis A):** apply Phase 60 `untrack` pattern in `candidateContext.svelte.ts` (see analog below).
   - **If userData race (Hypothesis B):** add a readiness `$derived` that gates rendering until `opinionQuestions.length > 0 || userData.savedCandidateData != null`.
   - **If conditional-render race (Hypothesis C):** spec-side `await expect(...).toBeVisible({ timeout: 15000 })` relaxation (escalates outside Phase 61's frontend scope).

---

### `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` (provider, event-driven) — QUESTION-04 (POSSIBLE)

**Analog (sibling):** Same file, existing `unansweredOpinionQuestions` `$derived.by` (lines 274-278):
```typescript
const unansweredOpinionQuestions = $derived.by(() => {
  const savedData = userData.savedCandidateData;
  if (!savedData) return [];
  return _opinionQuestions.value.filter((q) => isEmptyValue(savedData.answers?.[q.id]?.value));
});
```

**Analog (Phase 60 canonical):** `apps/frontend/src/routes/+layout.svelte:116-133` — `untrack(() => get(store).update(...))` for in-effect store mutation.

**If diagnosis confirms Hypothesis A** (race on a `fromStore`-bridged value or stale `$derived`), apply the `untrack` pattern to any `$effect` that reads-then-writes. Most likely target: nothing in this file — static review (RESEARCH §QUESTION-04) shows the file is reactivity-clean. The page-level fix or context shape change is more probable.

**If a new `$state` is introduced for QUESTION-04 (e.g., a "ready" gate):** mirror the QUESTION-03 pattern (pure `$state` + `untrack` if the seed effect mutates it).

---

## Shared Patterns

### `$effect` + snapshot + `untrack(() => get(store).update(...))` for in-effect mutation
**Source:** `apps/frontend/src/routes/+layout.svelte:116-133` (Phase 60 root layout) and `apps/frontend/src/routes/candidate/(protected)/+layout.svelte:115-136` (Phase 60 candidate-protected layout).
**Apply to:** Any `$effect` in `voterContext.svelte.ts` or `candidateContext.svelte.ts` that mutates a store/`$state` it also reads from. Required to avoid `effect_update_depth_exceeded` (Svelte 5 reactivity cycle — see RESEARCH §Common Pitfalls Pitfall 2).

```svelte
$effect(() => {
  // Read inputs inside tracked scope — establishes the dependency
  const snapshot = { ... };
  // Apply mutations inside untrack; use get(store) for non-reactive access
  untrack(() => {
    const dr = get(dataRootStore);
    dr.update(() => { /* mutations */ });
  });
});
```

### Type-switch via type guards (NOT string comparison)
**Source:** `packages/data/src/utils/typeGuards.ts:49-60` (`isSingleChoiceQuestion`); usage at `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte:61`.
**Apply to:** All type dispatch in `OpinionQuestionInput.svelte`. Boolean branch must use `isBooleanQuestion(question)` (new guard) OR `isObjectType(question, OBJECT_TYPE.BooleanQuestion)`. Never `question.type === 'boolean'`.

```typescript
import { isSingleChoiceQuestion, isObjectType, OBJECT_TYPE } from '@openvaa/data';
// Preferred (matches existing codebase symmetry):
if (isSingleChoiceQuestion(question)) { ... }
else if (isBooleanQuestion(question)) { ... }
// Acceptable fallback if guard not added:
else if (isObjectType(question, OBJECT_TYPE.BooleanQuestion)) { ... }
```

### Svelte context factory shape (`init*Context` + `get*Context` + `Symbol` key)
**Source:** `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:23-35` and `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:24-36`.
**Apply to:** No new contexts created in Phase 61, but any modification to existing contexts must preserve the existing shape (Symbol-keyed, hasContext-guarded init, error 500 if accessed before init, `setContext` returns the value).

```typescript
const CONTEXT_KEY = Symbol();
export function getXxxContext(): XxxContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getXxxContext() called before initXxxContext()');
  return getContext<XxxContext>(CONTEXT_KEY);
}
export function initXxxContext(): XxxContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initXxxContext() called for a second time');
  // ... derive state ...
  return setContext<XxxContext>(CONTEXT_KEY, { /* getters/setters */ });
}
```

### `data-testid` attribute as the Playwright contract
**Source:** `tests/tests/utils/testIds.ts:11-60` and `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:109,121,135,139,184,199`.
**Apply to:** Every Phase 61 markup change. Existing testIds (`opinion-question-input`, `question-choices`, `question-choice`, `voter-questions-category-list`, `voter-questions-category-checkbox`, `voter-questions-start`, `candidate-questions-start`, `candidate-questions-list`, `candidate-questions-continue`, `candidate-questions-progress`, `candidate-questions-card`, `candidate-questions-home`) must be preserved at their current nesting level. New testIds (e.g., `opinion-question-yes` / `opinion-question-no`) are planner discretion per UI-SPEC §Interaction Contract.

### i18n via `getComponentContext().t` with existing `common.answer.{yes,no}` keys
**Source:** `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte:57` (context import) and `apps/frontend/src/lib/i18n/translations/en/common.json:6-9` (key location).
**Apply to:** Boolean pseudo-choice labels in OpinionQuestionInput. **Use existing `common.answer.yes` / `common.answer.no`** — verified present in en/fi/sv/da. Do NOT introduce new top-level `common.yes` keys (RESEARCH §Pitfall 5 + UI-SPEC §Copywriting Contract supersede CONTEXT D-02's draft path).

```typescript
const { t } = getComponentContext();
// In the boolean branch:
const booleanChoices = $derived<Array<Choice>>([
  { id: 'no', label: t('common.answer.no') },
  { id: 'yes', label: t('common.answer.yes') }
]);
```

### Defensive `logDebugError` for runtime invariants
**Source:** `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte:50-51`:
```svelte
if (mode === 'display' && otherAnswer && !otherLabel)
  logDebugError('You should supply an otherLabel when mode is "display" and otherSelected is provided');
```
**Apply to:** Optional. Boolean branch may add a similar `logDebugError` if a boolean question arrives with non-boolean `answer.value` (shouldn't happen — `BooleanQuestion._ensureValue = ensureBoolean`), but the existing fallback to `null` selectedId already handles this gracefully.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | — | — | Every Phase 61 file has a clear analog inside the codebase or its own siblings. The phase introduces no new files, no new components, no new routes, no new services. |

The closest thing to "no analog" is the pseudo-choice synthesis itself (mapping a `BooleanQuestion` into a `SingleChoiceOrdinalQuestion`-shaped `Choice[]`) — but the pattern of mapping data-layer types into UI-layer adapter shapes is established by the `getCustomData` helper from `@openvaa/app-shared` (used in `QuestionChoices.svelte:108`) and by the `unwrapEntity` helper used in `EntityOpinions.svelte:32`. The new `[{ id: 'no' }, { id: 'yes' }]` literal in `OpinionQuestionInput.svelte` is a tiny inline adapter, not a new pattern.

---

## Metadata

**Analog search scope:**
- `apps/frontend/src/lib/components/questions/` (full)
- `apps/frontend/src/lib/components/input/` (reference for boolean info-question dispatch — `QuestionInput.svelte` already wires boolean for info questions)
- `apps/frontend/src/lib/dynamic-components/entityDetails/` (EntityOpinions.svelte — QUESTION-02 confirmation)
- `apps/frontend/src/lib/contexts/voter/` (full)
- `apps/frontend/src/lib/contexts/candidate/` (full)
- `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts` (sessionStorageWritable implementation being dropped)
- `apps/frontend/src/routes/+layout.svelte` (Phase 60 root layout — `untrack` idiom)
- `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` (Phase 60 candidate layout — `untrack` idiom)
- `apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte` (QUESTION-03 page consumer)
- `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte` (QUESTION-04 page)
- `packages/data/src/utils/typeGuards.ts` (sibling-guard pattern)
- `packages/data/src/objects/questions/variants/booleanQuestion.ts` (matching contract — read for understanding, not modified)
- `packages/data/src/index.ts` (barrel — for guard export)
- `apps/frontend/src/lib/i18n/translations/en/common.json` (existing yes/no keys)
- `tests/tests/utils/testIds.ts` (testId contract)
- `tests/tests/specs/candidate/candidate-questions.spec.ts` (QUESTION-04 spec gate)

**Files scanned:** ~16 source files + supporting types/index/i18n/spec.

**Pattern extraction date:** 2026-04-24
