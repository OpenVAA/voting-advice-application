---
created: 2026-11-28
title: Fix InfoAnswer link list rendering every item as the whole answer
area: frontend
tags: [voter, contestant, frontend, ui, bug]
keywords: [info-answer, link-list, format-answer, links, entity-details]
files:
  - apps/frontend/src/lib/components/infoAnswer/InfoAnswer.svelte
---

# Fix InfoAnswer link list rendering every item as the whole answer

## Origin

Found on 2026-11-28 while triaging GitHub issue #514.

## Problem

In `apps/frontend/src/lib/components/infoAnswer/InfoAnswer.svelte`, `formatLinkListItem(link)` is passed as the `map` of `question.formatAnswer(...)` but its first line overwrites the per-item argument: `link = checkUrl(question.formatAnswer({ answer }))`, i.e. the whole joined answer. With more than one link, `checkUrl` of the joined string most likely fails and nothing renders; with one link it works by accident.

## Solution

Use the per-item `link` argument (`link = checkUrl(link)`), and add a unit or component test with two or more links.
