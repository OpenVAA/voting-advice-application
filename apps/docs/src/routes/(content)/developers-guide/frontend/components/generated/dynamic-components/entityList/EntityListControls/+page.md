# EntityListControls

Show filter, sorting (TBA) and search tools for an associated `<EntityList>`.

TODO: Consider moving the tracking events away from the component and just adding callbacks that the consumer can use to trigger tracking events.

### Properties

- `entities`: A list of possibly ranked entities, e.g. candidates or a parties.
- `filterGroup`: The filters applied to the contents.
- `searchProperty`: The property used for the search tool. Default: `'name'`
- `onUpdate`: Callback for when the filters are applied.
- Any valid attributes of a `<div>` element.

### Tracking events

- `filters_reset`
- `filters_active` with `activeFilters` listing the (localized) names of the currently active filters

### Usage

```tsx
<EntityListControls entities={allParties} bind:output={filteredParties} />
```

## Source

[frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte)

[frontend/src/lib/dynamic-components/entityList/EntityListControls.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityList/EntityListControls.type.ts)
