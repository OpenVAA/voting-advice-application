<!--
@component
Use to group `NavItem` components. Displays a faint line above the group.

### Properties

- `title`: Optional title for the navigation group.
- Any valid attributes of a `<ul>` element.

### Snippets

- children: The contents of the navigation group. Should be mostly `<NavItem>` components.

### Usage

```tsx
<NavGroup>
  <NavItem href={$getRoute(ROUTE.Info)} icon="info" text="Show info"/>
  <NavItem onclick={(e) => foo(e)} text="Do foo"/>
  <div>Some other content</div>
</NavGroup>
```
-->

<svelte:options runes />

<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import type { NavGroupProps } from './NavGroup.type';

  let {
    title,
    children,
    ...restProps
  }: NavGroupProps = $props();
</script>

<!-- We use a <section> with an Aria role instead of a <ul> or similar
  because otherwise generic content passed via the slot might include
  invalid content for such an element. See:
  https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/listitem_role -->

<section
  role="list"
  {...concatClass(
    restProps,
    'before:content-[""] before:mx-16 before:my-md before:block before:border-t-md before:border-t-[var(--line-color)]'
  )}>
  {#if title}
    <h4 class="small-label py-sm flex items-center pl-[2.75rem]">{title}</h4>
  {/if}
  {@render children?.()}
</section>
