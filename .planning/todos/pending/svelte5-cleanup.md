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

## Acceptance

- Boolean questions render an appropriate answer control and can be
  answered in the voter flow.
- Candidate result page opens without errors when the voter has
  answered a boolean question.
- Category selector has a sensible default selection (all opinion
  categories checked, or an explicit product decision documented) and
  the question count updates reactively on every toggle.
