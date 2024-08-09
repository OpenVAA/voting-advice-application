<script lang="ts">
  import { onDestroy } from 'svelte';
  import { t } from '$lib/i18n';
  import { concatClass } from '$lib/utils/components';
  import type { NumericEntityFilterProps } from './NumericEntityFilter.type';

  type $$Props = NumericEntityFilterProps;

  export let filter: $$Props['filter'];
  export let targets: $$Props['targets'];

  let min: number;
  let max: number;

  // Initialize values and possibly saved filter state
  const range = filter.parseValues(targets);
  updateValues();

  // Update selection when filter values change
  filter.onChange(updateValues);

  // Cleanup
  onDestroy(() => filter.onChange(updateValues, false));

  $: {
    filter.min = !range || range.min === min ? undefined : min;
    filter.max = !range || range.max === max ? undefined : max;
  }

  function setMax() {
    if (min > max) min = max;
  }

  function setMin() {
    if (max < min) max = min;
  }

  function updateValues() {
    if (!range) return;
    min = filter.min ?? range.min;
    max = filter.max ?? range.max;
  }
</script>

<!--
@component
Render a numeric filter for entities.

### Properties

- `filter`: The filter object
- `targets`: An array of target entities or rankings
- Any valid attributes of a `<form>` element

### Usage

```tsx
<NumericEntityFilter {filter} targets={candidates}/>
```
-->

{#if range}
  <form {...concatClass($$restProps, '')}>
    <label class="label">
      <span class="text-label min-w-[6rem]">{$t('components.entityFilters.numeric.minLabel')}</span>
      <input
        bind:value={min}
        on:change={setMin}
        type="range"
        min={range.min}
        max={range.max}
        class="range" />
      <span class="w-[5rem] text-end">{min}</span>
    </label>
    <label class="label">
      <span class="text-label min-w-[6rem]">{$t('components.entityFilters.numeric.maxLabel')}</span>
      <input
        bind:value={max}
        on:change={setMax}
        type="range"
        min={range.min}
        max={range.max}
        class="range" />
      <span class="w-[5rem] text-end">{max}</span>
    </label>
  </form>
{:else}
  <div class="w-full text-center text-warning">{$t('components.entityFilters.numeric.error')}</div>
{/if}
