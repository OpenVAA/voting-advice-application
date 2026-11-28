---
created: 2026-11-28
title: Respect constituency sort_order in ConstituencySelector
area: frontend
tags: [voter, contestant, frontend, data, ui, improvement]
keywords: [constituency-selector, sort-order, ordering, alphabetical, constituencies]
source: "GitHub issue #767"
github_issues: [767]
files:
  - apps/frontend/src/lib/components/constituencySelector/MultiConstituencySelector.svelte
  - apps/frontend/src/lib/components/constituencySelector/SingleGroupConstituencySelector.svelte
  - apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte
  - packages/data/src/core/dataObject.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
---

# Respect constituency sort_order in ConstituencySelector

## Origin

Converted from GitHub issue [#767 feat: add `Constituency.order` in Strapi and use this to override alphabetical ordering in `ConstituencySelector`](https://github.com/openvaa/voting-advice-application/issues/767) on 2026-11-28.

## Problem

Constituencies carry an admin-set `sort_order` in Supabase (`apps/supabase/supabase/schema/101-elections.sql`), which the data provider maps to `DataObject.order` (`packages/supabase-types/src/column-map.ts`). But the constituency selectors ignore it: `MultiConstituencySelector.svelte` and `SingleGroupConstituencySelector.svelte` always sort alphabetically with `localeCompare` unless the `disableSorting` prop is set, and neither caller (`routes/(voters)/constituencies/+page.svelte`, the Contestant App nomination constituency editor) sets it. A publisher therefore cannot put, e.g., the most common constituency first or use a non-alphabetical canonical order.

## Solution

Sort by `order` first (objects with an explicit order before those with `Infinity`), then alphabetically with locale-aware, accent-insensitive comparison (`Intl.Collator(locale, { sensitivity: 'base' })`) as the tiebreaker. Consider moving the comparison into `@openvaa/data` (e.g. a shared `compareByOrderThenName`) so other selectors reuse it. Keep `disableSorting` for callers that pre-sort.
