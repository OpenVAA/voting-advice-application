# EntityListWithControls

An `EntityListControls` rendering an `EntityList` of the filtered entities, filtered by the voter's active `FilterGroup` unless one is given.

### Properties

- `entities`: Array of possibly-wrapped entities to display.
- `filterGroup`: optional override for the active `FilterGroup`. When
  omitted, pulls from `filterContext.filterGroup`.
- `searchProperty`: property used by the search filter. @default `'name'`
- `itemsPerPage` / `itemsTolerance` / `scrollIntoView`: forwarded to the
  nested `<EntityList>`.
- `data-testid`: forwarded to the nested `<EntityList>`.
- Any valid attributes of a `<div>` element.

## Source

- Component: [apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte)
- Types: [apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.type.ts)
