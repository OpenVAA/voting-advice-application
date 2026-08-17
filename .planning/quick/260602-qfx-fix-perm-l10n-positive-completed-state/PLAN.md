---
quick_id: 260602-qfx
slug: fix-perm-l10n-positive-completed-state
date: 2026-06-02
---

# Fix perm-localisation-positive: completed-state question flow + disableMultilingual on comments

## Problem

`perm-localisation-positive.spec.ts` timed out (180 s) waiting for
`getByTestId('candidate-questions-start')`. User screenshots also showed a
"no questions in your constituency" warning, raising the question of whether
opinion questions were being filtered out by election/constituency.

## Investigation (data disproven as cause)

Seeded the exact template (`perm-localisation-positive`) and inspected
Postgres + drove the real flow in Chrome:

- Both opinion questions (`q3`, `q4`) exist in category `qc-opin`, scoped to
  election `el-1` (the candidate's nomination), **constituency-unrestricted**.
  `candidateContext.opinionQuestions` resolves to 2. **No data/filtering bug.**
- The "no questions in your constituency" warning only appears when the
  data-setup project is run standalone (its `teardown:` immediately wipes the
  rows) or when viewing after teardown — never during the real test, where the
  questions render.

Root cause: the spec was written for the **empty / linear-answering** flow,
but the seed pre-answers BOTH opinion questions, so the page renders the
**completed ("Your Opinions")** variant. Cascade of mismatches followed.

## Fixes

1. **Spec — start button → expand category + edit q3.** `candidate-questions-start`
   only renders in the empty branch (`questions/+page.svelte:86`). In the
   completed state the `[QC-OPIN]` Expander is collapsed by default; expand it
   and click q3's card action (uses the existing `candidateQuestionsOverviewPage`
   fixture).
2. **Spec — comment multilingual scope.** `candidate-questions-comment` is
   forwarded onto the `<textarea>` itself (Input.svelte restProps), not a
   wrapper. Assert the value directly on the textarea; scope the multilingual
   fixture to `<main>` (the only textbox in `<main>` is the comment).
3. **Spec — q3→q4 via overview.** With all questions answered,
   `unansweredOpinionQuestions` is empty so saving routes back to the overview
   (`[questionId]/+page.svelte:121-136`), not linearly to q4. Reach q4 the same
   way as q3.
4. **App — honor `disableMultilingual` on the opinion-editor open-answer
   comment.** The comment used a raw `<Input type="textarea-multilingual">`
   that ignored `customData.disableMultilingual` (info questions honor it via
   `QuestionInput.svelte:73`). q4's comment now drops the translations toggle,
   consistent with info questions. (User decision: fix the app.)
5. **Spec — activate opinions tab in voter cross-check.** `EntityDetails.svelte`
   mounts only the active tab's panel; the dialog opens on info (index 0).
   Click the opinions tab (`tab-1`) before asserting on
   `voter-entity-detail-opinions`, in both the en and fi blocks.

Plus two pre-existing uncommitted fixture changes folded in (part of the same
chain): `candidatePasswordSetter.expectNotVisible()` (auto-login) and a
`langSelector` word-boundary regex.

## Verification

`yarn playwright test --project=perm-localisation-positive` → **50 passed, 0
failed** (target spec + its 49 setup/teardown/sibling projects). Prettier clean
on changed files.

## Follow-up (separate, not fixed here)

Auth-user teardown gap: a failed run leaves the invited `candidate-l10n-pos-aa@…`
auth user, causing `inviteUserByEmail` "already registered" on the next run.
The per-template teardown clears seed rows by prefix but does not unregister the
invited auth user.
