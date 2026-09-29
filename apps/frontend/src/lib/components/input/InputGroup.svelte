<!--
@component A component used to group `Input`-components together.

NB. Only single-row `Input`s are joined and they should not have the `info` property set.

### Properties

- `title`: Optional title for the group.
- `info`: Optional info text for the group.

### Snippet Props

- `children`: The `Input` components to group.

### Usage

```tsx
<InputGroup title="Nominations" info="These are placeholders.">
  <Input type="text" label="First nomination" />
  <Input type="text" label="Second nomination" />
  <Input type="text" label="Third nomination" />
</InputGroup>
```
-->

<script lang="ts">
  import { cn, concatClass } from '$lib/utils/components';
  import { infoClass, joinGap, outsideLabelClass } from './shared';
  import type { InputGroupProps } from './InputGroup.type';

  let { title, info, children, ...restProps }: InputGroupProps = $props();
</script>

<fieldset {...concatClass(restProps, '')}>
  {#if title}
    <legend class={outsideLabelClass}>
      {title}
    </legend>
  {/if}
  <div
    class={cn(
      'flex flex-col items-stretch',
      joinGap,
      '[&>:not(:first-child)_.vaa-group-join-item]:rounded-t-none',
      '[&>:not(:last-child)_.vaa-group-join-item]:rounded-b-none'
    )}>
    {@render children?.()}
  </div>
  {#if info}
    <div class={infoClass}>
      {info}
    </div>
  {/if}
</fieldset>
