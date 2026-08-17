---
type: quick
slug: fix-perm-answers-locked-radio-testid
created: 2026-06-02
---

# Fix perm-answers-locked surface-3 radio locator (wrong testid)

## Problem

`perm-answers-locked.spec.ts:67` ("opinion question: answersLockedWarning
visible + every question-choices radio disabled") fails:

```
Error: question-choices must render at least one radio
Expected: > 0   Received: 0
```

The ARIA snapshot shows 5 disabled radios DO render. The assertion finds 0
because the locator scopes to `getByTestId('question-choices')`, a testid that
does not exist on the candidate question page.

## Root cause (test bug, not app bug)

- `routes/candidate/(protected)/questions/[questionId]/+page.svelte:290` tags
  `<OpinionQuestionInput data-testid="candidate-questions-answer">`.
- `data-testid` is not a named prop of `OpinionQuestionInput`, so it flows into
  `...restProps` and is spread onto `QuestionChoices`.
- In `QuestionChoices.svelte:218-219` the `<fieldset data-testid="question-choices">`
  is immediately followed by `{...restProps}`. Spread-after-attribute means the
  inherited `candidate-questions-answer` OVERRIDES `question-choices`.
- Net: on the candidate page the radio container's rendered testid is
  `candidate-questions-answer`. `question-choices` is the VOTER-app fieldset
  testid only.
- This override is by design and is depended on by
  `candidateQuestionPage.fixture.ts:80` (`getByTestId('candidate-questions-answer')`
  → `question-choice` descendants). Touching the component would break that.

The literal `'question-choices'` was introduced by quick task 260602-dud, which
copied the voter-app testid; its "3/3 pass" verification was inaccurate.

## Fix

Test-only. Scope the radio query to the registered candidate container constant
`testIds.candidate.questions.answerInput` (= `candidate-questions-answer`),
matching the existing fixture pattern. Keep the per-radio `.toBeDisabled()` loop.

## Verification

`yarn workspace @openvaa/e2e test` for `perm-answers-locked.spec.ts` — all 3
surfaces green (surface 1 unauth, surface 2 profile, surface 3 opinion question).
