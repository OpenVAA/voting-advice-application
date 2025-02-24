<!--
@component
Render a text filter for entities.

### Properties

- `filter`: The text filter object to render.
- `placeholder`: The placeholder text. @default `$t('entityFilters.text.placeholder')`
- Any valid attributes of a `<div>` element

### Usage

```tsx
<TextEntityFilter {filter}/>
```
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Icon } from '$lib/components/icon';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import type { TextEntityFilterProps } from './TextEntityFilter.type';

  type $$Props = TextEntityFilterProps;

  export let filter: $$Props['filter'];
  export let placeholder: $$Props['placeholder'] = undefined;
  export let variant: $$Props['variant'] = 'default';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Filtering
  ////////////////////////////////////////////////////////////////////

  let value: string;
  updateText();

  // Update filter values when selection changes
  $: filter.include = value;

  // Update selection when filter values change
  filter.onChange(updateText);

  // Cleanup
  onDestroy(() => filter.onChange(updateText, false));

  ////////////////////////////////////////////////////////////////////
  // Functions
  ////////////////////////////////////////////////////////////////////

  function updateText() {
    value = filter.include;
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  let labelClass: string;
  $: {
    labelClass = 'input flex items-center gap-2';
    switch (variant) {
      case 'discrete':
        labelClass += ' bg-base-200';
        break;
      default:
        labelClass += ' input-bordered';
    }
  }
</script>

<div {...concatClass($$restProps, '')}>
  <label class={labelClass}>
    <span class="sr-only">{$t('entityFilters.text.ariaLabel')}</span>
    <input
      bind:value
      type="text"
      class="w-full grow"
      placeholder={placeholder ?? $t('entityFilters.text.placeholder')} />
    {#if value === ''}
      <Icon name="search" />
    {:else}
      <button on:click={() => (value = '')} aria-label={$t('common.clear')} title={$t('common.clear')}>
        <Icon name="close" />
      </button>
    {/if}
  </label>
</div>
