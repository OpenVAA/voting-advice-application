<!--
@component
Render a text filter for entities.

### Properties

- `filter`: The text filter object.
- `placeholder`: The placeholder text. Default: `t('components.entityFilters.text.placeholder')`
- `variant`: The styling variant for the text field. Default: `'default'`
- Any valid attributes of a `<div>` element.

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

  let { filter, placeholder, variant = 'default', ...restProps }: TextEntityFilterProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Filtering
  ////////////////////////////////////////////////////////////////////

  let value: string = $state(filter.include);

  // Update filter values when selection changes
  $effect(() => {
    filter.include = value;
  });

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

  let labelClass = $derived.by(() => {
    let lc = 'input flex items-center gap-2';
    switch (variant) {
      case 'discrete':
        lc += ' bg-base-200';
        break;
      default:
        break;
    }
    return lc;
  });
</script>

<div {...concatClass(restProps, '')}>
  <label class={labelClass}>
    <span class="sr-only">{t('entityFilters.text.ariaLabel')}</span>
    <input
      bind:value
      type="text"
      class="w-full grow"
      placeholder={placeholder ?? t('entityFilters.text.placeholder')} />
    {#if value === ''}
      <Icon name="search" />
    {:else}
      <button onclick={() => (value = '')} aria-label={t('common.clear')} title={t('common.clear')}>
        <Icon name="close" />
      </button>
    {/if}
  </label>
</div>
