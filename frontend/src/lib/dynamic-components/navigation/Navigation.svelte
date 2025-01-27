<!--
@component
Create navigation menus for the application in a predefined style.

### Slots

- default: The content of the navigation menu. It should mainly consist
  of `<NavGroup>` components containing `<NavItem>` components.

### Properties

- `hidden`: Set to `true` to whenever the navigation is hidden. @default false
- Any valid attributes of a `<nav>` element.

### Events

- `keyboardFocusOut`: Emitted when the component loses a keyboard user's 
  focus. This can be used   to automatically close a drawer menu this is 
  contained in.

### Usage

```tsx
<Navigation aria-label="Main navigation" on:keyboardFocusOut={closeDrawer}>
  <NavGroup>
    <NavItem href={$getRoute(ROUTE.Info)} icon="info">Show info</NavItem>
    <NavItem on:click={(e) => foo(e)}>Do foo</NavItem>
    <div>Some other content</div>
  </NavGroup>
  <NavGroup>
    <NavItem href={$getRoute(ROUTE.Help)} icon="help">Show help</NavItem>
  </NavGroup>
</Navigation>
```
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onKeyboardFocusOut } from '$lib/utils/onKeyboardFocusOut';
  import { concatClass } from '$lib/utils/components';
  import type { NavigationProps } from './Navigation.type';

  type $$Props = NavigationProps;

  export let hidden: $$Props['hidden'] = false;

  // Dispatch a `keyboardFocusOut` event when the component loses focus
  // This can be used to automatically close a drawer menu this is
  // contained in
  const dispatch = createEventDispatcher();
  function keyboardFocusOut() {
    dispatch('keyboardFocusOut');
  }
</script>

<nav 
  use:onKeyboardFocusOut={keyboardFocusOut} 
  {...concatClass($$restProps, 'min-h-full w-4/5 max-w-sm bg-base-100')}
  class:hidden={hidden}>
  <slot />
</nav>