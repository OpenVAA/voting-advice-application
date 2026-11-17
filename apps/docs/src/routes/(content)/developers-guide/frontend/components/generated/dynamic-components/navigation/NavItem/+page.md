# NavItem

Outputs a navigation item for use inside a `<NavGroup>` which in turn is used within a `<Navigation>` component.

The item is rendered as an `<a>` element if `href` is supplied. Otherwise a `<button>` element will be used. Be sure to provide an `onclick` handler or other way of making the item interactive.

A disabled item given a `disabledReason` stays operable instead: it is rendered as a `<button>` announced as unavailable, and a click on it shows the reason under it and a second click hides it. The click neither navigates, calls `onclick` nor closes the menu. The reason is shown in a polite live region the button names in `aria-controls`, so it is announced when it is shown.

### Dynamic component

Accesses `LayoutContext`.

### Properties

- `icon`: The optional name of the icon to use with the navigation item. See the `Icon` component for more details.
- `text`: The text to display in the navigation item.
- `disabled`: Whether the button is disabled. This can also be used with items rendered as `<a>` elements.
- `disabledReason`: The sentence a click on the disabled item shows under it. With it, the disabled item stays operable.
- `disabledReasonProps`: Any valid attributes of the `<p>` element that holds the shown reason.
- `autoCloseNav`: Whether the menu available from the page context should be closed when the item is clicked. Default: `true`
- Any valid attributes of either an `<a>` or `<button>` element depending whether `href` was defined or not, respectively.

### Usage

```tsx
<NavItem href={getRoute.current(ROUTE.Info)} icon="info" text="Show info"/>
<NavItem onclick={(e) => foo(e)} text="Do foo"/>
<NavItem href={getRoute.current(ROUTE.Preview)} text="Preview" disabled disabledReason="Answer the questions first."/>
```

## Source

- Component: [apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte)
- Types: [apps/frontend/src/lib/dynamic-components/navigation/NavItem.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/navigation/NavItem.type.ts)
