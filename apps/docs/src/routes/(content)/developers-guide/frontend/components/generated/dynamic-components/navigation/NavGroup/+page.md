# NavGroup

Use to group `NavItem` components. Displays a faint line above the group.

### Properties

- `title`: Optional title for the navigation group.
- Any valid attributes of a `<ul>` element.

### Snippets

- children: The contents of the navigation group. Should be mostly `<NavItem>` components.

### Usage

```tsx
<NavGroup>
  <NavItem href={getRoute.current(ROUTE.Info)} icon="info" text="Show info" />
  <NavItem onclick={(e) => foo(e)} text="Do foo" />
  <div>Some other content</div>
</NavGroup>
```

## Source

[apps/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte)

[apps/frontend/src/lib/dynamic-components/navigation/NavGroup.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/navigation/NavGroup.type.ts)
