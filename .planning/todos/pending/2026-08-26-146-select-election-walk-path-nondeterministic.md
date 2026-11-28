---
created: 2026-08-26T19:30:00.000Z
title: selectElection.ts's landing election is non-deterministic by its own docblock
area: testing
severity: minor
source: Phase 146 (146-07 Task 0; .planning/debug/seed-determinism-across-resets.md)
files:
  - tests/tests/utils/selectElection.ts
---

## Problem

`tests/tests/utils/selectElection.ts:64` states in its own docblock that **the walk's landing
election is non-deterministic**. Whether `selectElectionByName` has to perform a real click-and-
navigate, or finds the target already selected and changes nothing, therefore varies run to run.

That divergence had a visible consequence: on the extra-navigation path,
`apps/frontend/src/routes/+layout.svelte:172-182`'s `afterNavigate` schedules a
`requestAnimationFrame` focus reset onto `[data-focus-on-nav]` / `h1`, stealing focus from the
just-clicked `AccordionSelect` option button, whose `focus:text-primary`
(`AccordionSelect.svelte:89`) then stops applying. Result: a 291x17 focus-state band on the
election chip that flips between exactly two variants across otherwise identical runs.

`2df2d0b28` made the **capture** stable — it blurs/normalises the focus state before the
screenshot, test-only, leaving the product's NAVA11Y-02 focus reset alone as correct a11y
behaviour. It did **not** make the walk's path deterministic. The underlying non-determinism is
still there, and the next assertion that happens to be sensitive to which path was taken will meet
it fresh.

## Solution

Make the walk's landing election deterministic — pin it explicitly at the start of the walk rather
than accepting whatever the app lands on, so both callers and captures see one path. Until then,
any spec that depends on post-walk UI state must normalise it the way `2df2d0b28` does, and should
say why.

## Note

The band scored **0 px at the shipped `threshold: 0.2`**, so it never threatened the visual gate.
It is filed because a latent two-path walk under a stable capture is exactly the shape that gets
rediscovered as a "flake" later.
