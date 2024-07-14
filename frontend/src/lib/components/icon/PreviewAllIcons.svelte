<script lang="ts">
  import Icon from './Icon.svelte';
  import { ICONS } from './icons';

  // We need this clunky typing to get rid of warnings below
  const entries: Array<[keyof typeof ICONS, readonly [string, string]]> = Object.entries(ICONS).map(
    ([name, path]) => [name as keyof typeof ICONS, path]
  );
</script>

<!--
@component
A utility component to see all the available icons at a glance. You can supply
any valid props to the icons.

### Usage

```tsx
  <PreviewAllIcons size="lg" />
```
-->

{#each entries as [name, path]}
  <div>
    <Icon {name} {...$$restProps} />
    <span>{name} (<code>svg/{path.join('/')}.ts</code>)</span>
  </div>
{/each}
