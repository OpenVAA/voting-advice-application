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

<script lang="ts">
  import { setContext } from 'svelte';
  import { concatClass } from '$lib/utils/components';
  import { NAV_GROUP_CONTEXT_KEY } from './navGroupContext';
  import type { NavGroupProps } from './NavGroup.type';

  let { title, children, ...restProps }: NavGroupProps = $props();

  // reason: SSR-safe per-instance ID — Svelte 5.20.0+. Hydration-consistent (server-rendered value matches client-rendered value).
  const titleId = $props.id();

  // reason: Top-level call — runs during component init when current_component is bound (RESEARCH §Pitfall 3). Pushes parent-marker context BEFORE children render so NavItem can read it.
  setContext(NAV_GROUP_CONTEXT_KEY, true);
</script>

<!-- reason: <section> preserved for `:before` line-separator CSS; role="list" migrated to inner <div> for axe `list` rule compliance (Phase 80 D-02). -->
<section
  {...concatClass(
    restProps,
    'before:content-[""] before:mx-16 before:my-md before:block before:border-t-md before:border-t-[var(--line-color)]'
  )}>
  {#if title}
    <h4 id={titleId} class="small-label py-sm flex items-center pl-[2.75rem]">{title}</h4>
  {/if}
  <div role="list" aria-labelledby={title ? titleId : undefined}>
    {@render children?.()}
  </div>
</section>
