<!--
@component
Render an enumerated filter for entities that displays a list of values to include in the results. These can be, for example, parties or answers to enumerated questions, like gender or language. The filter works for both single and multiple selection questions.

### Properties

- `filter`: The filter object
- `targets`: An array of target entities or rankings
- Any valid attributes of a `<div>` element

### Usage

```tsx
<EnumeratedEntityFilter {filter} targets={candidates}/>
```
-->

<script lang="ts">
  import { isMissing, type MaybeMissing, MISSING_VALUE } from '@openvaa/filters';
  import { onDestroy } from 'svelte';
  import { Icon } from '$lib/components/icon';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatProps, getUUID } from '$lib/utils/components';
  import { logDebugError } from '$lib/utils/logger';
  import type { AnyChoice, AnyEntityVariant } from '@openvaa/data';
  import type { EnumeratedEntityFilterProps } from './EnumeratedEntityFilter.type';

  type $$Props = EnumeratedEntityFilterProps;

  export let filter: $$Props['filter'];
  export let targets: $$Props['targets'];

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Initialize
  ////////////////////////////////////////////////////////////////////

  /** A unique name for the input group */
  const name = getUUID();

  /** A unique input.value for missing values */
  const missingValue = getUUID();

  // Initialize values and possibly saved filter state
  const values = filter.parseValues(targets);
  let selected: Array<MaybeMissing<string>>;
  /** Track whether `toggleSelectAll()` will select or deselect all */
  let allSelected: boolean;
  $: allSelected = selected.length === values.length;

  updateSelected();

  ////////////////////////////////////////////////////////////////////
  // Set filter
  ////////////////////////////////////////////////////////////////////

  // Update filter values when selection changes
  $: filter.include = parseSelected(selected);

  // Update selection when filter values change
  filter.onChange(updateSelected);

  // Clean up
  onDestroy(() => filter.onChange(updateSelected, false));

  ////////////////////////////////////////////////////////////////////
  // Functions
  ////////////////////////////////////////////////////////////////////

  /**
   * Update the selected checkboxes so that they reflect the filter state
   */
  function updateSelected() {
    selected = convertMissingForInputs(filter.include?.length ? filter.include : values.map((v) => v.value));
    // TODO[Svelte 5]: This extra setting may not be needed, but currently it's necessary
    allSelected = selected.length === values.length;
  }

  /**
   * Parse the selected checkboxes into values accepted by `filter.include`
   * @param selectedValues We need to explicitly pass this to trigger reactive updates
   * @returns The selected values for `filter.include`
   */
  function parseSelected(selectedValues: typeof selected) {
    return selectedValues.length === values.length ? undefined : convertMissingForFilter(selectedValues);
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
  function convertMissingForInputs(filterValues: Array<MaybeMissing<string>>) {
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
  function getLabel(object: AnyEntityVariant | AnyChoice | undefined): string | undefined {
    if (!object) return $t('entityFilters.missingValue');
    // Entity
    if ('shortName' in object) return object.shortName;
    // Choice
    if ('label' in object) return object.label;
    logDebugError(`EnumeratedEntityFilter: entity's answer resulted in an invalid object: ${object}`);
    return undefined;
  }
</script>

<div
  {...concatProps($$restProps, {
    class: 'grid grid-flow-row gap-x-xl gap-y-sm items-start',
    style: 'grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));'
  })}>
  {#each values as { value, object, count }}
    {@const label = getLabel(object)}
    {#if label != null}
      <label class="label cursor-pointer !items-start gap-sm !p-0">
        <!-- Disable the input if there is only one value -->
        <input type="checkbox" class="checkbox" {value} bind:group={selected} {name} disabled={values.length === 1} />
        <span class="label-text w-full pt-2 text-left">
          {label} <span class="pl-sm text-secondary">{count}</span>
        </span>
      </label>
    {/if}
  {/each}
  {#if values.length > 3}
    <div class="col-span-full mt-md">
      <button on:click={() => toggleSelectAll()} class="label cursor-pointer !items-start gap-sm !p-0 text-primary">
        <div class="w-[1.5rem]">
          <Icon name={allSelected ? 'uncheckAll' : 'checkAll'} />
        </div>
        <span class="label-text w-full pt-2 text-left text-primary">
          {allSelected ? $t('entityFilters.unselectAll') : $t('entityFilters.selectAll')}
        </span>
      </button>
    </div>
  {/if}
</div>
