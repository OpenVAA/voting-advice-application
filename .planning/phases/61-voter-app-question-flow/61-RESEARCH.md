# Phase 61: Voter-App Question Flow - Research

**Researched:** 2026-04-24
**Domain:** Svelte 5 runes reactivity + SvelteKit question-flow UI + @openvaa/data type dispatch
**Confidence:** HIGH (codebase evidence) / MEDIUM-HIGH (QUESTION-03 root-cause hypothesis) / MEDIUM (QUESTION-04 reactivity hypothesis — needs execution-time validation)

---

## Summary

Phase 61 is a narrow UI + reactivity fix phase riding on top of the Phase 60 runes-mode layouts. Three of the four requirements (QUESTION-01, QUESTION-02, QUESTION-03) have a crisp target site in the voter app; the fourth (QUESTION-04) is a "same-reactivity-class" hypothesis fold from Phase 60's candidate-questions handoff that requires diagnostic validation before coding.

Boolean rendering (QUESTION-01) is a one-branch addition to `OpinionQuestionInput.svelte` — the opinion-input component currently dispatches only on `isSingleChoiceQuestion` and falls through to `<ErrorMessage>` for boolean. The matching layer is already complete: `BooleanQuestion._normalizeValue` maps `false→COORDINATE.Min` / `true→COORDINATE.Max`, so `@openvaa/matching` treats boolean exactly like a 2-point ordinal. QUESTION-02 is therefore satisfied automatically by the QUESTION-01 fix because `EntityOpinions.svelte` already dispatches both its answer and display modes through `OpinionQuestionInput`; no separate per-question match-breakdown component needs hunting down.

QUESTION-03 is a Svelte 5 binding pitfall, not a missing `$derived`. The intermittent-0-counter symptom is explained by the combination of: (a) `sessionStorageWritable('voterContext-selectedCategoryIds', [])` defaults to an empty array on first paint, (b) `bind:group={voterCtx.selectedQuestionCategoryIds}` binds to a **getter/setter context property** (`get` returns `selectedQuestionCategoryIdsState.current`, `set` calls `_selectedQuestionCategoryIds.set(v)`), and (c) there is a known Svelte 5 pitfall where `bind:group` on a checkbox backed by a getter/setter accessor fails to propagate writes reliably. Every other `bind:group` in the frontend targets a local `$state` array; `/questions/+page.svelte:126` is the sole outlier using a context accessor. The `onMount` initializer (lines 49-69) that sets the default-all-checked state only runs post-hydration, which on full page load leaves a one-frame window where the counter renders `0` before the defaults are written — this explains the "sometimes correct, sometimes not" intermittent symptom noted in the todo.

**Primary recommendation for QUESTION-03:** Migrate `selectedQuestionCategoryIds` from `sessionStorageWritable`+`fromStore` bridge to a local `$state<Array<Id>>` on the context, initialized to `opinionQuestionCategories.map(c => c.id)` via a `$derived.by`-backed lazy initializer or an `onMount`-equivalent inside the context (`$effect.pre` or immediate initialization based on `reactiveDataRoot.current`). Drop the sessionStorage persistence per CONTEXT D-11 ("session-only in-memory `$state`"). Replace `bind:group` binding to a context getter/setter with a local `$state` in the page that syncs back to the context in a `$effect` — mirroring the Phase 60 `get(store) + untrack(() => store.update(...))` pattern where necessary to avoid `effect_update_depth_exceeded`.

QUESTION-04 (candidate-questions testId timeout) is a hypothesis fold. `candidateContext.svelte.ts` already uses `$derived` throughout for `unansweredOpinionQuestions`, `profileComplete`, and `questionBlocks` — on inspection the context looks reactivity-clean. The most likely culprit for testId visibility is a race between `userData.savedCandidateData` becoming populated (which happens inside the protected layout's `$effect` via `userData.init(snapshot.userData)` — see Phase 60 `(protected)/+layout.svelte` line 134) and the child questions page reading `userData.savedCandidateData` in `getSavedAnswer`. On full page load the layout's `$effect` fires, calls `userData.init`, but the page component mounts in the same tick and reads `savedCandidateData` that is still the initial pre-init value. Diagnosis plan: add targeted trace logging (remove before landing) to confirm which derivation returns an empty/stale value when the testIds fail to appear, then apply the same `$derived` + `get(store)+untrack` pattern from Phase 60.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Boolean Answer UI Pattern (QUESTION-01)**

- **D-01:** Reuse the existing `QuestionChoices` grid with two synthesized pseudo-choices. Lowest-friction path — keeps voter visual language consistent with singleChoice ordinal/categorical; no new grid/layout component.
- **D-02:** Labels come from i18n defaults `common.yes` / `common.no`, with per-question override via `customData` (existing Question extensibility). No new content-model surface required. **(Superseded at UI-SPEC level: the actual existing i18n path is `common.answer.yes` / `common.answer.no` — use that path, not a new top-level `common.yes`.)**
- **D-03:** Synthesis happens in `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` — add an `isBooleanQuestion(question)` branch alongside `isSingleChoiceQuestion`. The branch creates two pseudo-choices (`{ id: 'yes', label: t('common.answer.yes') }`, `{ id: 'no', label: t('common.answer.no') }`) and delegates to `QuestionChoices`. `@openvaa/data`'s `BooleanQuestion` type stays pure — the UI layer handles the choice-synthesis, not the data layer.
- **D-04:** Skip behavior is the same as ordinal — the existing skip affordance in `QuestionActions` continues to apply regardless of question type. Voters can still refuse to answer boolean questions.

**Boolean Match-Breakdown (QUESTION-02)**

- **D-05:** **No matching-layer work needed.** `packages/data/src/objects/questions/variants/booleanQuestion.ts` already implements `_normalizeValue` (false→`COORDINATE.Min`, true→`COORDINATE.Max`). **QUESTION-02 is purely a UI-layer dispatch fix.**
- **D-06:** Display via the extended singleChoiceOrdinal renderer path — the per-question match-breakdown component's type-switch must handle boolean alongside singleChoiceOrdinal and singleChoiceCategorical. Render the boolean match using the same visual idiom singleChoiceOrdinal uses (two positions on a line, voter and candidate markers on `COORDINATE.Min` and `COORDINATE.Max`).
- **D-07:** Missing-side (unanswered) behavior matches ordinal — matching algorithm already skips unanswered questions via `isMissingValue`; breakdown UI renders the neutral/grayed state consistent with other question types. No new logic.

**Category Default + Reactivity (QUESTION-03)**

- **D-08:** Default selection state is **all opinion categories checked** on a fresh voter session. Researcher must investigate the intermittent failure mechanism (likely a race between context initialization and the category-list render), not just implement the default.
- **D-09:** Reactivity fix shape is `$derived` migration per the Phase 60 pattern. Replace any leftover `$:` or `$effect`-based derivation with `$derived`. If any store mutation happens inside an `$effect` during the fix, apply the Phase 60 `get(store) + untrack(() => store.update(...))` idiom.
- **D-10:** Counter scope — preserve the existing counting semantics (whatever the current code intends to count; executor does NOT reinterpret the counter).
- **D-11:** Category-selection persistence is **session-only — in-memory `$state` in the voter context**. No `sessionStorage` or `localStorage` wiring in this phase. Selection resets when the session clears, matching how other voter-context state behaves.

**Folded Scope — Candidate-Questions TestId-Timeout (QUESTION-04)**

- **D-12:** Fold the Phase 60 candidate-questions handoff into Phase 61 as a new requirement QUESTION-04. Phase 61 becomes "voter-app question flow + candidate-app question-list reactivity".
- **D-13:** Plan QUESTION-04 as a sibling to the voter-context reactivity fix (D-09). Starting hypothesis: same reactivity-class bug family as QUESTION-03. If researcher/planner diagnoses a different root cause, the plans may split.
- **D-14:** QUESTION-04 text: "Candidate-app question-list reactivity is restored — the `candidate-questions-list` and `candidate-questions-start` testIds become visible within Playwright's default timeout on the candidate questions route, so the 6 direct `candidate-questions.spec.ts` tests pass and their 18 dependent cascade tests (candidate-app-mutation / candidate-app-settings / candidate-app-password / re-auth-setup) run and pass."

### Claude's Discretion

- Exact plan split within the phase (one plan per REQ-ID vs grouped). Planner decides based on file-overlap and wave parallelism. Starting suggestion from CONTEXT: Plan 61-01 (boolean rendering: QUESTION-01 + QUESTION-02, both UI-layer dispatch fixes in closely-related files), Plan 61-02 (category reactivity: QUESTION-03, voter-context migration), Plan 61-03 (candidate-questions testId diagnosis + fix: QUESTION-04).
- Diagnostic depth before coding for D-08's intermittent-failure aspect.
- Whether the D-14 QUESTION-04 work produces one plan or splits into diagnosis-plan + fix-plan based on diagnosis outcome.
- Exact test-ID identifiers used for the D-01 boolean input if Playwright coverage expands during execution.

### Deferred Ideas (OUT OF SCOPE)

- **Admin-configurable category defaults.** D-08 locks "all checked"; making it admin-configurable (via `app_customization`) is future work.
- **Cross-session category-selection persistence (localStorage).** D-11 locks session-only; persistent preferences deferred.
- **Dedicated boolean UI (two big buttons) or slider/toggle.** D-01 picks QuestionChoices-grid reuse.
- **Agree/Disagree framing** (vs. Yes/No). D-02 locks Yes/No.
- **Dedicated subdimension for boolean** (2-way categorical treatment). D-05 confirms single-axis ordinal subdim.
- **New `REACTIVITY` REQ-ID cluster.** D-14 locks QUESTION-04 inside the QUESTION cluster.
- **Test-ID visibility issue as an alternative hypothesis for QUESTION-04.** D-13 picks the reactivity hypothesis; if diagnosis shows missing/renamed testIds, the fix may be much smaller.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QUESTION-01 | Boolean-type questions render an appropriate answer control (yes/no) in the voter flow. Voter can answer and advance. | `OpinionQuestionInput.svelte` lines 60-74 confirmed as single dispatch point; only `isSingleChoiceQuestion` branch exists. `BooleanQuestion` class exists at `packages/data/src/objects/questions/variants/booleanQuestion.ts`. `common.answer.yes`/`common.answer.no` verified present in all 4 locales (en/fi/sv/da). **Missing helper:** no `isBooleanQuestion` type guard in `@openvaa/data`; the typeGuards.ts file currently exposes `isQuestion`, `isChoiceQuestion`, `isSingleChoiceQuestion`, `isMultipleChoiceQuestion`, `isEntity`, `isNomination`, `isDataObject`, `isObjectType`. Executor must either add `isBooleanQuestion` or use `isObjectType(question, OBJECT_TYPE.BooleanQuestion)` (existing pattern — used in `QuestionChoices.svelte` line 103 for similar purposes). |
| QUESTION-02 | Candidate result-detail page opens without error for boolean answers; per-question match-breakdown handles `boolean` alongside `singleChoiceOrdinal`/`singleChoiceCategorical`. | `EntityOpinions.svelte` (the "per-question match breakdown component") confirmed already dispatches via `OpinionQuestionInput` in both `answer` and `display` modes (line 70-75). **QUESTION-02 is a free side-effect of QUESTION-01** — once `OpinionQuestionInput` handles boolean, `EntityOpinions` works automatically. |
| QUESTION-03 | Category-selection screen defaults to all opinion categories checked; counter updates reactively on every toggle. | Root cause localized to `voterContext.svelte.ts:144-145,299-304`: `selectedQuestionCategoryIds` is a `sessionStorageWritable` bridged via `fromStore`, exposed as a getter/setter context property, and `bind:group`-bound in `/questions/+page.svelte:126`. This is the ONLY `bind:group` in the frontend that targets a non-`$state` accessor (all 12 other usages target local `$state` variables). Combined with `onMount`-timed default initialization (lines 49-69), this produces the intermittent-0-counter symptom. Fix: migrate to local `$state`, drop sessionStorage per D-11. |
| QUESTION-04 | Candidate-app question-list reactivity restored; `candidate-questions-list` / `candidate-questions-start` testIds visible within Playwright timeout; 6 direct + 18 cascade tests pass. | `candidateContext.svelte.ts` already uses `$derived` throughout; no obvious reactivity break found statically. Most plausible remaining hypothesis: timing race between `userData.init(snapshot.userData)` in protected layout `$effect` (line 134 of `(protected)/+layout.svelte`) and the questions page reading `userData.savedCandidateData`. Requires runtime diagnostic before prescriptive fix. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Boolean answer input rendering (opinion questions) | Browser (`OpinionQuestionInput.svelte`) | — | Pure UI dispatch; no server-side work needed. BooleanQuestion class (data layer) already implements the matching contract. |
| Boolean answer value → coordinate normalization | @openvaa/data (data-model tier) | @openvaa/matching (consumes via `_normalizeValue`) | Already implemented. No change. |
| Voter answer value → boolean persistence | Browser (`answerStore.svelte.ts` + Supabase adapter) | Database (Postgres) | Unchanged — `value: true/false` flows through the existing AnswerStore without modification. |
| Boolean match-breakdown display on result-detail | Browser (`EntityOpinions.svelte` → `OpinionQuestionInput.svelte` in `mode='display'`) | — | Same dispatch path as QUESTION-01; inherits the fix automatically. |
| Category selection state | Browser (runes `$state` in `voterContext.svelte.ts`) | — | Session-only per D-11; no backend persistence this phase. |
| Category-filtered question blocks derivation | Browser (`questionBlockStore.svelte.ts` via `$derived.by`) | — | Already `$derived.by`; receives `selectedQuestionCategoryIds` as a getter callback. Works correctly IF the input is reactive $state. |
| Candidate question-list reveal after save-state load | Browser (`candidate/(protected)/+layout.svelte` `$effect` → `candidateContext` `$derived`) | Frontend Server (loader provides `candidateUserData`) | Already correct shape after Phase 60. QUESTION-04 is either a race on this path or an orthogonal issue. |
| Playwright E2E regression verification | CI / local | — | Existing Playwright infrastructure from Phase 59/60. |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | 5.53.12 | Runes mode UI + reactivity primitives (`$state`, `$derived`, `$effect`, `$props`, `untrack`) | `[VERIFIED: .yarnrc.yml + node_modules/svelte/package.json]` Already the project's version; runes mode globally enabled via `compilerOptions.runes: true` in `apps/frontend/svelte.config.js`. |
| @sveltejs/kit | 2.x (catalog pin) | Page routes `/questions`, `/questions/category`, `/questions/[questionId]`, `/candidate/questions` | `[VERIFIED: .yarnrc.yml]` Already present. |
| @openvaa/data | workspace | `BooleanQuestion`, `isSingleChoiceQuestion`, `isObjectType`, `OBJECT_TYPE`, `QUESTION_TYPE`, `AnyQuestionVariant` | `[VERIFIED: packages/data/src/index.ts:69,110,121,134]` `BooleanQuestion` already exported; `isBooleanQuestion` type guard is NOT exported — executor must add it or use `isObjectType(q, OBJECT_TYPE.BooleanQuestion)`. |
| svelte/store `fromStore` / `get` / `untrack` | (builtin, Svelte 5) | Store→runes bridge; non-reactive reads; effect-safe mutation | `[VERIFIED: Phase 60 pattern — apps/frontend/src/routes/+layout.svelte:116-133]` Canonical pattern in this codebase for in-effect mutations of `fromStore`-bridged stores. |
| @playwright/test | catalog pin (Phase 60 uses `1.58.x`) | E2E regression gate + `candidate-questions.spec.ts` testId verification | `[VERIFIED: tests/playwright.config.ts + Phase 60 RESEARCH]` Existing infrastructure. |
| vitest | 3.2.4 | Unit tests for any new type-guard / util / helper functions | `[VERIFIED: .yarnrc.yml `vitest: ^3.2.4`]` Existing test framework. |
| daisyUI + Tailwind | 5.5.14 / 4.2.1 | Checkbox (`.checkbox`) + radio (`.radio-primary`) styling | `[VERIFIED: .yarnrc.yml]` Already wired via `@plugin 'daisyui'` in `app.css`. No change this phase. |

**Version verification (as of 2026-04-24):**
- `svelte@5.53.12` — `[VERIFIED: node_modules/svelte/package.json version field]`
- `vitest@3.2.4` — `[VERIFIED: .yarnrc.yml catalog]`
- `daisyui@5.5.14`, `tailwindcss@4.2.1` — `[VERIFIED: .yarnrc.yml catalog]`

### Supporting

| Library / Helper | Purpose | When to Use |
|------------------|---------|-------------|
| `getCustomData` from `@openvaa/app-shared` | Access `question.customData.vertical` / `longText` / `locked` for per-question overrides | Only if planner decides per-question override of Yes/No labels. D-02 locks i18n defaults, so `customData` override is Claude's discretion, not required. |
| `ensureValue(value)` on `BooleanQuestion` | Normalize arbitrary input to `true`/`false`/`null` | When converting `answer.value` before passing to `QuestionChoices` pseudo-choice `selectedId` (the pseudo-choice id must be the string `'yes'`/`'no'`, not a boolean). |
| `QUESTION_TYPE.Boolean` constant | String literal `'boolean'` for type-switch branches | Alternative to `isBooleanQuestion` if guard not added. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Synthesize two pseudo-choices in `OpinionQuestionInput` (D-01) | Build a dedicated `BooleanInput.svelte` component (two big Yes/No buttons) | More visual design work; breaks UI consistency with ordinal/categorical questions; CONTEXT.md deferred it explicitly. |
| `bind:group={localState}` + sync `$effect` (QUESTION-03 fix path A) | Function-binding `bind:group={() => getter, (v) => setter}` (Svelte 5.9+ "functional bindings") | **Rejected:** known Svelte 5 issue (`sveltejs/svelte#16575`) — function-accessor `bind:checked`/`bind:group` is broken for checkboxes. Local `$state` + sync `$effect` is safer. |
| Drop `sessionStorage` entirely (D-11 locked) | Preserve `sessionStorage` persistence | Contradicts D-11. Deferred per CONTEXT.md. |
| Add `isBooleanQuestion` guard to `@openvaa/data` | Inline `isObjectType(q, OBJECT_TYPE.BooleanQuestion)` | The codebase uses both styles (`isObjectType` is used in `QuestionChoices.svelte` line 103). Adding the guard is consistent with the existing guards' shape but touches the data package. **Recommendation:** add the guard — maintains pattern symmetry and is a trivial 8-line addition. |

**Installation:** No new dependencies.

---

## Architecture Patterns

### System Architecture Diagram

```
VOTER FLOW (QUESTION-01, QUESTION-02, QUESTION-03)

  Full page load                  SvelteKit SSR
  page.goto('/questions')         +layout.ts awaits loader data
         │                                │
         ▼                                ▼
  ┌────────────────┐             ┌──────────────────────┐
  │  (voters)      │             │ root +layout.svelte  │
  │  (located)     │             │ (Phase 60 fixed —    │
  │  /questions/   │◀─render─────│ $derived validity,   │
  │  +page.svelte  │             │ provide*Data in      │
  └────────┬───────┘             │ $effect+untrack)     │
           │                     └──────────────────────┘
           │ consumes voterCtx
           ▼
  ┌──────────────────────────────────────────────────────┐
  │ voterContext.svelte.ts                               │
  │                                                       │
  │   _opinionQuestionCategories  $derived.by(data+el+c) │
  │   selectedQuestionCategoryIds [QUESTION-03 target]   │
  │        ↓ (getter/setter via fromStore bridge)        │
  │        ↓ (BUG: bind:group on getter/setter           │
  │        ↓ intermittently fails per Svelte 5 issue)    │
  │   _selectedQuestionBlocks  $derived.by via           │
  │        questionBlockStore({ selectedQuestionCat... })│
  │        .questions.length → counter                   │
  └──────────────────────────────────────────────────────┘
           │
           │ bind:group
           ▼
  <input type="checkbox" bind:group={voterCtx.selectedQuestionCategoryIds}>
           │
           ▼
  {t('questions.intro.start', { numQuestions: ... })}    [counter]


  QUESTION-01 boolean input path (new branch):

  /questions/[questionId]/+page.svelte
           │
           ▼
  OpinionQuestionInput.svelte   [QUESTION-01 target — add branch]
  ┌─────────────────────────────────────────────┐
  │ if isSingleChoiceQuestion(q) → QuestionChoices│
  │ NEW: if isBooleanQuestion(q) → QuestionChoices│
  │      with synthesized choices [yes, no]     │
  │ else → ErrorMessage (fallback)              │
  └─────────────────────────────────────────────┘


  QUESTION-02 match-breakdown path (auto-fixed):

  /results/[entityId]/+page.svelte
           │
           ▼
  EntityOpinions.svelte (dynamic-components)   [no change needed]
           │ iterates over questions
           ▼ mode='display'
  OpinionQuestionInput.svelte (same component)
           │ new boolean branch
           ▼
  QuestionChoices.svelte in 'display' mode
  renders voter Yes/No + candidate Yes/No on 2-point line


CANDIDATE FLOW (QUESTION-04)

  page.goto('/candidate/questions')
           │
           ▼
  ┌──────────────────────────────────────────────┐
  │ candidate/(protected)/+layout.svelte         │
  │   Phase 60 fixed pattern:                    │
  │   - validity $derived.by                     │
  │   - layoutState $derived (4-way enum)        │
  │   - $effect: dr.update(provideQuestionData + │
  │              provideEntityData +             │
  │              provideNominationData);         │
  │              userData.init(...)              │
  └──────────────────────────────────────────────┘
           │ {@render children()}
           ▼
  ┌──────────────────────────────────────────────┐
  │ questions/+page.svelte                       │
  │   const { opinionQuestions, profileComplete, │
  │           questionBlocks, userData,          │
  │           unansweredOpinionQuestions, ... }  │
  │           = getCandidateContext();           │
  │                                               │
  │   let completion = $derived(                 │
  │     unansweredOpinionQuestions.length === 0  │
  │       ? 'full'                               │
  │       : unansweredOpinionQuestions.length    │
  │           === opinionQuestions.length        │
  │         ? 'empty'                            │
  │         : 'partial'                          │
  │   );                                          │
  │                                               │
  │ {#if completion === 'empty' && !answersLocked}│
  │   <Button ... data-testid="candidate-        │
  │              questions-start" />             │
  │ {:else}                                      │
  │   <div data-testid="candidate-questions-list"│
  │ {/if}                                        │
  │                                               │
  │ [QUESTION-04] one of these testIds must be   │
  │ visible within Playwright's 30s timeout.     │
  │ Hypothesis: race between userData.init and   │
  │ unansweredOpinionQuestions $derived reading  │
  │ userData.savedCandidateData.                 │
  └──────────────────────────────────────────────┘
```

### Recommended Project Structure (No Changes)

All Phase 61 edits live in existing files:

```
apps/frontend/src/
├── lib/
│   ├── components/questions/
│   │   ├── OpinionQuestionInput.svelte    [QUESTION-01: add boolean branch]
│   │   ├── QuestionChoices.svelte         [QUESTION-01: accept explicit choices prop + loosen type]
│   │   └── QuestionChoices.type.ts        [QUESTION-01: loosen `question` union to include BooleanQuestion OR add choices prop]
│   ├── contexts/voter/
│   │   └── voterContext.svelte.ts         [QUESTION-03: migrate selectedQuestionCategoryIds to $state]
│   └── contexts/candidate/
│       └── candidateContext.svelte.ts     [QUESTION-04: audit + possible $derived/untrack fixes]
└── routes/
    ├── (voters)/(located)/questions/
    │   ├── +page.svelte                   [QUESTION-03: adapt bind:group to local $state if needed]
    │   └── category/[categoryId]/+page.svelte  [QUESTION-03: inherits fix from voterContext]
    └── candidate/(protected)/questions/
        └── +page.svelte                   [QUESTION-04: possible condition-gate fix]

packages/data/src/
└── utils/typeGuards.ts                    [QUESTION-01: ADD isBooleanQuestion (optional — see Alternatives)]
```

### Pattern 1: Boolean branch in OpinionQuestionInput (QUESTION-01)

**What:** Add a new branch to the type-switch in `OpinionQuestionInput.svelte` for boolean questions. Synthesize two pseudo-choices and delegate to `QuestionChoices`.

**When to use:** This is the ONLY place boolean opinion answering needs to be wired (both `answer` and `display` modes flow through here).

**Canonical shape:**

```svelte
<!-- apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte -->
<script lang="ts">
  import {
    isObjectType,
    isSingleChoiceQuestion,
    OBJECT_TYPE,
    QUESTION_TYPE
  } from '@openvaa/data';
  import { getComponentContext } from '$lib/contexts/component';
  import { logDebugError } from '$lib/utils/logger';
  import QuestionChoices from './QuestionChoices.svelte';
  import ErrorMessage from '../errorMessage/ErrorMessage.svelte';
  import type { Choice } from '@openvaa/data';
  import type { OpinionQuestionInputProps } from './OpinionQuestionInput.type';

  let {
    question,
    mode = 'answer',
    answer = undefined,
    otherAnswer = undefined,
    otherLabel = undefined,
    onChange,
    ...restProps
  }: OpinionQuestionInputProps = $props();

  const { t } = getComponentContext();

  // Derive the boolean pseudo-choices once per render — labels are i18n'd
  const booleanChoices = $derived<Array<Choice>>([
    { id: 'no', label: t('common.answer.no') },
    { id: 'yes', label: t('common.answer.yes') }
  ]);

  // Convert between boolean answer value and pseudo-choice id
  function booleanToChoiceId(v: unknown): string | null {
    if (v === true) return 'yes';
    if (v === false) return 'no';
    return null;
  }
</script>

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
  {:else if isObjectType(question, OBJECT_TYPE.BooleanQuestion)}
    {@const selectedId = booleanToChoiceId(answer?.value)}
    {@const otherSelected = booleanToChoiceId(otherAnswer?.value)}
    <QuestionChoices
      {question}
      choices={booleanChoices}
      {mode}
      {selectedId}
      {otherSelected}
      {otherLabel}
      onChange={onChange
        ? (d) => onChange({ value: d.value === 'yes', question: d.question })
        : undefined}
      {...restProps} />
  {:else}
    <ErrorMessage inline message={t('error.unsupportedQuestion')} class="text-center" />
  {/if}
</div>
```

**Critical detail: `QuestionChoices` type + data expectations**

`QuestionChoices.svelte` currently does:

```svelte
let choices = $derived(question.choices);
```

And its type declares `question: SingleChoiceCategoricalQuestion | SingleChoiceOrdinalQuestion`. For the boolean path, `question.choices` is `undefined` on a `BooleanQuestion` and the type union does not include it. Two approaches:

1. **Add an explicit `choices?` override prop** to `QuestionChoices`. Modify line 87 to:
   ```svelte
   let { question, choices: explicitChoices = undefined, ... }: QuestionChoicesProps = $props();
   let choices = $derived(explicitChoices ?? question.choices);
   ```
   And loosen `QuestionChoicesProps.question` to include `BooleanQuestion` OR accept a new adapter type. Recommended path.

2. **Build an adapter object** in `OpinionQuestionInput` that quacks like a `SingleChoiceOrdinalQuestion` (has `.id`, `.choices`, `.text`). Rejected: too much surface area; leaks UI concerns into a data-shape mock; `QuestionChoices` also calls `question.ensureValue(answer?.value)` through `OpinionQuestionInput`'s single-choice branch (not this new branch, but the adapter would have to implement `ensureValue` too — scope creep).

**Recommendation:** Path 1 (explicit `choices` override + union-widen the question type OR add `| BooleanQuestion` to the type). Planner decides whether to pass `question` (the real BooleanQuestion) + override `choices`, or to restructure the prop signature.

**`showLine` + `variant` defaults:** `QuestionChoices` line 101-109 derives `doShowLine` = `true` for SingleChoiceOrdinal, `false` for SingleChoiceCategorical; `vertical` = `true` for SingleChoiceCategorical OR `customData.vertical`, else `false`. For boolean, the desired UX is the ordinal-style horizontal 2-point line. Executor must either:
- Pass `showLine={true}` + `variant="horizontal"` explicitly from the boolean branch, OR
- Extend `QuestionChoices`'s default logic to treat `OBJECT_TYPE.BooleanQuestion` like `OBJECT_TYPE.SingleChoiceOrdinalQuestion` for these defaults.

Planner's call; explicit props in the caller is less invasive.

**Sources:**
- `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte:60-74` (current state)
- `apps/frontend/src/lib/components/questions/QuestionChoices.svelte:87,101-109,237-274` (reference consumer)
- `apps/frontend/src/lib/i18n/translations/en/common.json:6-9` (existing i18n keys)

### Pattern 2: Session-only reactive state via `$state` (QUESTION-03)

**What:** Replace the `sessionStorageWritable` + `fromStore` + getter/setter pattern with a pure `$state<Array<Id>>`, initialized lazily on mount, exposed as a plain context property.

**When to use:** The selection state is per-session (D-11 locked) and participates in `bind:group` from a child page.

**Canonical shape (in `voterContext.svelte.ts`):**

```typescript
// BEFORE (current, lines 144-145, 242, 299-304):
const _selectedQuestionCategoryIds = sessionStorageWritable('voterContext-selectedCategoryIds', new Array<Id>());
const selectedQuestionCategoryIdsState = fromStore(_selectedQuestionCategoryIds);
// ...
_selectedQuestionCategoryIds.set([]);
// ...
get selectedQuestionCategoryIds() { return selectedQuestionCategoryIdsState.current; },
set selectedQuestionCategoryIds(v) { _selectedQuestionCategoryIds.set(v); }

// AFTER:
let _selectedQuestionCategoryIds = $state<Array<Id>>([]);
// Seed defaults once the opinion categories are available. Uses $effect (not
// $effect.pre — we only want to seed on a fresh session, not on every category
// list change). Key: guard with a 'hasSeeded' flag so user de-selects don't get
// overwritten.
let hasSeededCategorySelection = $state(false);
$effect(() => {
  if (hasSeededCategorySelection) return;
  const cats = _opinionQuestionCategories.value;
  if (cats.length === 0) return;
  // Seed default: all checked
  _selectedQuestionCategoryIds = cats.map((c) => c.id);
  hasSeededCategorySelection = true;
});
// ...
function resetVoterData(): void {
  answers.reset();
  _firstQuestionId.set(null);
  _selectedQuestionCategoryIds = [];
  hasSeededCategorySelection = false;  // re-seed on next render
}
// ...
get selectedQuestionCategoryIds() { return _selectedQuestionCategoryIds; },
set selectedQuestionCategoryIds(v) { _selectedQuestionCategoryIds = v; }
```

**Why this works:**

1. **No sessionStorage:** Matches D-11 ("session-only in-memory `$state`").
2. **No `fromStore` bridge:** Eliminates the Svelte 5 getter/setter-on-store-bridge edge case that causes the `bind:group`-on-accessor fragility.
3. **Default initialization inside the context:** Moves the onMount default-seeding out of the page (currently `/questions/+page.svelte` lines 49-69) and into the context itself, so the counter is never transiently 0 on first paint when categories exist.
4. **`$derived` chain continues to flow:** `questionBlockStore.svelte.ts` receives `() => selectedQuestionCategoryIdsState.current` today. Post-fix it receives `() => _selectedQuestionCategoryIds`. Same shape; the rune-tracked `$state` array re-triggers the downstream `$derived.by` on every write.

**Important behavioral nuance: the page's onMount ALSO writes to this state (lines 49-69):**

```svelte
onMount(() => {
  voterCtx.firstQuestionId = null;
  // Check that the selected categories are still available (because they might be
  // specific to the election and constituency)
  voterCtx.selectedQuestionCategoryIds = voterCtx.selectedQuestionCategoryIds.filter((id) =>
    opinionQuestionCategories.find((c) => c.id === id)
  );
  // Preselect all if there's no selection yet
  if (voterCtx.selectedQuestionCategoryIds.length === 0)
    voterCtx.selectedQuestionCategoryIds = opinionQuestionCategories.map((c) => c.id);
  ...
});
```

This does TWO things: (a) filters stale IDs (holdovers from a previous election/constituency), and (b) seeds defaults. Post-fix, the **context-level seeding handles (b)** and the page's `onMount` still handles (a) — but with ONE change: the page's `onMount` must handle the case where the context has already seeded (common path) AND where it hasn't yet. The filter-stale logic stays in the page (it's a navigation-context cleanup, not a session-default-seeding concern). Planner should verify this split during diagnosis.

**Alternative simpler approach (planner's discretion):** Keep ALL seeding in the page's `onMount`, just migrate the context to pure `$state` (drop sessionStorage + fromStore). The getter/setter context API stays, but `bind:group` now binds to a `$state` getter/setter accessor where the setter is a direct `=` assignment — this is better than bind:group on a store-bridge because there's no fromStore/toStore round-trip or sessionStorage subscribe callback in the write path.

**Which approach is "right"?** Both work. Approach 1 (context-level seeding) is more robust — the default is guaranteed regardless of which page mounts first. Approach 2 (page-level seeding) is closer to the status quo. Recommend Approach 1 for robustness; Approach 2 is acceptable if planner judges Approach 1 too invasive.

**Sources:**
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:144-145,242,299-304` (current state)
- `apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte:49-69,126,158` (consumer + default-seeding site)
- `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts:62-79` (the sessionStorageWritable implementation being dropped)
- `apps/frontend/src/lib/contexts/utils/questionBlockStore.svelte.ts:15-70` (downstream `$derived.by` — no change needed)
- Phase 60 pattern: `apps/frontend/src/routes/+layout.svelte:116-133` (`get(store) + untrack(() => ...)` — apply if effect-mutation is required)

### Pattern 3: Diagnostic-first approach for QUESTION-04

**What:** QUESTION-04 is classified as a hypothesis, not a known fix. Before committing to code changes, add runtime tracing, run the failing spec, then decide.

**Why:** The candidate-questions testId timeout could have multiple root causes:
- **Hypothesis A (reactivity):** `unansweredOpinionQuestions` `$derived` evaluates to the wrong value before `userData.init` completes → `completion === 'empty'` branch is wrong → only `candidate-questions-start` should be visible but isn't, or vice versa.
- **Hypothesis B (data provision timing):** `opinionQuestions` (from `_opinionQuestions.value`) is empty because `provideQuestionData` hasn't been called yet by the layout's `$effect` at the time the page renders, causing `completion` to be `'full'` (since `0 === 0`), so neither testId appears for the expected state.
- **Hypothesis C (conditional render race):** The page uses `{#if completion === 'empty' && !answersLocked}` for `candidate-questions-start` vs `{:else}` for `candidate-questions-list` — the testIds are MUTUALLY EXCLUSIVE. If `completion` transitions after first paint, one testId appears, then flickers to the other. Playwright's `.or()` should handle this, BUT if NEITHER branch of the if/else paints during the test window (e.g., because the parent layout renders `<Loading>` for the full window), the timeout fires.
- **Hypothesis D (stale testIds):** Someone renamed the testIds in the page but didn't update `testIds.ts` (or vice versa). **Already refuted:** grep confirms `data-testid="candidate-questions-list"` at `candidate/(protected)/questions/+page.svelte:139` and `data-testid="candidate-questions-start"` at `:109`, matching `testIds.ts:31-32`.

**Canonical diagnosis steps (before touching code):**

1. Run the failing spec locally with Playwright trace:
   ```bash
   yarn playwright test -c ./tests/playwright.config.ts \
     tests/tests/specs/candidate/candidate-questions.spec.ts \
     --workers=1 --trace=on
   ```
2. Inspect the trace to determine which layout-state branch renders and stays — Loading, error, terms, or ready.
3. If layout reaches `ready` but testIds still don't appear: inspect the page's `completion` value and which `{#if}` branch rendered.
4. If layout never reaches `ready`: QUESTION-04 is actually still LAYOUT-02 class — escalate.
5. Based on findings, pick the fix pattern:
   - **If Hypothesis A:** Same fix as QUESTION-03 — migrate any `fromStore`-bridged or `$:`-legacy state in `candidateContext.svelte.ts`, apply `get()+untrack()` if needed.
   - **If Hypothesis B:** Add an explicit readiness `$derived` on the page that gates rendering until `opinionQuestions.length > 0 || userData.savedCandidateData != null`.
   - **If Hypothesis C:** No code change needed; may just need spec-side `await expect(...).toBeVisible({ timeout: 15000 })` relaxation. Planner escalates to spec change.
   - **If Hypothesis D:** (refuted) — move on.

**Sources:**
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:268-282` (the `unansweredOpinionQuestions` + `profileComplete` $derived)
- `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:49-55,97-201` (the completion enum + testId branches)
- `apps/frontend/src/routes/candidate/(protected)/+layout.svelte:115-136` (parent `$effect` that calls `userData.init`)
- `tests/tests/specs/candidate/candidate-questions.spec.ts:27-47` (the direct failing test assertion)
- `tests/tests/utils/testIds.ts:31-32` (testId constants)

### Anti-Patterns to Avoid

- **Do NOT put async logic in the boolean branch.** The pseudo-choice id mapping (`'yes' ↔ true`, `'no' ↔ false`) is synchronous; keep it so.
- **Do NOT hand-roll a new radio group for boolean.** Reuse `QuestionChoices` per D-01. Anti-pattern: dedicated `<BooleanInput>` component — deferred per CONTEXT.
- **Do NOT try `bind:group={() => getter, (v) => setter}` function-binding.** Known broken in Svelte 5 for checkboxes (see Pitfall 1). Local `$state` + sync is safer.
- **Do NOT modify `@openvaa/matching` or `@openvaa/data/src/objects/questions/variants/booleanQuestion.ts`.** Phase 61 is purely UI-layer per D-05.
- **Do NOT rename or relocate the testIds `candidate-questions-list`, `candidate-questions-start`, `voter-questions-category-list`, `voter-questions-category-checkbox`, `voter-questions-start`, `opinion-question-input`, `question-choices`, `question-choice`.** Playwright specs depend on these exact strings — see UI-SPEC Component Inventory.
- **Do NOT mutate `_selectedQuestionCategoryIds` inside a `$effect` that ALSO reads from it.** If the seeding logic does this (it will — see Pattern 2), the default-seed must be guarded with a `hasSeededCategorySelection` flag or use the Phase 60 `get(store) + untrack(() => store.update(...))` idiom to avoid `effect_update_depth_exceeded`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Boolean answer UI (yes/no radio group) | Custom two-button component | `QuestionChoices.svelte` with synthesized pseudo-choices (Pattern 1) | Established keyboard UX (arrow-key navigation, Space/Enter submit, onKeyboardFocusOut), accessibility (fieldset + sr-only legend), selection state, click/keyboard event dispatch, entity-comparison display mode — all already implemented and battle-tested. |
| Type guard for boolean questions | `question.type === 'boolean'` ad-hoc string checks | `isBooleanQuestion(q)` helper (NEW — add to `@openvaa/data/src/utils/typeGuards.ts`) OR existing `isObjectType(q, OBJECT_TYPE.BooleanQuestion)` | Codebase convention — `isSingleChoiceQuestion`, `isMultipleChoiceQuestion` etc. are the consistent way. String comparison is an anti-pattern in this repo. |
| Session-only state storage | `sessionStorage` wiring + manual subscribe/save | Pure `$state` per D-11 | D-11 explicitly locks session-only; `$state` does this for free. The existing `sessionStorageWritable` is actually the bug site (it introduces the `fromStore` bridge that breaks `bind:group`). |
| SSR→hydration reactivity for loader data | `$effect` + `Promise.all().then()` | `$derived.by` on already-resolved loader data (Phase 60 pattern, already applied to layouts) | Not re-relevant for Phase 61 (no loader work), but if any part of the fix touches loader data, reuse Phase 60's idiom. |
| Bind:group to context getter/setter | Function-binding `bind:property={get, set}` syntax (Svelte 5.9+) | Local `$state` + sync `$effect` OR `$state` directly on context | Known Svelte 5 issue (`sveltejs/svelte#16575`) — function-accessor `bind:checked`/`bind:group` is broken for checkboxes. |
| Test-fixture for the candidate-questions Playwright fail | Mock out the entire candidate context | Use the existing pre-authenticated `storageState` (via `auth-setup` fixture, already present in `tests/tests/fixtures/`) | Existing E2E infrastructure handles seed + login. |

**Key insight:** Every existing primitive in this codebase is battle-tested. The bugs Phase 61 fixes are all "lost intent" — someone wrote something plausible that doesn't survive Svelte 5's reactivity rules. The fix is to match established patterns (Phase 60's `$derived`+`$effect` split, `QuestionChoices`'s grid, `@openvaa/data`'s type-guard idiom), not invent new ones.

---

## Runtime State Inventory

> This phase is primarily a UI reactivity + dispatch fix, not a rename/refactor. The categories below are included for completeness but most yield "None".

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `sessionStorage['voterContext-selectedCategoryIds']` — a serialized array of category IDs persisted by the current `sessionStorageWritable` implementation | **None (code-only change):** Per D-11 the persistence is being dropped. Any stale entries in a user's sessionStorage become no-op dead data — harmless; Svelte will ignore them after the migration. Optional: one-time cleanup via `sessionStorage.removeItem('voterContext-selectedCategoryIds')` in an `onMount` during a transition release, but not required. |
| Live service config | None — no external services (Supabase, Datadog, Cloudflare, etc.) carry category-selection state | None |
| OS-registered state | None | None |
| Secrets/env vars | None — neither i18n keys nor testIds are secrets; no env-var changes | None |
| Build artifacts | None — Phase 61 touches only `.svelte`/`.svelte.ts`/`.ts` source; no `package.json` exports change unless planner decides to add `isBooleanQuestion` to `@openvaa/data` exports (in which case `packages/data` must be rebuilt before downstream frontend consumes it — `yarn build --filter=@openvaa/data`). | Planner: if adding `isBooleanQuestion` guard, document the rebuild step in the plan. |

**Nothing found in category:** Verified — no registry, task scheduler, cron, or third-party hook references the category-selection or boolean-question state.

---

## Common Pitfalls

### Pitfall 1: `bind:group` on a getter/setter context property fails intermittently in Svelte 5

**What goes wrong:** The page template `<input type="checkbox" bind:group={voterCtx.selectedQuestionCategoryIds}>` looks correct — it reads the getter to populate initial checked state and writes via the setter on toggle. But in Svelte 5 with getter/setter accessors backed by a store bridge (`fromStore`), `bind:group` writes can fail to toggle reliably: clicking a checkbox may reset the group array to `[value]` (overwriting existing selections) instead of toggling `value` in/out.

**Why it happens:** Svelte 5's `bind:group` compiler output calls the setter with the new array; when the setter is a bridge like `_selectedQuestionCategoryIds.set(v)` (that invokes the store's `toStore()` writer, which triggers a `saveItemToStorage` subscribe callback, which synchronously re-reads the array), there's a subtle re-entry that can produce stale writes. Compounded with `onMount`-timed defaults (see `/questions/+page.svelte` lines 49-69), the observed symptom is "sometimes works, sometimes doesn't" — matching the todo's description exactly.

**How to avoid:** Migrate to local `$state` per Pattern 2. Drop the `fromStore` bridge in the write path. Or: if planner wants to minimize context-layer changes, keep the page-level `bind:group`-to-local-`$state` pattern and sync to the context in an `$effect`.

**Warning signs:**
- "Sometimes works, sometimes doesn't" symptom on a checkbox group.
- The bound variable is a context getter/setter accessor, not a local `$state`.
- The accessor's setter ultimately calls `.set()` on a writable store (directly or via `toStore`).
- The counter/derivation downstream of the bound state reads stale values.

**Sources (LOW–MEDIUM confidence — pattern is documented but exact Svelte 5 version that introduced the behavior is unclear):**
- `[CITED: https://github.com/sveltejs/svelte/issues/14617]` Feature request explicitly rejecting `bind:` with getter/setter objects
- `[CITED: https://github.com/sveltejs/svelte/issues/16575]` Function-accessor `bind:checked` broken for checkboxes (related class)
- `[CITED: https://github.com/sveltejs/svelte/issues/10072]` `bind:value` not working on checkbox but works on text — same "bind ignored" class
- `[ASSUMED]` Getter/setter on an object property exhibits similar behavior to function-bindings; the rejection rationale in #14617 explicitly contrasts with supported `bind:property={get, set}` functional syntax (5.9+). The exact failure mode for the OpenVAA pattern is not reproduced in a published issue — this is the most likely explanation based on repo evidence (the `bind:group`-on-accessor is uniquely the only one of 12 `bind:group` usages that targets a context accessor, and is the only one exhibiting the reported symptom).

### Pitfall 2: Svelte 5 `effect_update_depth_exceeded` when writing a store from inside an `$effect` that auto-subscribes to it

**What goes wrong:** Writing `_selectedQuestionCategoryIds = [...]` inside an `$effect` that ALSO reads `_selectedQuestionCategoryIds` causes `effect_update_depth_exceeded`. Even worse: writing `store.update(...)` inside an `$effect` that has `const state = fromStore(store)` in scope — the `fromStore` auto-subscription tracks `store` as a dependency, `store.update()` notifies subscribers, retriggering the effect.

**Why it happens:** Documented in Phase 60 Plan 60-03 Task 2 (see `.planning/phases/60-layout-runes-migration-hydration-fix/60-RESEARCH.md` §Common Pitfalls). The cycle is: effect reads → fromStore subscribes → store writes → subscribers notified → version++ → $state re-runs → effect re-runs.

**How to avoid (Phase 60 pattern, already proven):**
```svelte
$effect(() => {
  // Read inputs inside tracked scope
  const snapshot = { ... };
  // Apply mutations inside untrack, use get() instead of auto-subscription
  untrack(() => {
    const dr = get(dataRootStore);
    dr.update(() => { ... });
  });
});
```

**Warning signs:**
- `effect_update_depth_exceeded` in browser console.
- `$effect` mutates a store that is also `fromStore`-bridged elsewhere in scope.
- `$state` write happens inside an effect that reads the same `$state`.

**Sources:**
- `[VERIFIED: apps/frontend/src/routes/+layout.svelte:116-133]` canonical fix pattern in this codebase
- `[VERIFIED: .planning/phases/60-layout-runes-migration-hydration-fix/60-RESEARCH.md]` Phase 60 full analysis
- `[CITED: https://svelte.dev/docs/svelte/v5-migration-guide]` Svelte 5 reactivity primitives docs

### Pitfall 3: Boolean answer value flows as `true`/`false`, not `'yes'`/`'no'`

**What goes wrong:** Synthesized pseudo-choices use string IDs `'yes'` and `'no'`, but the underlying answer must be stored as `true`/`false` (matching `BooleanQuestion._ensureValue = ensureBoolean`). If the `OpinionQuestionInput` boolean branch passes `d.value` (the string `'yes'`/`'no'`) directly to `onChange`, downstream code breaks because `BooleanQuestion.ensureValue('yes')` returns `null` (ensureBoolean only accepts booleans and common stringy-booleans; on first check it does accept `'yes'`, but behavior is implementation-dependent — verify before shipping).

**How to avoid:** In the `OpinionQuestionInput` boolean branch, map the pseudo-choice id back to boolean before calling the parent `onChange`:

```ts
onChange={onChange
  ? (d) => onChange({ value: d.value === 'yes', question: d.question })
  : undefined}
```

And symmetrically, in the display/answer paths, map the stored boolean to a pseudo-choice id:

```ts
{@const selectedId = booleanToChoiceId(answer?.value)}
```

**Warning signs:**
- Answer value gets stored as `'yes'` string in the database instead of boolean.
- Matching algorithm treats the boolean question as missing (because `_normalizeValue('yes')` returns MISSING_VALUE).
- Candidate result-detail display shows no voter marker because `booleanQuestion.ensureValue('yes')` doesn't return `true`.

**Sources:**
- `[VERIFIED: packages/data/src/objects/questions/variants/booleanQuestion.ts:21-23]` `_ensureValue = ensureBoolean`
- `[VERIFIED: packages/data/src/utils/ensureValue.ts]` `ensureBoolean` definition (planner to read — not read inline in this research pass)

### Pitfall 4: Candidate-questions testId timeout is NOT necessarily a reactivity bug

**What goes wrong:** The hypothesis that QUESTION-04 is "same reactivity class as QUESTION-03" may be incorrect. If the root cause is (a) the parent layout `<Loading>` state, (b) a race on `userData.savedCandidateData`, or (c) something else entirely, applying the Pattern-2 fix doesn't help and wastes a plan cycle.

**Why it happens:** Phase 60 diagnosed the parent candidate-protected layout but did not diagnose the candidate-questions page specifically. Phase 60's parity gate surfaced the testId timeout as a residual after the layout fix. Static code review (done in this research pass) shows `candidateContext.svelte.ts` already uses `$derived` throughout with no obvious leftover `$:` or `$effect`-write-state patterns.

**How to avoid:** Run the Playwright trace first (Pattern 3), only then commit to a fix. Planner should structure QUESTION-04 as a diagnosis-first plan with the coding branch contingent on the trace.

**Warning signs:**
- "Should be the same pattern as QUESTION-03" without empirical validation.
- No trace or log captured before coding.

### Pitfall 5: i18n key parity regression

**What goes wrong:** If executor adds a new i18n key for boolean labels instead of using the existing `common.answer.yes` / `common.answer.no`, the new keys must be added to all 4 supported locales (`en`, `fi`, `sv`, `da`) or i18n tests fail.

**How to avoid:** Use the EXISTING keys. Verified present in all 4 locales (en: "Yes"/"No", fi: "Kyllä"/"Ei", sv: "Ja"/"Nej", da: "Ja"/"Nej"). The UI-SPEC locks this.

**Warning signs:**
- New `common.yes`/`common.no` or `boolean.yes`/`boolean.no` keys appear in en/common.json.
- `yarn test:unit` → i18n translations test fails due to missing key in fi/sv/da.

**Sources:**
- `[VERIFIED]` grep on `apps/frontend/src/lib/i18n/translations/{en,fi,sv,da}/common.json` — `answer.yes` / `answer.no` present in all 4.

### Pitfall 6: The candidate-questions page tests depend on the pre-authenticated fixture AND on a seeded candidate who has SOME answers

**What goes wrong:** The Playwright spec's `beforeEach` calls `candidateQuestionsPage.expandAllCategories()` — this only works if the partial/full branch renders (i.e., `completion !== 'empty'`). If the seeded `mock.candidate.2@openvaa.org` user has 0 answers, the spec expects the `candidate-questions-start` testId; if they have some answers, it expects `candidate-questions-list`. Both are valid — the spec uses `.or(...)`:

```ts
await expect(questionsList.or(startButton)).toBeVisible();
```

**How to avoid:** Verify the seed (`mock.candidate.2@openvaa.org`) has the expected answer state. Phase 59's e2e template should lock this, but planner should confirm during verification.

**Warning signs:**
- Test fails with a specific testId not visible, but the "other one" WAS visible — means the seed's answer state doesn't match the spec's expectation.

**Sources:**
- `[VERIFIED: tests/tests/specs/candidate/candidate-questions.spec.ts:27-47]`
- `[VERIFIED: tests/tests/utils/testIds.ts]`

---

## Code Examples

### Example 1: `isBooleanQuestion` type guard (new addition to `@openvaa/data`)

```typescript
// packages/data/src/utils/typeGuards.ts — ADD after isSingleChoiceQuestion:

/**
 * Check if an object is a `BooleanQuestion`.
 */
export function isBooleanQuestion(obj: unknown): obj is BooleanQuestion {
  return isDataObject(obj) && obj.objectType === OBJECT_TYPE.BooleanQuestion;
}
```

Also:
- Import `BooleanQuestion` type in `typeGuards.ts` imports (line 2-12).
- Export `isBooleanQuestion` from `packages/data/src/index.ts` (alphabetically next to `isChoiceQuestion`).
- Rebuild `@openvaa/data` before frontend consumes: `yarn build --filter=@openvaa/data`.

**Source pattern:** `[VERIFIED: packages/data/src/utils/typeGuards.ts:52-60]` — `isSingleChoiceQuestion` shape mirrored exactly.

### Example 2: Boolean branch in OpinionQuestionInput (full reference)

See Pattern 1 above — canonical shape for the `OpinionQuestionInput.svelte` refactor, including the boolean-to-choice-id mapping helpers.

### Example 3: Phase 60's `get() + untrack()` pattern (reference, apply where relevant)

```svelte
<!-- From apps/frontend/src/routes/+layout.svelte:116-133 (VERIFIED) -->
$effect(() => {
  if ('error' in validity) return;
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

Apply the same shape if the QUESTION-03 or QUESTION-04 fix requires writing a store (or invoking a method that notifies subscribers) from inside an `$effect`.

### Example 4: Recommended refactor for the /questions/+page.svelte onMount

If Pattern 2 Approach 1 (context-level seeding) is adopted, the page's `onMount` can simplify:

```svelte
<!-- BEFORE (current, lines 49-69): -->
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

<!-- AFTER (context handles defaults; page only filters stale + redirects): -->
onMount(() => {
  voterCtx.firstQuestionId = null;
  // Filter stale IDs that no longer apply to the current election/constituency
  const filtered = voterCtx.selectedQuestionCategoryIds.filter((id) =>
    opinionQuestionCategories.find((c) => c.id === id)
  );
  if (filtered.length !== voterCtx.selectedQuestionCategoryIds.length) {
    voterCtx.selectedQuestionCategoryIds = filtered;
  }
  // No need to seed defaults here — context does it
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

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `export let prop` + `$:` reactive statements | `$props()` + `$derived` + `$effect` | Svelte 5 (project migrated throughout v2.4-v2.6) | All new code must be runes. Phase 60 closed out layouts. |
| `$effect + Promise.all().then()` on SvelteKit loaders | `$derived.by` on already-awaited loader data | Phase 60 | Layouts use the new pattern. Not directly Phase 61 scope. |
| `$storeName.update(...)` inside `$effect` | `get(store)` + `untrack(() => store.update(...))` | Phase 60 | Any in-effect store mutation — reuse in Phase 61 if needed. |
| `sessionStorageWritable` + `fromStore` bridge for session state | Pure `$state` (for session-only per D-11) | Phase 61 (this phase) | Eliminates the `bind:group` fragility on getter/setter accessors. |
| `<svelte:component this={Component} {...props} />` | `{@const Component = …}` + `<Component {...props} />` | Phase 60 | Applied in root `+layout.svelte`. Not Phase 61 scope but reuse where relevant. |

**Deprecated/outdated:**
- `<slot />` — fully replaced with `{@render children()}` in Svelte 5 runes.
- `$:` reactive statements — replaced with `$derived` / `$effect`.
- `export let` — replaced with `$props()` destructure.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `bind:group` on a getter/setter context property backed by `fromStore(sessionStorageWritable(...))` is the direct cause of QUESTION-03's intermittent-0-counter symptom. | Summary, Pitfall 1, Pattern 2 | Executor's fix may not resolve the intermittent symptom if the true root cause is something else (e.g., the `onMount` timing alone, independent of the binding path). Mitigation: Planner should add a runtime diagnostic step (Pattern 3-style) — enable dev mode with browser devtools, add a `$inspect(_selectedQuestionCategoryIds)` trace, and verify the state trajectory matches the hypothesis before coding. |
| A2 | `candidateContext.svelte.ts` has no latent reactivity break. | Summary, QUESTION-04 hypothesis C | If there IS a latent reactivity break that didn't surface in static review, the hypothesis (race on `userData.savedCandidateData`) is wrong, and the fix pattern differs. Mitigation: Pattern 3 diagnostic step before coding. |
| A3 | `QuestionChoices.svelte` can accept a `choices` prop override without breaking existing ordinal/categorical callers. | Pattern 1 "Critical detail" | If the type-check or ordering logic inside `QuestionChoices` depends on `question.choices` identity (vs value), the override may desync. Mitigation: Planner runs the full voter-app E2E parity gate after the change, not just the boolean path. |
| A4 | `BooleanQuestion.ensureValue` returns the correct boolean coercion for `true`, `false`, and `null` (but NOT for strings `'yes'`/`'no'`). | Pitfall 3 | If `ensureValue('yes')` happens to return `true` (some permissive coercion), the pseudo-choice-id-to-boolean mapping becomes unnecessary but also harmless. Mitigation: Planner reads `packages/data/src/utils/ensureValue.ts` before writing the boolean branch — I did not inline-verify the `ensureBoolean` source in this research pass. |
| A5 | The 6 direct + 18 cascade failures from Phase 60's candidate-questions handoff all have the same root cause (testId visibility). | QUESTION-04 hypothesis | If different tests fail for different reasons, fixing the testId race only clears a subset; cascade tests may still fail. Mitigation: Planner runs the full spec after fix and documents residuals. |
| A6 | Adding `isBooleanQuestion` to `@openvaa/data/src/utils/typeGuards.ts` does not require a `packages/data` version bump (since the package is workspace-internal and published via `workspace:^`). | Pattern 1, Example 1 | If the package is published externally or has consumers outside the monorepo, a version bump is needed. Mitigation: planner checks `@openvaa/data`'s `package.json` version + publishing status — per CLAUDE.md Future, trusted publishing is deferred; internal `workspace:^` consumers don't need a bump. |
| A7 | The 4 supported locales are the only locales requiring i18n parity (en/fi/sv/da). | Pitfall 5 | If additional locales (et, fr, lb) are expected to be "complete" for release, and they currently lack `common.answer.yes`/`.no`, the boolean branch renders `common.answer.yes` as the fallback key string. Mitigation: grep showed `answer.yes`/`.no` present in the 4 `staticSettings.supportedLocales`; the `et/fr/lb` folders exist but are out of scope. Verified by reading `packages/app-shared/src/settings/staticSettings.ts`. |

**If any of A1 / A2 / A5 prove wrong during execution, the planner should split the affected plan into a diagnosis pass + a code pass.**

---

## Open Questions

1. **Should the boolean pseudo-choice id be `'yes'`/`'no'` (strings) or use a different scheme?**
   - What we know: Pseudo-choice ids must be `Id` type (from `@openvaa/core`, usually `string`); `'yes'`/`'no'` are simple and human-readable in devtools.
   - What's unclear: Potential conflict if a real choice question somewhere has choices `'yes'`/`'no'` as ids (should be isolated per-question though).
   - Recommendation: Use `'yes'`/`'no'`. Executor documents the mapping in an inline comment in the new boolean branch.

2. **Should the QUESTION-03 fix be approach 1 (context-level seeding) or approach 2 (page-level seeding, context becomes plain `$state`)?**
   - What we know: Both work; approach 1 is more robust.
   - What's unclear: Whether there are OTHER consumers of `voterContext.selectedQuestionCategoryIds` that would regress if the context-level default suddenly appeared.
   - Recommendation: Planner picks approach 1 unless discovery finds another consumer that depends on the `[]` initial value.

3. **Is QUESTION-04 actually a reactivity bug, or something else?**
   - What we know: Static review didn't surface an obvious reactivity break in `candidateContext.svelte.ts`. 6 direct + 18 cascade failures exist.
   - What's unclear: Whether the failure is a race on `userData.init`, a stale `$derived`, a spec-timing flake, or something structural.
   - Recommendation: First plan for QUESTION-04 MUST be diagnosis, not code. Trace the spec, capture layoutState + completion values, then decide.

4. **Should `isBooleanQuestion` be added to the data package, or should the frontend use `isObjectType(q, OBJECT_TYPE.BooleanQuestion)` inline?**
   - What we know: Both are valid; existing codebase uses both styles.
   - What's unclear: Whether adding the guard is a "small polish" (preferred) or "scope creep" (rejected per CLAUDE.md YAGNI).
   - Recommendation: Add it. Trivial, aligns with existing guards, makes the callsite self-documenting.

5. **Does the fix for QUESTION-03 regress the candidate flow if `_selectedQuestionCategoryIds` is voter-only?**
   - What we know: `selectedQuestionCategoryIds` exists only on `voterContext`, not `candidateContext`. Different contexts.
   - What's unclear: Nothing — verified by reading both contexts.
   - Recommendation: No action needed. Captured here to pre-empt planner confusion.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node >=22 | Build/runtime/tests | ✓ | node_modules present | — |
| yarn 4 workspaces | Package builds | ✓ | — | — |
| Supabase (local) | `yarn dev` + E2E via `yarn dev` + `yarn test:e2e` | ✓ (assumed — project standard) | — | E2E tests can use CI Supabase |
| Playwright | E2E regression | ✓ | from catalog pin | — |
| Vitest | Unit tests for new type-guard | ✓ | 3.2.4 | — |
| Turborepo | Build orchestration | ✓ | 2.8.17 | — |

**Missing dependencies:** None blocking.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Unit Framework | vitest 3.2.4 (`[VERIFIED: .yarnrc.yml]`) |
| Unit Config file | `apps/frontend/vitest.config.ts` + `packages/data/vitest.config.ts` etc. |
| Unit Quick run command | `yarn workspace @openvaa/frontend test:unit` (scopes to frontend); `yarn test:unit` (all packages) |
| Unit Full suite command | `yarn test:unit` |
| E2E Framework | @playwright/test (catalog pin) |
| E2E Config file | `tests/playwright.config.ts` |
| E2E Quick run command | `yarn playwright test -c ./tests/playwright.config.ts tests/tests/specs/candidate/candidate-questions.spec.ts --workers=1` |
| E2E Full suite command | `yarn test:e2e` (requires `yarn dev` running) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QUESTION-01 | Boolean question renders a radio group (Yes/No) on `/questions/[questionId]`; voter can click Yes and advance | e2e (extend existing voter spec or add new spec) | `yarn playwright test -c ./tests/playwright.config.ts tests/tests/specs/voter/voter-questions.spec.ts --workers=1` | ⚠ Existing voter spec exists — planner verifies coverage for boolean type; may add new test case |
| QUESTION-01 | `isBooleanQuestion` returns `true` for `BooleanQuestion` instances and `false` for others | unit (in `@openvaa/data`) | `yarn workspace @openvaa/data test:unit` | ❌ Wave 0 — add new test to `packages/data/src/utils/typeGuards.test.ts` if adding the guard |
| QUESTION-01 | `OpinionQuestionInput` renders `<QuestionChoices>` with Yes/No pseudo-choices when given a `BooleanQuestion` | unit (frontend, component test — if planner commits to it; may instead rely on E2E) | `yarn workspace @openvaa/frontend test:unit` | ❌ No existing OpinionQuestionInput unit test; may skip in favor of E2E coverage |
| QUESTION-02 | Candidate result-detail renders without error when voter has answered a boolean question | e2e | `yarn playwright test -c ./tests/playwright.config.ts tests/tests/specs/voter/voter-results.spec.ts --workers=1` | ⚠ Planner verifies coverage — may extend `voter-results.spec.ts` or add a dedicated result-detail boolean test |
| QUESTION-03 | Fresh session at `/questions` with `allowCategorySelection=true` shows counter `>0` (not "Answer 0 Questions") on first paint AND updates on every toggle | e2e | `yarn playwright test -c ./tests/playwright.config.ts tests/tests/specs/voter/voter-questions.spec.ts --workers=1` | ⚠ May require new test scenario; check existing voter-questions coverage |
| QUESTION-03 | `questionBlockStore` filters to only `opinionQuestionCategories` whose IDs are in `selectedQuestionCategoryIds` — existing test should still pass after context refactor | unit | `yarn workspace @openvaa/frontend test:unit` | ⚠ Verify no existing tests against `questionBlockStore` break |
| QUESTION-04 | `candidate-questions-list` OR `candidate-questions-start` testId is visible within Playwright's default timeout on `/candidate/questions` | e2e (existing spec) | `yarn playwright test -c ./tests/playwright.config.ts tests/tests/specs/candidate/candidate-questions.spec.ts --workers=1` | ✅ EXISTING — this is the spec that's currently failing (6 direct tests) |
| QUESTION-04 | The 18 cascade tests in candidate-app-mutation / candidate-app-settings / candidate-app-password / re-auth-setup run and pass | e2e | `yarn test:e2e` (full suite) | ✅ EXISTING cascade tests |

### Sampling Rate

- **Per task commit:** `yarn workspace @openvaa/frontend test:unit` (fast; scoped to frontend) OR `yarn workspace @openvaa/data test:unit` if touching data package.
- **Per wave merge:** `yarn test:unit` (all packages); + targeted Playwright spec (e.g., candidate-questions, voter-questions).
- **Phase gate:** Full E2E suite green (`yarn test:e2e` — requires `yarn dev` + Supabase running); parity gate vs post-Phase 60 baseline (whatever the Phase 60 merge SHA is).

### Wave 0 Gaps

- [ ] `packages/data/src/utils/typeGuards.test.ts` — extend with `isBooleanQuestion` test case (if adding the guard — see A6).
- [ ] (optional) `apps/frontend/src/lib/components/questions/OpinionQuestionInput.test.ts` — new unit test file; mocks `BooleanQuestion` and asserts the rendered choices include Yes/No with correct ids. Likely NOT required (E2E covers the behavior); planner decides.
- [ ] Diagnose whether existing voter-questions E2E coverage already exercises the boolean type (the default seed has 1 boolean question at question index 23). If not, add a test case. — planner inspects `tests/tests/specs/voter/voter-questions.spec.ts` during Wave 0.

*(If no gaps: "None — existing test infrastructure covers all phase requirements" — NOT the case here; planner must close at least the boolean-coverage gap if missing.)*

---

## Project Constraints (from CLAUDE.md)

The phase MUST honor these directives:

| Directive | Source | Applies To Phase 61 |
|-----------|--------|---------------------|
| Test accessibility — WCAG 2.1 AA compliant | CLAUDE.md §Important Implementation Notes | Boolean radio group inherits QuestionChoices' fieldset + sr-only legend + keyboard navigation; DO NOT remove or regress these. |
| Use TypeScript strictly — avoid `any`, prefer explicit types | CLAUDE.md §Important Implementation Notes | Any new type guards (`isBooleanQuestion`) use proper `obj is BooleanQuestion` predicates; avoid `as any` in the boolean branch. |
| Missing values — use `MISSING_VALUE` in matching contexts, `undefined`/empty literals elsewhere | CLAUDE.md §Important Implementation Notes | Irrelevant for QUESTION-01 (the UI layer doesn't emit MISSING_VALUE); may be relevant if QUESTION-02 display path needs to handle "neither answered". Keep existing `isEmptyValue`/`isMissingValue` semantics. |
| Localization — all user-facing strings must support multiple locales | CLAUDE.md §Important Implementation Notes | `common.answer.yes`/`.no` verified present in all 4 supported locales (en/fi/sv/da). Do NOT introduce new strings without parity. |
| Code review checklist | CLAUDE.md §Code Review | Every plan that lands in Phase 61 must satisfy `.agents/code-review-checklist.md`. |
| Run `yarn build` before running dependent packages | CLAUDE.md §Fixing "module not found" errors | If `isBooleanQuestion` is added to `@openvaa/data`, run `yarn build --filter=@openvaa/data` before frontend unit tests. |
| Matching algorithms — questions creating subdimensions need special handling | CLAUDE.md §Important Implementation Notes | Not applicable — boolean is single-axis, no subdimensions (confirmed via `booleanQuestion.ts`). |
| Never commit sensitive data (API keys, tokens, .env files) | CLAUDE.md §Important Implementation Notes | Phase 61 is client-side UI only; no credentials touched. |
| Instance checks — classes properly exported and imported | CLAUDE.md §Instance Checks (commit 87efe19a) | `isObjectType` pattern avoids `instanceof` issues; continue using it. |

**Operational constraint from user memory:**
- `git -c core.hooksPath=/dev/null` prefix required for commits in this repo (per `project_gsd_repo_hook_workaround.md`). Executor/planner applies at commit time.

---

## Sources

### Primary (HIGH confidence — verified in this session)

- `[VERIFIED]` `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte:60-74` — current fallthrough-to-error branch for boolean
- `[VERIFIED]` `apps/frontend/src/lib/components/questions/QuestionChoices.svelte:87,101-109,237-274` — grid renderer shape + default logic
- `[VERIFIED]` `apps/frontend/src/lib/components/questions/QuestionChoices.type.ts` — props type union (no `BooleanQuestion` currently)
- `[VERIFIED]` `packages/data/src/objects/questions/variants/booleanQuestion.ts` — matching-ready BooleanQuestion class
- `[VERIFIED]` `packages/data/src/utils/typeGuards.ts:1-93` — no `isBooleanQuestion` currently exported
- `[VERIFIED]` `packages/data/src/index.ts:69,110,121,134` — BooleanQuestion + QUESTION_TYPE + OBJECT_TYPE exports
- `[VERIFIED]` `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:144-145,242,299-304` — `selectedQuestionCategoryIds` wiring (sessionStorageWritable + fromStore + getter/setter)
- `[VERIFIED]` `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts:62-79` — `sessionStorageWritable` + `toStore` implementation
- `[VERIFIED]` `apps/frontend/src/lib/contexts/utils/questionBlockStore.svelte.ts:15-70` — downstream `$derived.by` consumer
- `[VERIFIED]` `apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte:49-69,126,158` — onMount default-seed + `bind:group` site + counter
- `[VERIFIED]` `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:268-282` — unansweredOpinionQuestions + profileComplete $derived
- `[VERIFIED]` `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:49-55,97-201` — completion enum + testId branches
- `[VERIFIED]` `apps/frontend/src/routes/candidate/(protected)/+layout.svelte:115-136` — parent `$effect` calling `userData.init`
- `[VERIFIED]` `apps/frontend/src/routes/+layout.svelte:116-133` — Phase 60 canonical `get()+untrack()` pattern
- `[VERIFIED]` `apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte:37-82` — per-question match-breakdown dispatch
- `[VERIFIED]` `apps/frontend/src/lib/i18n/translations/{en,fi,sv,da}/common.json` — `answer.yes`/`.no` parity confirmed
- `[VERIFIED]` `packages/app-shared/src/settings/staticSettings.ts` — 4 `supportedLocales` (en, fi, sv, da)
- `[VERIFIED]` `.yarnrc.yml` — svelte@^5.53.12, daisyui@^5.5.14, tailwindcss@^4.2.1, vitest@^3.2.4
- `[VERIFIED]` `tests/tests/specs/candidate/candidate-questions.spec.ts:27-47` — direct failing test assertion using testIds
- `[VERIFIED]` `tests/tests/utils/testIds.ts:31-32` — testId constants match page usage

### Secondary (MEDIUM confidence — cross-verified)

- `[VERIFIED]` `.planning/phases/60-layout-runes-migration-hydration-fix/60-PATTERNS.md` — Phase 60 patterns S-1 through S-5, canonical shape for `$derived`+`$effect` split
- `[VERIFIED]` `.planning/phases/60-layout-runes-migration-hydration-fix/60-RESEARCH.md` — Phase 60 full research, `effect_update_depth_exceeded` analysis
- `[VERIFIED]` `.planning/todos/pending/svelte5-cleanup.md` — Phase 58 UAT source for QUESTION-01/02/03
- `[VERIFIED]` `.planning/phases/61-voter-app-question-flow/61-UI-SPEC.md` — UI design contract
- `[VERIFIED]` `.planning/phases/61-voter-app-question-flow/61-CONTEXT.md` — User decisions and locked scope
- `[VERIFIED]` `.planning/REQUIREMENTS.md` — QUESTION-01/02/03/04 text

### Tertiary (LOW confidence — web sources, cross-reference hypotheses)

- `[CITED: https://github.com/sveltejs/svelte/issues/14617]` Feature request rejected: bind: with getter/setter wrappers — confirms the pattern is unsupported/unreliable
- `[CITED: https://github.com/sveltejs/svelte/issues/16575]` Controlled checkbox with function-accessor bind:checked broken — supports Pitfall 1 hypothesis
- `[CITED: https://github.com/sveltejs/svelte/issues/10072]` bind:value not working on checkbox — related class
- `[CITED: https://github.com/sveltejs/svelte/issues/5029]` bind:group forwarding through component wrapper — historical related issue (closed)
- `[CITED: https://github.com/sveltejs/svelte/issues/13002]` fromStore + @const breaks reactivity — adjacent class (not exact root cause of QUESTION-03 but same family)
- `[CITED: https://svelte.dev/docs/svelte/bind]` Svelte 5 bind: docs — functional binding syntax reference
- `[CITED: https://svelte.dev/docs/svelte/v5-migration-guide]` Svelte 5 migration guide — runes primitives

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified in `.yarnrc.yml` and `node_modules`; Phase 60 already exercised the same stack with this exact svelte version.
- Architecture (QUESTION-01/02): HIGH — target site fully read; matching-layer already implemented; only a 1-branch UI addition.
- Architecture (QUESTION-03): MEDIUM-HIGH — root-cause hypothesis is evidence-based (unique bind:group-on-accessor pattern; matches known Svelte 5 issues) but not reproduced in isolation. Executor should verify with a devtools trace before committing.
- Architecture (QUESTION-04): MEDIUM — hypothesis class confirmed (race or reactivity), but specific root cause requires runtime diagnosis.
- Pitfalls: MEDIUM-HIGH for Pitfalls 1-3 (documented/verified); LOW-MEDIUM for Pitfall 4 (is-this-really-reactivity question).

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (30 days for a stable stack; re-verify if executing later than that). Svelte 5 itself is on an active release track; a minor upgrade could shift the bind:group-on-accessor behavior — cheap to re-verify with a devtools trace at that time.

---

*End of Phase 61 Research*
