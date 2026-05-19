# EntityChildren

Used to show an entity's children in an `EntityDetails` component.

### Properties

- `entities`: An array of possibly ranked entities, e.g. a party's candidates.
- `entityType`: The type of the entities being displayed. Used to pick correct translations.
- `action`: An optional callback for building the card actions for the child possible entities. If nullish, the default action filled in by `EntityCard` will be used. If `false`, no actions will be added.
- Any valid attributes of a `<div>` element

### Usage

```tsx
<EntityChildren entities={organizationNomination.nominatedCandidates} />
```

## Source

[frontend/src/lib/dynamic-components/entityDetails/EntityChildren.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityDetails/EntityChildren.svelte)

[frontend/src/lib/dynamic-components/entityDetails/EntityChildren.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityDetails/EntityChildren.type.ts)
