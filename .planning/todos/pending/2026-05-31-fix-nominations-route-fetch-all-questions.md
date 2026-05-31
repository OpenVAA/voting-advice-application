---
created: 2026-05-31T00:00:00.000Z
title: Fix all nominations route by fetching all questions as well
area: frontend
files:
  - apps/frontend/src/routes/(voters)/nominations/+layout.ts
  - apps/frontend/src/routes/(voters)/nominations/+layout.svelte
  - apps/frontend/src/routes/(voters)/nominations/+page.svelte
  - tests/tests/specs/voter/voter-mega-journey.spec.ts:1128
---

## Problem

The `/nominations` route does not fetch all questions, which causes the
candidate-nominations list to fail to render correctly.

Surfaced 2026-05-31 while writing the voter-mega-journey Phase 91 step
that asserts `/en/nominations` renders the candidate-nominations list
(`testIds.voter.nominations.list`). The step was skipped pending this fix
— see `tests/tests/specs/voter/voter-mega-journey.spec.ts:1128`
(commented out with a pointer back to this TODO).

## Solution

Update the nominations route loader to fetch all questions (parity with
the results route data flow), so the candidate-nominations list has the
question data it needs to render entity cards.

Once fixed, re-enable the skipped `test.step('nominations: …')` in
`voter-mega-journey.spec.ts` (uncomment lines around 1128-1146) and
verify the assertion passes against a baseV1-seeded database with the
voter already located (selectedElections + selectedConstituencies).
