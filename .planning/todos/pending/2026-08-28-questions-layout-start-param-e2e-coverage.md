---
created: "2026-09-01T00:00:00.000Z"
title: No E2E covers the questions layout's once-per-session `start` deep-link handler
area: tests/tests/specs/voter
severity: minor
source: PR #870 review comment (kaljarv) at apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:144 — subject re-measured to :122-131 at HEAD 3c958cccc; filed per Phase 158 decision D-G5 step 1
files:
  - apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte
  - tests/tests/specs/voter
---

# E2E coverage for the `start` query-param deep-link handler

**Filed:** 2026-09-01, during Phase 158. The filename carries `2026-08-28`, the date the review
comments were bucketed in `.planning/PRE-SHIP-REVIEW-TRIAGE.md`; `created` carries the filing date.

**Classification: NON-BLOCKING.** The reviewer wrote *"Add a follow up for a e2e test targeting this
behaviour."* — a request for coverage, not a defect report, with no blocking marker.

## The comment

> Add a follow up for a e2e test targeting this behaviour.

## ⚠ Anchor drift — read the coordinates carefully

The review anchor is `…/questions/+layout.svelte:144`. **At HEAD `3c958cccc` line 144 is
`void question?.id;`** — an unrelated line inside a validity-reset `$effect`. The anchor's *subject*
is alive and unchanged; only its address moved.

| | Line | Content |
|---|---|---|
| **Review era** (`0a7939aff`) | `:144` | `onMount(() => {` — the handler, under a 5-line comment block at `:139-143` |
| **HEAD `3c958cccc`** | `:122-131` | the same handler: comment at `:122`, `onMount(() => {` at `:123`, body to `:131` |

**Cause of the drift:** `152-14` unwrapped 3,411 forced line breaks across `apps/` — the five-line
comment above the handler collapsed to one, and everything above it shrank likewise, pulling the
handler up 21 lines. Verified with `git show 0a7939aff:…` against the file at HEAD.

**Anchor as an expression** (stable across future drift):
`onMount` immediately below the comment beginning *"`onMount`, deliberately."*, under the
`// Handle \`start\` query param` banner.

## The behaviour that needs covering

`apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:123-131`:

```ts
onMount(() => {
  if (!question) return;
  if (page.url.searchParams.get('start')) {
    // Clear any possible selected categories, although there should under normal circumstances be none
    voterCtx.selectedQuestionCategoryIds = [];
    voterCtx.firstQuestionId = question.id;
    startEvent('question_startFrom', { questionId: question.id });
  }
});
```

Three observable effects on a `?start=` entry URL: selected question categories are cleared, the
entry question becomes `firstQuestionId`, and a `question_startFrom` tracking event fires.

**Why `onMount` and not `afterNavigate`/`$effect` is load-bearing**, and therefore what the test must
protect: the `start` param is present only on the *entry* URL of a "start answering from here"
deep-link. The handler must run **once per session**. `onMount` on this persistent layout provides
exactly that; `afterNavigate` or an `$effect` would re-fire on every Q→Q hop within the questions
flow and re-clear the user's category selection mid-flow. The file's own comment at `:122` records
this.

**The regression this would catch:** any future change that converts the handler to a reactive form —
which is superficially attractive, since almost everything else in this layout is reactive — silently
breaks the questions flow for every deep-linked user. There is no unit test and no E2E over it today.

## Suggested spec shape

Deep-link to a mid-flow question with `?start=`, assert the entry question is treated as first, then
navigate forward at least twice and assert the category selection is not re-cleared and the
`question_startFrom` event fired exactly once. The once-only assertion is the half that actually
guards the `onMount` choice; a single-navigation test would pass under the broken reactive form too.

## Why it is not being done in Phase 158

Phase 158 is the routing and auth surface; this is voter-app question-flow coverage, named by no
`REVIEW-RT-*` criterion. Per project convention (`CLAUDE.md` § E2E), E2E work is planned
audit→plan→approve→build-fixtures-first rather than bolted onto an unrelated phase.
