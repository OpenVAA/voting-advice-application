# NavGroup

Use to group `NavItem` components. Displays a faint line above the group.

### Properties

- `title`: Optional title for the navigation group.
- Any valid attributes of a `<ul>` element.

### Slots

- default: The contents of the navigation group. Should be mostly `<NavItem>` components.

### Usage

```tsx
<NavGroup>
  <NavItem href={$getRoute(ROUTE.Info)} icon="info">
    Show info
  </NavItem>
  <NavItem on:click={(e) => foo(e)}>Do foo</NavItem>
  <div>Some other content</div>
</NavGroup>
```

## Source

[frontend/src/lib/dynamic-components/navigation/NavGroup.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte)

[frontend/src/lib/dynamic-components/navigation/NavGroup.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/navigation/NavGroup.type.ts)
