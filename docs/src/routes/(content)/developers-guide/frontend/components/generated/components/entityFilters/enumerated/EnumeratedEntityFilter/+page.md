# EnumeratedEntityFilter

Render an enumerated filter for entities that displays a list of values to include in the results. These can be, for example, parties or answers to enumerated questions, like gender or language. The filter works for both single and multiple selection questions.

### Properties

- `filter`: The filter object
- `targets`: An array of target entities or rankings
- Any valid attributes of a `<div>` element

### Usage

```tsx
<EnumeratedEntityFilter {filter} targets={candidates}/>
```

## Source

[frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte)

[frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.type.ts)
