---
created: 2026-11-28
title: Let voters pin questions to the top of comparisons
area: frontend
tags: [voter, frontend, ui, contexts, feat]
keywords: [sticky-questions, pin, entity-card, entity-opinions, results]
source: "GitHub issue #547"
github_issues: [547]
files:
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte
  - apps/frontend/src/lib/dynamic-components/entityCard
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
---

# Let voters pin questions to the top of comparisons

## Origin

Converted from GitHub issue [#547 feat: sticky questions](https://github.com/openvaa/voting-advice-application/issues/547) on 2026-11-28.

## Problem

Voters cannot mark questions they care about so that those answers are shown first in `EntityOpinions` or on the results `EntityCard`s. Could cover info questions too.

## Solution

TBD: add a pin toggle in `EntityOpinions`/`EntityInfo` (and maybe the results page), store pinned ids in the voter context (localStorage), render pinned answers first and optionally in the card footer. Keep it distinct from 'mark as important' weighting.
