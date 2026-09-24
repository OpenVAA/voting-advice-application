---
created: "2026-08-24T19:30:00.000Z"
title: Seed emitter ignores minSelections/maxSelections — 37-43% of multi-choice answers invalid
area: dev-seed
files:
  - packages/dev-seed/src/emitters/answers.ts
  - packages/dev-seed/src/emitters/latent/project.ts
  - packages/dev-seed/src/templates/defaults/questions-override.ts
---

## Problem

Phase 145 (plan 04.1) restored the "emit what the question declares" contract for the
`number` question type only. The multi-choice path was left as it was, so the contract is
half-restored.

`pickMultipleChoiceIds` (`answers.ts:147-159`) selects choices by an independent coin flip
per choice, then forces a single pick when the result is empty. It never reads
`minSelections` / `maxSelections`. Its latent twin `mapMultiCategorical` has the same gap —
`grep minSelections packages/dev-seed/src/emitters/answers.ts` returns nothing.

The `default` template declares `{ filterable: true, minSelections: 2, maxSelections: 3 }`
on its multi-choice question (`questions-override.ts:186`), over 4 choices. The coin-flip
distribution puts **~37% of draws outside [2,3]** analytically (1 or 4 selections);
the phase-145 code review measured **142/327 = 43%** invalid on the real seeded dataset.

`isMultiChoiceCountValid` (`apps/frontend/src/lib/utils/multiChoiceValidity.ts`) is the
app's single source of truth for this constraint, so the seeded data contradicts a rule the
app itself enforces.

## Why this is NOT the phase-145 number-range defect

Severity is materially lower and the two should not be conflated:

- The number-range defect **threw**. `normalizeCoordinate` raises on an out-of-range value,
  which killed the voter layout render and hung every route past the first answered question.
- This one **does not throw**. `isMultiChoiceCountValid` gates *input* — `OpinionQuestionInput`,
  the voter persistence gate and the candidate Save gate. Nothing validates seeded candidate
  answers on read. That is why the cardinal E2E suite passes 135/0 and the criterion-1 probe
  renders correctly with this defect present.

So it is a data-fidelity defect, not a crash. It was correctly classified Warning, not Critical,
and correctly left out of phase 145's scope (TMPL-03 / TMPL-04).

## Solution

Make `pickMultipleChoiceIds` and `mapMultiCategorical` read the declared constraints, mirroring
what `emitNumberInDeclaredRange` now does for `number`:

- `effectiveMin = minSelections ?? 1`, `effectiveMax = maxSelections ?? choiceCount` — reuse the
  app's exact formula so producer and validator cannot drift.
- Draw a count in `[effectiveMin, effectiveMax]`, then sample that many distinct choices.
- Preserve single-draw determinism under the template's pinned seed (the determinism tests are
  run-vs-run, not stored baselines — verified in 145-04.1 — but keep the draw count stable).
- Extend `packages/dev-seed/tests/emitters/answers.test.ts`, which already holds the `number`
  contract, with the multi-choice case. Pair it: RED before, GREEN after, per the milestone's
  standing acceptance rule.

Consider whether the contract belongs in one shared helper so a third question type cannot
regress the same way.

## Source

Phase 145 code review, finding WR-01. Confirmed independently by the orchestrator: the
constraint grep returns nothing, the template does declare 2/3, and the coin-flip distribution
reproduces ~37% invalid over 100k trials.
