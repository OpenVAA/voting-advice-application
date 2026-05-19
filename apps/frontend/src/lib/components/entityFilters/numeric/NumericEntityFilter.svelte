<!--
@component
Render a numeric filter for entities.

### Properties

- `filter`: The filter object
- `targets`: An array of target entities or rankings
- Any valid attributes of a `<div>` element

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

  let { filter, targets, ...restProps }: NumericEntityFilterProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Filtering
  ////////////////////////////////////////////////////////////////////

  let min: number = $state(0);
  let max: number = $state(0);
  let includeMissing = $state(true);

  // `filter` and `targets` are stable per parent contract:
  // EntityList remounts via {#key} on filter-scope change, so the
  // init-time read here matches the component lifecycle. No reactive
  // re-derivation needed.
  // svelte-ignore state_referenced_locally
  const range = filter.parseValues(targets);
  updateValues();

  // Update selection when filter values change
  // svelte-ignore state_referenced_locally
  filter.onChange(updateValues);

  // Cleanup
  onDestroy(() => filter.onChange(updateValues, false));

  $effect(() => {
    filter.min = range?.min == null || range.min === min ? undefined : min;
    filter.max = range?.max == null || range.max === max ? undefined : max;
    filter.excludeMissing = !includeMissing;
  });

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
  <div {...concatClass(restProps, '')}>
    {#if range.min != null && range.max != null}
      <label class="label gap-xs !px-0">
        <span class="text-label min-w-[6rem] text-start">{t('entityFilters.numeric.minLabel')}</span>
        <!-- bind: keep — two-way DOM range bind:value={min}; min is $state(0) -->
        <input bind:value={min} onchange={setMin} type="range" min={range.min} max={range.max} class="range" />
        <span class="w-[5rem] text-end">{min}</span>
      </label>
      <label class="label gap-xs !px-0">
        <span class="text-label min-w-[6rem] text-start">{t('entityFilters.numeric.maxLabel')}</span>
        <!-- bind: keep — two-way DOM range bind:value={max}; max is $state(0) -->
        <input bind:value={max} onchange={setMax} type="range" min={range.min} max={range.max} class="range" />
        <span class="w-[5rem] text-end">{max}</span>
      </label>
    {/if}
    {#if range.missingValues}
      <label class="label gap-xs !px-0">
        <span class="text-label min-w-[6rem] justify-start text-start">{t('entityFilters.missingValue')}</span>
        <!-- Disable the missing values selection if there are only missing values -->
        <!-- bind: keep — two-way DOM checkbox bind:checked={includeMissing}; includeMissing is $state(true) -->
        <input
          bind:checked={includeMissing}
          type="checkbox"
          class="checkbox"
          disabled={range.min == null || range.max == null} />
      </label>
    {/if}
  </div>
{:else}
  <div class="text-warning w-full text-center">{t('entityFilters.error')}</div>
{/if}
