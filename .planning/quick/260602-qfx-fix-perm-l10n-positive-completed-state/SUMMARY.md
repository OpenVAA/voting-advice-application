---
quick_id: 260602-qfx
slug: fix-perm-l10n-positive-completed-state
date: 2026-06-02
status: complete
commits:
  - beabf7d63 # fix: green perm-localisation-positive for completed-state flow
---

# Summary: Fix perm-localisation-positive (completed-state question flow)

## Starting question

The spec timed out on `getByTestId('candidate-questions-start')`, and user
screenshots showed a "no questions in your constituency" warning — was the
dataset missing opinion questions, or were they filtered by election/constituency?

## Answer: the data is correct

Seeded the exact template and verified via Postgres + a real Chrome walk:
opinion questions `q3`/`q4` exist in `qc-opin`, scoped to election `el-1` (the
candidate's nomination), constituency-unrestricted. `opinionQuestions` resolves
to 2 — no filtering bug. The "no questions" warning only shows when the data is
torn down (e.g. running the setup project standalone, whose `teardown:` wipes
rows immediately), never during the real test.

The real cause: the seed pre-answers BOTH opinion questions, so the page renders
the completed "Your Opinions" variant — and the `[QC-OPIN]` category Expander is
**collapsed by default** (`defaultExpanded` only opens for categories with
*unanswered* questions). The user's "should it be expanded first?" hypothesis
was correct.

## Fixes (commit beabf7d63)

Five issues surfaced in cascade once the start-button timeout was cleared; each
was re-verified by re-running the full spec:

1. **Start button → expand category + edit q3** (completed-state path; uses the
   existing `candidateQuestionsOverviewPage` fixture).
2. **Comment scope** — `candidate-questions-comment` is on the `<textarea>`
   itself, not a wrapper; value assertion targets the textarea, multilingual
   fixture scoped to `<main>`.
3. **q3→q4 via overview** — saving an already-answered question routes to the
   overview, not linearly to q4.
4. **App fix** — opinion-editor open-answer comment now honors
   `customData.disableMultilingual` (was a raw multilingual `<Input>`; info
   questions already honor it via `QuestionInput.svelte:73`). User chose to fix
   the app rather than relax the test. Verified in Chrome: q4's comment drops
   the translations toggle.
5. **Voter cross-check** — activate the opinions tab (`tab-1`) before asserting
   on `voter-entity-detail-opinions` (EntityDetails mounts only the active tab),
   in both en and fi blocks.

Two pre-existing uncommitted fixture changes (passwordSetter auto-login,
langSelector word-boundary regex) were part of the same chain and folded in.

## Verification

`yarn playwright test --project=perm-localisation-positive` → **50 passed, 0
failed**. Prettier clean on changed files.

## Follow-up (not fixed here)

Auth-user teardown gap: a failed run leaves the invited `candidate-l10n-pos-aa@…`
auth user behind, so the next run fails at `inviteUserByEmail` with "already
registered". The per-template teardown clears seed rows by prefix but does not
unregister the invited auth user. Worth a separate fix (unregister in
`perm-localisation-positive.teardown.ts`, mirroring `candidate-mega.teardown.ts`).
