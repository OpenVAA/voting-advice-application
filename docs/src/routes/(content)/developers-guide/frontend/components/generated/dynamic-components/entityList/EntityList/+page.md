# EntityList

Show a list of possibly wrapped entities with pagination and defined actions.

### Dynamic component

This is a dynamic component, because it renders the dynamic `EntityCard` component.

### Properties

- `cards`: The properties for the `EntityCard`s to show.
- `itemsPerPage`: The number of entities to display on each page of the list. @default `50`
- `itemsTolerance`: The fraction of `itemsPerPage` that can be exceeded on the last page to prevent showing a short last page. @default `0.2`
- `scrollIntoView`: Whether to scroll loaded items into view. This may results in glitches when the list is contained in a modal. @default `true`
- Any valid attributes of a `<div>` element.

### Bindable properties

- `itemsShown`: The number of items currently shown in the list.

### Accessibility

- Loading more items happens using a basic `<button>`, which becomes invisible to when clicked but remains in the DOM.

### Usage

```tsx
<h2>{itemsShown} candidates of {candidates.length}</h2>
<EntityList
  bind:itemsShown
  contents={candidates}
  actionCallBack={({id}) => $getRoute({route: ROUTE.Candidate, id})}/>
```

## Source

[frontend/src/lib/dynamic-components/entityList/EntityList.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityList/EntityList.svelte)

[frontend/src/lib/dynamic-components/entityList/EntityList.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityList/EntityList.type.ts)
