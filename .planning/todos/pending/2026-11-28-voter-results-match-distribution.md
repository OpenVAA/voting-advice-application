---
created: 2026-11-28
title: Show match score distribution in voter results
area: frontend
tags: [voter, frontend, filters, ui, feat]
keywords: [match-distribution, histogram, results, filters, visualization]
source: "GitHub issue #845"
github_issues: [845]
files:
  - apps/frontend/src/routes/(voters)/(located)/results/
  - apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte
  - apps/frontend/src/lib/contexts/voter/matchState.svelte.ts
  - packages/app-shared/src/settings/dynamicSettings.type.ts
---

# Show match score distribution in voter results

## Origin

Converted from GitHub issue [#845 feat: show match score distributions in results and apply filters to this](https://github.com/openvaa/voting-advice-application/issues/845) on 2026-11-28.

## Problem

Voters see a ranked list of matches but not how scores are distributed (e.g. whether the top 20 are all within 2 points). Empty issue title only: show a distribution of match scores in the results and have it respond to the active filters.

## Solution

Add an optional (setting-controlled) histogram/strip plot above the results list per entity type, computed from the `matches` tree in the voter context and the filtered list from `EntityListWithControls`. Highlight the voter's top match and filtered-out entities. Must meet WCAG 2.1 AA (text alternative/summary).
