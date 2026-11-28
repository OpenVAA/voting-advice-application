---
created: 2026-11-28
title: Add question filtering and grouping to EntityOpinions
area: frontend
tags: [voter, contestant, frontend, ui, feat]
keywords: [entity-opinions, question-filter, search, grouping, disagreement, entity-details]
source: "GitHub issue #546"
github_issues: [546]
files:
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.type.ts
  - apps/frontend/src/lib/components/entityFilters
---

# Add question filtering and grouping to EntityOpinions

## Origin

Converted from GitHub issue [#546 feat: question filtering in EntityOpinions](https://github.com/openvaa/voting-advice-application/issues/546) on 2026-11-28.

## Problem

On an entity's details, `EntityOpinions` lists all opinion questions flat. With many questions it is hard to find a topic or see where the voter and the entity disagree most.

## Solution

Add a reusable question-list toolbar: text search (like the results name search), category headings/grouping, and a sort by disagreement with the voter. Make it reusable for the voter and contestant question overview pages; keep state in the voter context if it should persist.
