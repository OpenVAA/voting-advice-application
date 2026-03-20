<!--
@component
Create navigation menus for the application in a predefined style.

### Properties

- `hidden`: Set to `true` to whenever the navigation is hidden. Default: `false`
- Any valid attributes of a `<nav>` element.

### Snippets

- children: The content of the navigation menu. It should mainly consist of `<NavGroup>` components containing `<NavItem>` components.

### Callback Props

- `onKeyboardFocusOut`: Called when the component loses a keyboard user's
  focus. This can be used to automatically close a drawer menu this is
  contained in.

### Usage

```tsx
<Navigation aria-label="Main navigation" onKeyboardFocusOut={closeDrawer}>
  <NavGroup>
    <NavItem href={$getRoute(ROUTE.Info)} icon="info" text="Show info"/>
    <NavItem onclick={(e) => foo(e)} text="Do foo"/>
    <div>Some other content</div>
  </NavGroup>
  <NavGroup>
    <NavItem href={$getRoute(ROUTE.Help)} icon="help" text="Show help"/>
  </NavGroup>
</Navigation>
```
-->

<svelte:options runes />

<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import { onKeyboardFocusOut } from '$lib/utils/onKeyboardFocusOut';
  import type { NavigationProps } from './Navigation.type';

  let {
    hidden = false,
    onKeyboardFocusOut: onKeyboardFocusOutCallback = undefined,
    children,
    ...restProps
  }: NavigationProps = $props();

  // Call the `onKeyboardFocusOut` callback when the component loses focus
  // This can be used to automatically close a drawer menu this is
  // contained in
  function keyboardFocusOut() {
    onKeyboardFocusOutCallback?.();
  }
</script>

<nav
  use:onKeyboardFocusOut={keyboardFocusOut}
  data-testid="nav-menu"
  {...concatClass(restProps, 'min-h-full w-4/5 max-w-sm bg-base-100')}
  class:hidden>
  {@render children?.()}
</nav>
