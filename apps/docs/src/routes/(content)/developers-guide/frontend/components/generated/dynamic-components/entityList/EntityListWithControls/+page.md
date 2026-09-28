# EntityListWithControls

Compound component combining search + filter controls with an `EntityList` in a fixed layout. Uses pure `$derived` computations bridged to `FilterGroup.onChange` via the version counter provided by `filterContext` — NOT an `$effect` + `filterGroup.onChange` + `updateFilters` chain, which is circular and breaks.

### Properties

- `entities`: Array of possibly-wrapped entities to display.
- `filterGroup`: optional override for the active `FilterGroup`. When
  omitted, pulls from `filterContext.filterGroup`.
- `searchProperty`: property used by the search filter. @default `'name'`
- `itemsPerPage` / `itemsTolerance` / `scrollIntoView`: forwarded to the
  nested `<EntityList>`.
- Any valid attributes of a `<div>` element.

### Reactivity bridge

This component reads `fctx.version` inside its `$derived` so that any filter-rule mutation (which fires `FilterGroup.onChange` and bumps `fctx.version` via the `filterContext` `$effect`) re-runs the filter computation. The local `searchVersion` mirrors the same pattern for the search filter (no global subscription needed — search state is component-local). See `helpers.ts` for the pure `computeFiltered` / `countActiveFilters` functions consumed here.

## Source

[apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte)

[apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.type.ts)
