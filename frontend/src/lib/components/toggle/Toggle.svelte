<script lang="ts">
  import { Icon } from '$lib/components/icon';
  import { concatClass } from '$lib/utils/components';
  import type { ToggleProps } from './Toggle.type';

  type $$Props = ToggleProps;

  export let label: $$Props['label'];
  export let options: $$Props['options'];
  export let selected: $$Props['selected'] = undefined;
</script>

<!--
@component
Display a short list of options as toggleable text or icon buttons from which one can be selected. Semantically a `<fieldset>` with radio buttons.

### Properties

- `label`: The aria label for the toggle.
- `options`: The options for the toggle. Each must contain a `key` and a `label` property. If an `icon` property is provided, the option will be rendered as an icon button. The `label` is still required and will be used for a screen-reader-only label.
- Any valid attributes of a `<fieldset>` element.

### Bindable properties

- `selected`: The currently selected option `key` of the toggle. Bind to this to get the currently selected value.

### Usage

```tsx
<script lang="ts">
  // Text toggle
  const options = [
    {
      label: 'Text',
      key: 'text'
    },
    {
      label: 'Video',
      key: 'video'
    }
  ];
  let selected: string;
</script>
<Toggle bind:selected label="Switch between video and text display" {options}/>

<script lang="ts">
  // Icon toggle
  const iconOptions = [
    {
      label: 'Text',
      icon: 'text',
      key: 'text'
    },
    {
      label: 'Video',
      icon: 'video',
      key: 'video'
    }
  ];
  let selected: string;
</script>
<Toggle bind:selected label="Switch between video and text display" {options}/>

```
-->

<fieldset
  role="radiogroup"
  title={label}
  {...concatClass(
    $$restProps,
    'flex flex-row items-center bg-base-100 rounded-full p-2 border-md border-neutral focus-within:ring focus-within:ring-offset-2'
  )}>
  <legend class="sr-only">{label}</legend>
  {#each options as option}
    <label class="small-label rounded-full px-8 py-4">
      <input tabindex="0" type="radio" name="toggle-options" value={option.key} bind:group={selected} class="sr-only" />
      {#if option.icon}
        <Icon name={option.icon} size="sm" />
      {/if}
      <span class:sr-only={option.icon != null}>{option.label}</span>
    </label>
  {/each}
</fieldset>

<style lang="postcss">
  label:has(input:checked) {
    @apply bg-neutral text-primary-content;
  }
</style>
