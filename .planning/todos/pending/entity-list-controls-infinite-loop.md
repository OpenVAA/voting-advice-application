---
title: Combine EntityListControls with EntityList and fix infinite $effect loop
priority: high
source: Results page layout refactor (2026-03-23)
---

Moving the results list from `+page.svelte` into `+layout.svelte` (to enable layout-based entity detail drawer) triggers an infinite `$effect` loop in `EntityListControls.svelte`. Filters are temporarily disabled on the results page.

**Root cause:** `EntityListControls` line 56 has `$effect(() => { entities; updateFilters(); })`. `updateFilters()` calls `filterGroup.apply(entities)` which triggers `filterGroup.onChange` listener → calls `updateFilters()` again → loop. This worked in `+page.svelte` but breaks in the layout due to different component lifecycle timing.

**Attempted fixes that didn't work:**
- `untrack(() => { filteredEntities = results })` in the onUpdate callback
- `queueMicrotask(() => { filteredEntities = results })` to defer the state update

**What to do (all in one pass):**
1. Combine `EntityListControls` and `EntityList` into a single component (there's an existing TODO in the results page: "Combine EntityListControls and List components into one")
2. Refactor to use `$derived` instead of `$effect` + callback pattern, eliminating the `filterGroup.onChange` → `updateFilters` → `filterGroup.apply` circular call chain
3. Remove the empty `results/+page.svelte` — make entity detail route params (`[entityType]/[entityId]`) optional so the results page and entity detail share the same route
4. Use the `entityType` route param to set the initially active entity tab (candidate/organization) when present
5. Re-enable filters on the results page

**Files involved:**
- `apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte` — the component with the loop
- `apps/frontend/src/lib/dynamic-components/entityList/EntityList.svelte` — to merge with controls
- `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` — layout that uses it
- `apps/frontend/src/routes/(voters)/(located)/results/+page.svelte` — empty page to remove
- `apps/frontend/src/routes/(voters)/(located)/results/[entityType]/[entityId]/+page.svelte` — make params optional
- `packages/filters/` — FilterGroup.onChange implementation
