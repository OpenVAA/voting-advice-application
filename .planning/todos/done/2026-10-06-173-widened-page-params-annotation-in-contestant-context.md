---
created: 2026-10-06T19:00:27.000Z
title: Remove the widened annotation on the contestant context's page.params read
area: Contestant app / cleanup
severity: trivial
source: Phase 173 (name map items 22, 47, 59 and 66); filed by 173-13
files:
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
---

## Problem

`contestantContext.svelte.ts` reads `page.params` through a destructuring annotated `Record<string, string | undefined>`, with a comment explaining it. The annotation was needed while no route declared `entityType` and `entityId`. The routes exist since 173-08 and the generated type declares both, so the annotation and its comment can go. No later plan of Phase 173 listed the file.

## Solution

Remove the annotation and the comment in the next plan that edits the context (Phase 175 lifts its question scope and will be in the file); `yarn workspace @openvaa/frontend check` shows whether the generated type is enough.

## Resolution

**Closed 2026-10-09** by Phase 175 plan 175-08, at the phase's close (plan 175-13).

The annotation and its comment were removed in commit `2c97f01b8` (`feat(175-08): the contestant context exposes the nominations lock, scopes questions by entity type and knows when they are loaded`): `const { entityType, entityId } = page.params;` now type-checks without the widened `Record<string, string | undefined>`, because the generated route types carry both params on the routes below `[entityType=servedEntityType]/[entityId=uuid]`. Checked on the closing tree: the string no longer occurs in `contestantContext.svelte.ts`, and `yarn workspace @openvaa/frontend check` is the `check-frontend` row of the closing gate set `175-13-final`, exit 0.
