# EntityFilters

Show filters for entities. This component and the individual filter components only display the UI for the filters and handle their rule updates. To access the results of the filters, you have to apply the filters to the targets.

### Properties

- `filterGroup`: The filters applied to the contents.
- `targets`: The target entitiess of the filter objects. Note that these will only be used to get value options, not for actual filtering.
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<EntityFilters {filters} targets={candidates}/>
```

## Source

[frontend/src/lib/components/entityFilters/EntityFilters.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/entityFilters/EntityFilters.svelte)

[frontend/src/lib/components/entityFilters/EntityFilters.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/entityFilters/EntityFilters.type.ts)
