# NavItem

Outputs a navigation item for use inside a `<NavGroup>` which in turn is used within a `<Navigation>` component.

The item is rendered as an `<a>` element if `href` is supplied. Otherwise a `<button>` element will be used. Be sure to provde an `on:click` event handler or other way of making the item interactive.

### Dynamic component

Accesses `LayoutContext`.

### Properties

- `icon`: The optional name of the icon to use with the navigation item. See the `Icon` component for more details.
- `text`: The text to display in the navigation item.
- `disabled`: Whether the button is disabled. This can also be used with items rendered as `<a>` elements.
- `autoCloseNav`: Whether the menu available from the page context should be closed when the item is clicked. Default: `true`
- Any valid attributes of either an `<a>` or `<button>` element depending whether `href` was defined or not, respectively.

### Usage

```tsx
<NavItem href={$getRoute(ROUTE.Info)} icon="info" text="Show info"/>
<NavItem on:click={(e) => foo(e)} text="Do foo"/>
```

## Source

[frontend/src/lib/dynamic-components/navigation/NavItem.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/navigation/NavItem.svelte)

[frontend/src/lib/dynamic-components/navigation/NavItem.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/navigation/NavItem.type.ts)
