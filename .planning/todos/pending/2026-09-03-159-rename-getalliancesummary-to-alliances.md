---
created: '2026-09-03T07:22:00.000Z'
title: 'Rename lib/utils/getAllianceSummary.ts to alliances.ts - deferred, the file is slated to change directory first'
area: frontend-structure
files:
  - apps/frontend/src/lib/utils/getAllianceSummary.ts
  - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte
  - .planning/phases/158-routing-auth-surface-harmonisation/158-LIB-UTILS-MOVE-PROPOSAL.md
blocked_on: 'the operator ruling on 158-LIB-UTILS-MOVE-PROPOSAL.md section 3.2 - the proposal is written but explicitly unauthorised'
---

## Status: filed, not implemented - renaming it now would be half of a two-step move

## The review comment

`apps/frontend/src/lib/utils/getAllianceSummary.ts` - PR #869 (kaljarv), verbatim:

> Rename to `alliances.ts`

The request is reasonable on its face: the module is 23 lines with a single export, and the filename
restates the function name rather than naming the subject.

## Why Phase 159 filed it instead of doing it

**1. The file is slated to change DIRECTORY, and that ruling has not been made yet.** Phase 158's
decision D-G1 carried a binding operator NOTE - "sweep other content of lib/utils and make a proposal of
other sections to move directly to lib" - and that sweep produced
`.planning/phases/158-routing-auth-surface-harmonisation/158-LIB-UTILS-MOVE-PROPOSAL.md`.
`getAllianceSummary.ts` is a **named member of section 3.2**, the proposal's strongest verdict:

> **3.2 - Entity and nomination helpers -> RECOMMEND `lib/entities/`**
> **Members:** `entities.ts` (30) · `entityCards.ts` (38) · `entityDetails.ts` (52) · `matches.ts` (117) ·
> `sorting.ts` (77) · **`getAllianceSummary.ts` (23)** · `image.ts` (27) + `image.test.ts`.

So the open question is not "what should this file be called" but "does this cluster move to
`lib/entities/`", and the rename is a detail of that move. Doing the rename first means touching the file
and both importers twice.

**2. Phase 158 deliberately did not authorise acting on it.** That phase is closed, but its proposal
closes with (section 6, verbatim):

> **Nothing in this document is executed by Phase 158.** ... **Acting on any verdict here is a separate
> decision, for the operator to make and for a later phase to own.**

Section 3.2 additionally leaves one question open on purpose - whether `entityCards.ts`, which imports
from `$lib/components/`, belongs in a domain directory at all. So there is a live design question
attached to the very cluster this file sits in.

**3. A rename here would have collided with this phase's own edits.** Both importers were touched during
Phase 159: `EntityCard.svelte` by plan 05 (the `EntityCardAction` -> `cardAction` snippet conversion) and
by the `$layouts` import rewrite in plan 08.

## Measured facts, re-derived at `05dfe74f2`

- `apps/frontend/src/lib/utils/getAllianceSummary.ts` - **23 lines**, one export, no test file.
- **Two importers**, both under `lib/dynamic-components/`:
  - `entityCard/EntityCard.svelte:57` (called at `:167`)
  - `entityDetails/EntityDetails.svelte:37` (called at `:99`)

`159-RESEARCH.md` cites these as `:56` and `:38`; both drifted by one line during this phase. Whoever
executes the rename should re-measure rather than inherit any of these numbers.

## What the work is, when it is authorised

Rename the file to `alliances.ts` (or place it at `lib/entities/alliances.ts` if section 3.2 is adopted -
**one move, not two**), update the two import specifiers, and keep the exported symbol name
`getAllianceSummary` unless a separate decision renames it too. `yarn typecheck` catches a missed
specifier; there is no test file to move.
