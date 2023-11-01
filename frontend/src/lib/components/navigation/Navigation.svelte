<script lang="ts">
  import type {NavigationProps} from './Navigation.type';

  type $$Props = NavigationProps;
</script>

<!--
@component
Create navigation menus for the application in a predefined style.

### Slots

- default: The content of the navigation menu. It should mainly consist
  of `<NavGroup>` components containing `<NavItem>` components.

### Properties

- Any valid attributes of a `<nav>` element.

### Usage

```tsx
<Navigation aria-label="Main navigation">
  <NavGroup>
    <NavItem href="/info" icon="info">Show info</NavItem>
    <NavItem on:click={(e) => foo(e)}>Do foo</NavItem>
    <div>Some other content</div>
  </NavGroup>
  <NavGroup>
    <NavItem href="/help" icon="help">Show help</NavItem>
  </NavGroup>
</Navigation>
```
-->

<nav {...$$restProps}>
  <slot />
</nav>
