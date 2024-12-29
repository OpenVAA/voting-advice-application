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

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import type { NumericEntityFilterProps } from './NumericEntityFilter.type';

  type $$Props = NumericEntityFilterProps;

  export let filter: $$Props['filter'];
  export let targets: $$Props['targets'];

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Filtering
  ////////////////////////////////////////////////////////////////////

  let min: number;
  let max: number;
  let includeMissing = true;

  // Initialize values and possibly saved filter state
  const range = filter.parseValues(targets);
  updateValues();

  // Update selection when filter values change
  filter.onChange(updateValues);

  // Cleanup
  onDestroy(() => filter.onChange(updateValues, false));

  $: {
    filter.min = range?.min == null || range.min === min ? undefined : min;
    filter.max = range?.max == null || range.max === max ? undefined : max;
    filter.excludeMissing = !includeMissing;
  }

  ////////////////////////////////////////////////////////////////////
  // Functions
  ////////////////////////////////////////////////////////////////////

  function setMax() {
    if (min > max) min = max;
  }

  function setMin() {
    if (max < min) max = min;
  }

  function updateValues() {
    if (range.min != null && range.max != null) {
      min = filter.min ?? range.min;
      max = filter.max ?? range.max;
    }
  }
</script>

{#if (range.min != null && range.max != null) || range.missingValues}
  <form {...concatClass($$restProps, '')}>
    {#if range.min != null && range.max != null}
      <label class="label gap-xs !px-0">
        <span class="text-label min-w-[6rem] text-start">{$t('entityFilters.numeric.minLabel')}</span>
        <input bind:value={min} on:change={setMin} type="range" min={range.min} max={range.max} class="range" />
        <span class="w-[5rem] text-end">{min}</span>
      </label>
      <label class="label gap-xs !px-0">
        <span class="text-label min-w-[6rem] text-start">{$t('entityFilters.numeric.maxLabel')}</span>
        <input bind:value={max} on:change={setMax} type="range" min={range.min} max={range.max} class="range" />
        <span class="w-[5rem] text-end">{max}</span>
      </label>
    {/if}
    {#if range.missingValues}
      <label class="label gap-xs !px-0">
        <span class="text-label min-w-[6rem] justify-start text-start">{$t('entityFilters.missingValue')}</span>
        <!-- Disable the missing values selection if there are only missing values -->
        <input
          bind:checked={includeMissing}
          type="checkbox"
          class="checkbox"
          disabled={range.min == null || range.max == null} />
      </label>
    {/if}
  </form>
{:else}
  <div class="w-full text-center text-warning">{$t('entityFilters.error')}</div>
{/if}
