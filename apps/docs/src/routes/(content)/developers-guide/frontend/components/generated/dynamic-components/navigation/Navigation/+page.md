# Navigation

Create navigation menus for the application in a predefined style.

### Properties

- `hidden`: Set to `true` to whenever the navigation is hidden. Default: `false`
- Any valid attributes of a `<nav>` element.

### Snippets

- children: The content of the navigation menu. It should mainly consist of `<NavGroup>` components containing `<NavItem>` components.

### Callback Props

- `onKeyboardFocusOut`: Called when the component loses a keyboard user's
  focus. This can be used to automatically close a drawer menu this is contained in.

### Usage

```tsx
<Navigation aria-label="Main navigation" onKeyboardFocusOut={closeDrawer}>
  <NavGroup>
    <NavItem href={getRoute.current(ROUTE.Info)} icon="info" text="Show info" />
    <NavItem onclick={(e) => foo(e)} text="Do foo" />
    <div>Some other content</div>
  </NavGroup>
  <NavGroup>
    <NavItem href={getRoute.current(ROUTE.Help)} icon="help" text="Show help" />
  </NavGroup>
</Navigation>
```

## Source

[apps/frontend/src/lib/dynamic-components/navigation/Navigation.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/navigation/Navigation.svelte)

[apps/frontend/src/lib/dynamic-components/navigation/Navigation.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/navigation/Navigation.type.ts)
