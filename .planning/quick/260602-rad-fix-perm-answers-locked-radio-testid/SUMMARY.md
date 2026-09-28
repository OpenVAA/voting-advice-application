---
type: quick
slug: fix-perm-answers-locked-radio-testid
status: complete
created: 2026-06-02
completed: 2026-06-02
commit: d8a11b0a5
---

# Summary — Fix perm-answers-locked surface-3 radio locator

## Outcome

`perm-answers-locked.spec.ts:67` (surface-3 opinion question) now passes.
Clean isolated run: **3/3 perm-answers-locked tests green; 55 passed, 0 failed,
0 did-not-run.**

## Root cause (test bug)

The assertion scoped radios to `getByTestId('question-choices')` — the
**voter-app** `QuestionChoices` `<fieldset>` testid. That testid does not exist
on the candidate page:

- `[questionId]/+page.svelte:290` renders
  `<OpinionQuestionInput data-testid="candidate-questions-answer">`.
- `data-testid` isn't a named prop, so it flows through `...restProps` →
  `QuestionChoices`, where `QuestionChoices.svelte:218-219` places
  `{...restProps}` **after** `data-testid="question-choices"`, overriding it.
- Net rendered testid on the candidate fieldset: `candidate-questions-answer`.
  This override is **by design** — `candidateQuestionPage.fixture.ts:80`
  depends on it. So the fix belongs in the test, not the component.

The bad literal was introduced by quick task 260602-dud (copied the voter
testid); its "3/3 pass" claim was inaccurate.

## Fix

Test-only: scope the radio query to
`testIds.candidate.questions.answerInput` (= `candidate-questions-answer`),
matching the existing fixture's `selectChoice` pattern. Kept the per-radio
`.toBeDisabled()` loop. Also adopted the page-object `goToPage()` (a
pre-existing WIP working-tree edit) over a raw `page.goto`.

## Incidental environmental reset (NOT a code fix)

Verification was blocked by stale invited Supabase auth users that the perm
teardowns don't unregister (known follow-up logged by 260602-qfx). Deleted via
the admin API:
- `candidate-l10n-pos-aa@test.openvaa.local` (blocked perm-localisation-positive)
- `e2e-perm-answers-locked-cand-1@test.openvaa.local` (blocked this spec's setup)

## Outstanding follow-up

Perm setup/teardown leaks invited auth users (`inviteUserByEmail ... already
registered` on re-run). The teardown should unregister the invited candidate.
Tracked across 260602-qfx / -dud / -rad; not addressed here.
