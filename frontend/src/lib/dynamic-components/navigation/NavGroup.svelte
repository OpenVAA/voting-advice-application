<!--
@component
Use to group `NavItem` components. Displays a faint line above the group.

### Properties

- `title`: Optional title for the navigation group.
- Any valid attributes of a `<ul>` element.

### Slots

- default: The contents of the navigation group. Should be mostly `<NavItem>` components.

### Usage

```tsx
<NavGroup>
  <NavItem href={$getRoute(ROUTE.Info)} icon="info">Show info</NavItem>
  <NavItem on:click={(e) => foo(e)}>Do foo</NavItem>
  <div>Some other content</div>
</NavGroup>
```
-->

<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import type { NavGroupProps } from './NavGroup.type';

  type $$Props = NavGroupProps;

  export let title: $$Props['title'] = undefined;
</script>

<!-- We use a <section> with an Aria role instead of a <ul> or similar
  because otherwise generic content passed via the slot might include
  invalid content for such an element. See: 
  https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/listitem_role -->

<section
  role="list"
  {...concatClass(
    $$restProps,
    'before:content-[""] before:mx-16 before:my-md before:block before:border-t-md before:border-t-[var(--line-color)]'
  )}>
  {#if title}
    <h4 class="small-label flex items-center py-sm pl-[2.75rem]">{title}</h4>
  {/if}
  <slot />
</section>
