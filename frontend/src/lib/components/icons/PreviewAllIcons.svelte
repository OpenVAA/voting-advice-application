<script lang="ts">
  import type {NamedIconProps} from '.';
  import * as iconsModule from '.';

  type $$Props = NamedIconProps;

  const icons = Object.entries(iconsModule)
    .filter((kv) => kv[0].endsWith('Icon'))
    .map(([k, v]) => ({name: k, component: v}));
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

{#each icons as { name, component }}
  <div>
    <svelte:component this={component} />
    <span>{name}</span>
  </div>
{/each}
