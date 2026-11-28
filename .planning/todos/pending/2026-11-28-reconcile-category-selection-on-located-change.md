---
created: 2026-11-28
title: Reconcile selected question categories after located change
area: frontend
tags: [voter, frontend, contexts, bug]
keywords: [question-categories, category-selection, constituency-change, election, voter-context]
source: "GitHub issue #824"
github_issues: [824]
files:
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
  - apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte
---

# Reconcile selected question categories after located change

## Origin

Converted from GitHub issue [#824 check: selected question categories in combination with election/constituency](https://github.com/openvaa/voting-advice-application/issues/824) on 2026-11-28.

## Problem

`apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` selects all opinion categories once (`#hasSeededCategorySelection`) and then keeps the voter's selection when the election or constituency changes. The question blocks filter `#opinionQuestionCategories` (applicable to the current selection) by `#selectedQuestionCategoryIds`. Consequences: categories newly applicable after a change are unselected (silently excluded), and if none of the selected ids are applicable any more, `categoryIds.length > 0` but the filter is empty, so the voter gets no questions.

## Solution

When the applicable category set changes, auto-add newly applicable categories (unless the voter explicitly deselected them), drop ids no longer applicable, and fall back to all categories when the intersection is empty. Unit-test in the voter context tests and cover a constituency switch in E2E.
