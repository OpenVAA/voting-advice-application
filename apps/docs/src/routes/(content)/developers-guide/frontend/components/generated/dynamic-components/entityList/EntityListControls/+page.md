# EntityListControls

Show filter, sorting (TBA) and search tools for a list of entities, and render the list from the filtered entities with the `children` snippet.

TODO: Consider moving the tracking events away from the component and just adding callbacks that the consumer can use to trigger tracking events.

### Properties

- `entities`: A list of possibly ranked entities, e.g. candidates or a parties.
- `filterGroup`: The filters applied to the contents.
- `searchProperty`: The property used for the search tool. Default: `'name'`
- Any valid attributes of a `<div>` element.

### Snippet Props

- `children`: Renders the list. Receives the entities left after the filters and the search.

### Tracking events

- `filters_reset`
- `filters_active` with `count`, the number of currently active filters

### Usage

```tsx
<EntityListControls entities={allParties} {filterGroup}>
  {#snippet children(filtered)}
    <EntityList cards={filtered.map((entity) => ({ entity }))} />
  {/snippet}
</EntityListControls>
```

## Source

- Component: [apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte)
- Types: [apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.type.ts)
