<script lang="ts">
  import {createEventDispatcher} from 'svelte';
  import type {NavigationProps} from './Navigation.type';

  type $$Props = NavigationProps;

  // Dispatch a `navFocusOut` event when the component loses focus
  // This can be used to automatically close a drawer menu this is
  // contained in
  let navElement: HTMLElement;
  const dispatch = createEventDispatcher();
  function onFocusOut(event: FocusEvent) {
    if (
      event.relatedTarget == null ||
      !(event.relatedTarget instanceof Node) ||
      !navElement.contains(event.relatedTarget)
    ) {
      dispatch('navFocusOut', {relatedTarget: event.relatedTarget});
    }
  }
</script>

<!--
@component
Create navigation menus for the application in a predefined style.

### Slots

- default: The content of the navigation menu. It should mainly consist
  of `<NavGroup>` components containing `<NavItem>` components.

### Properties

- Any valid attributes of a `<nav>` element.

### Events

- `navFocusOut`: Emitted when the component loses focus. This can be used 
  to automatically close a drawer menu this is contained in. The event
  `detail` is of type `{relatedTarget: FocusEvent['relatedTarget']}`.

### Usage

```tsx
<Navigation aria-label="Main navigation" on:navFocusOut={closeDrawer}>
  <NavGroup>
    <NavItem href={getRoute(Route.Info)} icon="info">Show info</NavItem>
    <NavItem on:click={(e) => foo(e)}>Do foo</NavItem>
    <div>Some other content</div>
  </NavGroup>
  <NavGroup>
    <NavItem href={getRoute(Route.Help)} icon="help">Show help</NavItem>
  </NavGroup>
</Navigation>
```
-->

<nav bind:this={navElement} on:focusout={onFocusOut} {...$$restProps}>
  <slot />
</nav>
