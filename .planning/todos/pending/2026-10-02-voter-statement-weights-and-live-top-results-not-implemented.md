---
created: 2026-10-02
title: Voter-set statement weights and real-time top results are described as features but have no frontend implementation
area: apps/frontend/src/lib/contexts/voter
severity: question
source: Phase 168 (docs-site rewrite), 168-07 finding F3, filed by plan 168-08 (operator question)
related_phase: 168
files:
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts (`algorithm = new MatchingAlgorithm({`)
  - packages/matching (accepts `questionWeights`)
  - apps/docs/src/routes/(content)/about/features/+page.md
  - apps/docs/src/routes/(content)/publishers-guide/preparing/the-voter-see-when-using/+page.md
---

## Finding

About › Features and the Publishers' Guide described two voter-facing options that the frontend does not implement:

1. **Voter-set statement weights.** `@openvaa/matching` accepts `questionWeights`, but the voter context never passes them
   (`voterContext.svelte.ts`: `algorithm = new MatchingAlgorithm({`). `git grep -n -i weight -- apps/frontend/src` lists only the admin
   pipeline's weights and a CSS comment.
2. **Real-time top results while answering.** There is no frontend code for it.

Phase 168 marked both "not yet available" on the docs pages (D-05: code-proven absences). It did not delete the operator's
descriptions (commits `4987b41bf` and `1b465c7da`).

## Question for the operator

Is either feature still planned?

- **If yes:** this todo becomes the feature request. For weights, the matching side is ready and the missing parts are a UI to set
  per-statement weights and passing them to `MatchingAlgorithm`.
- **If no:** remove the two descriptions from the docs pages and close this todo.
