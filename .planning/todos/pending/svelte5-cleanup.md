---
title: Svelte 5 frontend cleanup — voter-app question & results surfaces
priority: medium
created: 2026-04-23
context: Surfaced during Phase 58 human UAT of the default-template seed. The voter flow now renders (all 13 constituencies populated, 100 candidates with portraits, 24 questions), but three surfaces behave incorrectly with specific question types and category selection.
---

# Svelte 5 cleanup — question + results surfaces

Collected during Phase 58 UAT (2026-04-23). The default seed template now
emits 18 singleChoiceOrdinal + 5 singleChoiceCategorical + 1 boolean =
24 questions. Exercising this mix in the voter app surfaces three issues
that look like Svelte 5 migration leftovers rather than seed-data gaps.

## 1. Boolean questions not displayed

Boolean-type questions (there's exactly one per seed run, question
index 23) render as unanswerable / missing UI. The question row exists
in the DB and is returned by `getQuestionData`, so the gap is in the
voter-app question renderer — likely a missing case in the
question-type switch for `boolean`.

- **Where to look**: voter question page (`/questions/[questionId]` +
  the dynamic question component that dispatches on `type`).
- **Repro**: `yarn dev:reset-with-data`, start the voter flow, advance
  to the last question in the last category.
- **Expected**: yes/no toggle (or equivalent binary choice UI) and an
  advance button.
- **Actual**: question body renders but no answer controls.

## 2. Error when showing candidate results with a boolean question

When the voter has answered a boolean question and opens a candidate
result detail page, the matching / answer-comparison UI errors out
(exact error TBD; repro expected to throw in the Svelte template
that renders the per-question match breakdown).

- **Likely root cause**: candidate-result-detail components don't
  handle `type === 'boolean'` in the same switch that handles
  `singleChoiceOrdinal` / `singleChoiceCategorical`.
- **Repro**: answer the boolean question, navigate to any candidate
  profile from results.
- **Related**: `packages/data/src/objects/questions/variants/booleanQuestion.ts`
  — check whether its `normalizeValue` / `getSubdimensions` shape
  matches what the voter-app match component consumes.

## 3. Category selection starts empty + question count stuck at 0

On the category-selection screen (enters the question flow), no
categories are checked by default and the "questions" counter reads
`0` even after the user ticks boxes — suggesting a reactivity break
in the selected-categories store's derivation of the question-count
total.

- **Likely root cause**: a `$derived` / store-subscription that
  doesn't observe the selection change, or a migration leftover
  where a legacy `$:` block wasn't replaced with `$derived`.
- **Repro**: `/questions/category` (category select) on a fresh
  session, tick one or more categories, observe the count label
  stays `0`.
- **Where to look**: category-selection component + the voter
  context's `_opinionQuestions` / `selectedQuestionCategoryIds`
  derivation chain (`apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts`).

## 4. Audit and possibly remove all `bind:*` props

Surfaced during Phase 64 manual smoke (2026-04-28). `QuestionChoices.svelte:271`
emitted `binding_property_non_reactive` for `bind:this={inputs[id]}` because
`inputs` was a plain `const` instead of `$state`. Local fix landed; broader
question is whether the codebase has other latent `bind:*` patterns that:

- Bind to non-reactive properties (Svelte 5 warns or silently mis-syncs)
- Use two-way `bind:` where one-way prop + callback would be clearer in
  Svelte 5 idioms
- Could be replaced with `$bindable()` callsite-driven flow at the parent

Goal: sweep `apps/frontend/src/lib/**/*.svelte` for every `bind:` usage,
classify each as keep / migrate / remove, and either fix or document the
rationale to retain.

- **Where to look**: `grep -rn "bind:" apps/frontend/src/lib --include='*.svelte'`
- **Patterns to flag**:
  - `bind:this` on non-`$state` targets (the Phase 64 fix pattern)
  - `bind:value`/`bind:checked` against props NOT declared with `$bindable()`
  - Two-way bindings that flow data UP through 3+ component layers
- **Acceptance**: zero `binding_property_non_reactive` warnings on any
  voter-flow path; documented decision per remaining `bind:*` site.

## 5. Audit and possibly remove all `{#key}` blocks

Surfaced during Phase 64 manual smoke (2026-04-28). `EntityList.svelte:104`
wrapped each card in `{#key item}<EntityCard {...item} />{/key}`. Combined with
the upstream cascade where `filtered.map((e) => ({ entity: e }))` minted fresh
wrapper objects on every URL change, `{#key item}` forced every
`<EntityCard>` (and its `<img>` portrait) to remount on drawer open/close.

After fixing the upstream cascade (appSettingsValue / selectedElections
ref-equality guards), removing the `{#key item}` and the wrapper-cache had
no visible regression — Svelte's positional reuse handled the case fine.
Suggests the original `{#key item}` was a defensive Svelte-5-migration paste
that's now load-bearing for nothing.

Goal: sweep every `{#key …}` use and reclassify each as keep / replace-with-
each-key / remove. Many may be the same defensive pattern.

- **Where to look**: `grep -rn "{#key" apps/frontend/src --include='*.svelte'`
- **Patterns to flag**:
  - `{#key item}` inside `{#each items as item}` — usually replaceable with a
    keyed each `{#each items as item (item.id)}` or removable entirely if the
    template is positional.
  - `{#key url}` / `{#key params.X}` — defensive force-remount on navigation.
    Often unnecessary once upstream reactivity is stable.
  - `{#key derivedTuple}` where the tuple's content rarely changes — measure
    whether the remount is doing useful work.
- **Acceptance**: every retained `{#key}` has an inline justification, or a
  test demonstrating the remount is observable behavior.

## Acceptance

- Boolean questions render an appropriate answer control and can be
  answered in the voter flow.
- Candidate result page opens without errors when the voter has
  answered a boolean question.
- Category selector has a sensible default selection (all opinion
  categories checked, or an explicit product decision documented) and
  the question count updates reactively on every toggle.
- `bind:*` audit complete (item 4).
- `{#key}` audit complete (item 5).
