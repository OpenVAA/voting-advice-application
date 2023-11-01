<script lang="ts">
  import type {NavGroupProps} from './NavGroup.type';

  type $$Props = NavGroupProps;

  // Merge classes into $$restProps
  $$restProps.class = `before:content-[''] before:mx-16 before:my-md before:block before:border-t-md before:border-t-[var(--line-color)] ${
    $$restProps.class ?? ''
  }`;
</script>

<!--
@component
TBA

### Slots

- default: The contents of the navigation group. Should be mostly 
  `<NavItem>` components.

### Properties

- Any valid attributes of a `<section>` element.

### Usage

```tsx
<NavGroup>
  <NavItem href="/info" icon="info">Show info</NavItem>
  <NavItem on:click={(e) => foo(e)}>Do foo</NavItem>
  <div>Some other content</div>
</NavGroup>
```
-->

<!-- We use a <section> with an Aria role instead of a <ul> or similar
  because otherwise generic content passed via the slot might include
  invalid content for such an element. See: 
  https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/listitem_role -->

<section role="list" {...$$restProps}>
  <slot />
</section>
