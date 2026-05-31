---
created: 2026-05-31T00:00:00.000Z
title: Implement MultipleTextQuestion input in the frontend
area: frontend
files:
  - apps/frontend/src/lib/components/input/QuestionInput.svelte:55
  - packages/dev-seed/src/templates/baseV1.ts
  - tests/tests/utils/candidateMegaConstants.ts
  - tests/tests/specs/candidate/candidate-mega-journey.spec.ts
  - tests/tests/specs/voter/voter-mega-journey.spec.ts
---

## Problem

`MultipleTextQuestion` is fully supported in the `@openvaa/data` model and
the Supabase schema, but the frontend has no input for it. `QuestionInput.svelte`
explicitly throws for it:

```
if (question.type === QUESTION_TYPE.MultipleText)
  throw new Error(`MultipleTextQuestions are not yet supported by QuestionInput. Question id: ${question.id}.`);
```

Because of this, seeding a `multipleText` info question into baseV1 breaks
the candidate profile page (the question editor throws) and renders as a
missing "—" value on the voter entity-detail info tab.

On 2026-05-31 the `multipleText` info question was removed from the baseV1
dataset and from the candidate + voter mega-journeys so the suites pass
against an all-implemented question set.

## Solution

1. Implement a multipleText input branch in
   `apps/frontend/src/lib/components/input/QuestionInput.svelte` (remove the
   throw at :55-56 and the `Exclude<QuestionType, MultipleText>` casts at
   :40 and :64-65). Render an editable list of text inputs (add/remove rows)
   bound to `Array<string>`.
2. Restore the `multipleText` info question in
   `packages/dev-seed/src/templates/baseV1.ts`:
   - the `test-qu-info-multipleText` answer in `DEFAULT_INFO_ANSWERS`
   - the question definition (`type: 'multipleText'`, `sort_order: 8`)
3. Restore the test references removed alongside it:
   - `tests/tests/utils/candidateMegaConstants.ts` — the
     `test-qu-info-multipleText` entry in `INFO_QUESTION_ANSWERS`
   - `tests/tests/specs/candidate/candidate-mega-journey.spec.ts` — the
     `/qu-info-multipleText/` entry in step 12's `expectQuestionsVisible`
   - `tests/tests/specs/voter/voter-mega-journey.spec.ts` — bump the
     entity-detail info-item count back to 14 and restore the `nth(11)`
     multipleText assertion block
4. Verify candidate + voter mega-journeys pass against a baseV1-seeded DB.
