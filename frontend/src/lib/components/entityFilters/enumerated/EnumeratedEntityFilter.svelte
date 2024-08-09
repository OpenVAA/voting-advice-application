<script lang="ts">
  import {onDestroy} from 'svelte';
  import {isMissing, type Choice, MISSING_VALUE, type MaybeMissing} from '$voter/vaa-filters';
  import {t} from '$lib/i18n';
  import {concatProps, getUUID} from '$lib/utils/components';
  import {logDebugError} from '$lib/utils/logger';
  import type {EnumeratedEntityFilterProps} from './EnumeratedEntityFilter.type';
  import {Icon} from '$lib/components/icon';

  type $$Props = EnumeratedEntityFilterProps;

  export let filter: $$Props['filter'];
  export let targets: $$Props['targets'];

  /** A unique name for the input group */
  const name = getUUID();

  /** A unique input.value for missing values */
  const missingValue = getUUID();

  // Initialize values and possibly saved filter state
  const values = filter.parseValues(targets);
  let selected: string[] | MaybeMissing<number>[];
  updateSelected();

  /** Track whether `toggleSelectAll()` will select or deselect all */
  let allSelected: boolean;
  $: allSelected = selected.length === values.length;

  // Update filter values when selection changes
  $: filter.include = parseSelected(selected);

  // Update selection when filter values change
  filter.onChange(updateSelected);

  // Cleanup
  onDestroy(() => filter.onChange(updateSelected, false));

  /**
   * Update the selected checkboxes so that they reflect the filter state
   */
  function updateSelected() {
    selected = convertMissingForInputs(
      filter.include?.length ? filter.include : values.map((v) => v.value)
    );
  }

  /**
   * Parse the selected checkboxes into values accepted by `filter.include`
   * @param selectedValues We need to explicitly pass this to trigger reactive updates
   * @returns The selected values for `filter.include`
   */
  function parseSelected(selectedValues: typeof selected) {
    return selectedValues.length === values.length
      ? undefined
      : convertMissingForFilter(selectedValues);
  }

  /**
   * Check or uncheck all checkboxes
   */
  function toggleSelectAll() {
    selected = allSelected ? [] : convertMissingForInputs(values.map((v) => v.value));
  }

  /**
   * Convert possibly missing values for use in `<input>` elements
   */
  function convertMissingForInputs(filterValues: MaybeMissing<string | number>[]) {
    return filterValues.map((v) => (isMissing(isMissing) ? missingValue : v));
  }

  /**
   * Convert possibly missing values for passing to `filter.include`
   */
  function convertMissingForFilter(inputValues: typeof selected) {
    return inputValues.map((v) => (v === missingValue ? MISSING_VALUE : v));
  }

  /**
   * Get the text label from the object returned by the filter.
   * @param object party object or choice
   */
  function getLabel(object: PartyProps | Choice | undefined): string | undefined {
    if (!object) return $t('entityFilters.missingValue');
    if ('name' in object) return object.name;
    if ('label' in object) return object.label;
    logDebugError(
      `EnumeratedEntityFilter: entity's answer resulted in an invalid object: ${object}`
    );
    return undefined;
  }
</script>

<!--
@component
Render an enumerated filter for entities that displays a list of values to include in the results. These can be, for example, parties or answers to enumerated questions, like gender or language. The filter works for both single and multiple selection questions.

### Properties

- `filter`: The filter object
- `targets`: An array of target entities or rankings
- Any valid attributes of a `<form>` element

### Usage

```tsx
<EnumeratedEntityFilter {filter} targets={candidates}/>
```
-->

<form
  {...concatProps($$restProps, {
    class: 'grid grid-flow-row gap-x-xl gap-y-sm items-start',
    style: 'grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));'
  })}>
  {#each values as { value, object, count }}
    {@const label = getLabel(object)}
    {#if label != null}
      <label class="label cursor-pointer !items-start gap-sm !p-0">
        <input type="checkbox" class="checkbox" {value} bind:group={selected} {name} />
        <span class="label-text w-full pt-2 text-left">
          {label} <span class="pl-sm text-secondary">{count}</span>
        </span>
      </label>
    {/if}
  {/each}
  {#if values.length > 3}
    <div class="col-span-full mt-md">
      <button
        on:click={() => toggleSelectAll()}
        class="label cursor-pointer !items-start gap-sm !p-0 text-primary">
        <div class="w-[1.5rem]">
          <Icon name={allSelected ? 'uncheckAll' : 'checkAll'} />
        </div>
        <span class="label-text w-full pt-2 text-left text-primary">
          {allSelected ? $t('entityFilters.unselectAll') : $t('entityFilters.selectAll')}
        </span>
      </button>
    </div>
  {/if}
</form>
