---
created: "2026-09-03T06:55:00.000Z"
title: Operator UAT of the 2-choice and multi-select question inputs
area: ui
files:
  - apps/frontend/src/lib/components/questions/QuestionChoices.svelte
  - apps/frontend/src/lib/components/input/Input.svelte
  - .planning/phases/159-component-context-consolidation/159-UAT-QUESTION-INPUTS.md
---

## Status: filed AND delivered in Phase 159 — the RUN is scheduled for milestone close

This entry exists because D-N2 says every follow-up review comment gets a register entry during its owning
phase. The operator's note on G5 added "implement the blocking ones", so this one is both **filed here**
and **delivered in Phase 159 plan 10**. It is not outstanding work.

**The remaining action is the operator's own acceptance run, and it is deferred to v2.15 milestone close.**
The operator's words, verbatim:

> "I just need to UAT-check the UI for 2-choice and multi-select choices, but it should happen only at the
> end of the milestone."

**This does not block Phase 159**, and it blocks no requirement. Whoever closes v2.15 should surface it;
nobody should treat it as an open Phase 159 item.

## The review comment

`apps/frontend/src/lib/components/questions/QuestionChoices.svelte:1` — PR #869 (kaljarv), verbatim:

> Add as a follow-up blocking task for me to UAT: - BooleanInput - multi-select choices

## What was delivered instead of a build

Both capabilities already existed on the tree, so the honest deliverable was reachability, not
construction. Measured at Phase 159 plan 10:

- **There is no `BooleanInput` component anywhere in the repository** — a whole-tree search for the name
  returns zero files. The boolean kind is a member of the general input component's kind union
  (`Input.type.ts:37`) and is rendered by the `type === 'boolean'` branch at `Input.svelte:450`, as a
  toggle switch. A boolean *opinion* question takes a different route entirely: `OpinionQuestionInput`
  synthesizes a two-choice No/Yes pair and hands it to `QuestionChoices`, which is why the operator's own
  wording — "2-choice" — describes the UI more accurately than the comment's "BooleanInput" does.
- **Multi-select choices are live** in `QuestionChoices.svelte`, with the selection state at `:147`, the
  helper-text bounds at `:169`, and the saveability gate reached through `OpinionQuestionInput.svelte:36`.
- Both question shapes are present in the dev-seed templates, and `e2e/base` additionally carries a second
  multi-select question with an exact-count window.

**The artifact:** `.planning/phases/159-component-context-consolidation/159-UAT-QUESTION-INPUTS.md` — the
seed command, the routes, the expected behaviour of each control including keyboard and screen-reader
behaviour and the selection-count boundaries, and a list distinguishing a real defect from behaviour that
merely looks surprising.

The run was deliberately sequenced after the input-component extraction (159-09), so it exercises the code
that will actually ship rather than code that was about to change.

## Related, closed in the same plan

The reviewer's separate comment at `apps/frontend/src/lib/utils/multiChoiceValidity.ts:8` ("If so,
minSelection should be checked to be > 0") named a real hole in the same selection-count gate: a question
authored with an explicit minimum of zero would have let an empty answer count as saved, contradicting the
function's own documented invariant. Fixed in Phase 159 plan 10, demonstrated failing first. Not reachable
from any seeded question, so the acceptance run above cannot exercise that specific authoring; a unit test
holds it.
