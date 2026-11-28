---
created: 2026-11-28
title: Add a filter for boolean questions in voter results
area: frontend
tags: [voter, frontend, filters, ui, feat]
keywords: [boolean-question, entity-filter, results-filters, missing-answers, filters]
source: "GitHub issue #763"
github_issues: [763]
files:
  - packages/filters/src/filter/enumerated
  - apps/frontend/src/lib/contexts/voter/filters/buildQuestionFilter.ts
  - apps/frontend/src/lib/components/entityFilters/enumerated
---

# Add a filter for boolean questions in voter results

## Origin

Converted from GitHub issue [#763 feat: `BooleanEntityFilter` component](https://github.com/openvaa/voting-advice-application/issues/763) on 2026-11-28.

## Problem

Voter results can be filtered by entities' answers to choice, number and text questions, but not by answers to `BooleanQuestion`s (yes/no info questions such as 'incumbent'). `buildQuestionFilter` skips boolean questions and `@openvaa/filters` has no boolean filter.

## Solution

Add a boolean question filter to `@openvaa/filters` (likely an `EnumeratedFilter` subclass with values true/false plus `MISSING_FILTER_VALUE`), wire it in `buildQuestionFilter`, and render it with the existing enumerated filter UI (`components/entityFilters/enumerated`) with localized yes/no/missing labels. Add unit tests.
