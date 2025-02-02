<!-- 
@component
A componend used to group `Input`-components together.

NB. Only single-row `Input`s are joined and they should not have the `info` property set.

### Properties

- `title`: Optional title for the group.
- `info`: Optional info text for the group.

### Slots

- default: The `Input` components to group.

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
  import { concatClass } from '$lib/utils/components';
  import type { InputGroupProps } from './InputGroup.type';
  import { infoClass, joinGap, outsideLabelClass } from './shared';


  type $$Props = InputGroupProps;

  export let title: $$Props['title'] = undefined;
  export let info: $$Props['info'] = undefined;

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  
</script>

<fieldset {...concatClass($$restProps, '')}>
  {#if title}
    <legend class={outsideLabelClass}>
      {title}
    </legend>
  {/if}
  <div class="flex flex-col items-stretch {joinGap} vaa-input-container">
    <slot />
  </div>
  {#if info}
    <div class={infoClass}>
      {info}
    </div>
  {/if}
</fieldset>

<style lang="postcss">
:global(.vaa-input-container > :not(:first-child) .vaa-group-join-item) {
  @apply rounded-t-none;
}
:global(.vaa-input-container > :not(:last-child) .vaa-group-join-item) {
  @apply rounded-b-none;
}
</style>