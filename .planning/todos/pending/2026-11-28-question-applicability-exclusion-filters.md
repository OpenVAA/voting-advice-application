---
created: 2026-11-28
title: Support exclusion filters on question applicability
area: supabase
tags: [supabase, data, feat]
keywords: [question-filters, exclude, constituencies, applies-to, negative-filter]
source: "GitHub issue #748"
github_issues: [748]
files:
  - packages/data/src/objects/questions/base/questionAndCategoryBase.ts
  - packages/data/src/objects/questions/base/questionAndCategoryBase.type.ts
  - packages/data/src/core/filter.type.ts
  - apps/supabase/supabase/schema
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
---

# Support exclusion filters on question applicability

## Origin

Converted from GitHub issue [#748 feat: negative filters for, e.g., `Question`s](https://github.com/openvaa/voting-advice-application/issues/748) on 2026-11-28.

## Problem

Questions and question categories in `@openvaa/data` can be limited to certain elections, constituencies, election rounds and entity types via positive lists (`electionIds`, `constituencyIds`, ... checked in `QuestionAndCategoryBase.appliesTo`). There is no way to say 'applies to every constituency except X'; with many constituencies a publisher must list all others, and the list breaks when constituencies are added.

## Solution

Add an exclusion form to the filter value (e.g. `{ exclude: Array<Id> }` alongside the plain value/array) or separate `excludeConstituencyIds` etc. fields; implement it in `match()` used by `appliesTo`, carry it through the Supabase schema/columns for questions and categories, `supabase-types`, the data provider, dev-seed and the docs.
