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
  import { isMissing, MISSING_VALUE } from '@openvaa/filters';
  import { onDestroy } from 'svelte';
  import { Icon } from '$lib/components/icon';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatProps, getUUID } from '$lib/utils/components';
  import { logDebugError } from '$lib/utils/logger';
  import type { AnyChoice, AnyEntityVariant } from '@openvaa/data';
  import type { MaybeMissing } from '@openvaa/filters';
  import type { EnumeratedEntityFilterProps } from './EnumeratedEntityFilter.type';

  let { filter, targets, ...restProps }: EnumeratedEntityFilterProps = $props();

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

  // `filter` and `targets` are stable per parent contract (sister
  // component NumericEntityFilter follows the same pattern).
  // svelte-ignore state_referenced_locally
  const values = filter.parseValues(targets);
  let selected: Array<string> = $state(convertMissingForInputs(values.map((v) => v.value)));
  /** Track whether `toggleSelectAll()` will select or deselect all */
  let allSelected = $derived(selected.length === values.length);
  /**
   * Disambiguate "filter inactive (default, no user input)" from "user
   * explicitly selected nothing (active filter with empty allow-list → 0
   * results)". The default UI state is all-checked + inactive filter; the
   * flag flips on the first UI-driven change (`bind:group` checkbox emits,
   * or `toggleSelectAll()`) AND stays true thereafter so a subsequent empty
   * selection produces 0 results rather than collapsing back to "no filter".
   */
  let userActivated = $state(false);

  // If the filter is already populated upstream (URL params, parent
  // restore), mirror its allow-list. Otherwise the all-selected default
  // set on `selected` above is the correct UI baseline — `parseSelected`
  // collapses `selected.length === values.length` to `filter.include =
  // undefined`, so the all-checked UI and inactive filter stay consistent.
  updateSelected();

  ////////////////////////////////////////////////////////////////////
  // Set filter
  ////////////////////////////////////////////////////////////////////

  // Update filter values when selection changes
  $effect(() => {
    filter.include = parseSelected(selected, userActivated);
  });

  // Update selection when filter values change
  // svelte-ignore state_referenced_locally
  filter.onChange(updateSelected);

  // Clean up
  onDestroy(() => filter.onChange(updateSelected, false));

  ////////////////////////////////////////////////////////////////////
  // Functions
  ////////////////////////////////////////////////////////////////////

  /**
   * Update the selected checkboxes so that they reflect the filter state.
   *
   * Semantics:
   *  - `filter.include === undefined` → filter inactive → `selected = all`
   *    (every box checked); the default baseline.
   *  - `filter.include === []` → filter active with zero allowed →
   *    `selected = []` in the UI; downstream produces 0 results.
   *  - `filter.include === [...ids]` → mirror the explicit allow-list.
   *
   * NB. `EnumeratedFilter.include` returns `[]` for the undefined case (see
   * its getter), so we must read `_rules.include` semantics indirectly: the
   * filter's `active` getter is true ONLY when include is defined.
   */
  function updateSelected() {
    const inc = filter.include;
    // Default (filter inactive): all checked. Matches the `parseSelected`
    // contract where `selected.length === values.length` collapses to
    // `filter.include = undefined`, so the all-checked UI and the inactive
    // filter remain consistent round-trip.
    if (!filter.active) {
      selected = convertMissingForInputs(values.map((v) => v.value));
      userActivated = false;
      return;
    }
    // Filter is active. If include is empty ([] explicit allow-none) mirror
    // empty UI; otherwise mirror the allow-list. Either way the filter is
    // user-activated from the UI's perspective.
    selected = convertMissingForInputs(inc);
    userActivated = true;
  }

  /**
   * Parse the selected checkboxes into values accepted by `filter.include`.
   *
   * Semantics (post TIR3 cluster 1):
   *  - `!activated` (mount baseline, no user input yet) → `undefined` (filter
   *    inactive, everything passes).
   *  - `activated && selectedValues.length === values.length` (everything
   *    checked) → `undefined` (no narrowing — same as no-filter baseline).
   *  - `activated && selectedValues.length === 0` → `[]` (active filter with
   *    empty allow-list → 0 results).
   *  - Otherwise → mapped allow-list.
   *
   * The previous semantics returned `undefined` for empty selection, which
   * collapsed "user explicitly selected nothing" into "no filter applied".
   *
   * @param selectedValues - We need to explicitly pass this to trigger reactive updates
   * @param activated - Whether the user has interacted with the filter yet
   * @returns The selected values for `filter.include`
   */
  function parseSelected(selectedValues: typeof selected, activated: boolean) {
    if (!activated) return undefined;
    if (selectedValues.length === values.length) return undefined;
    return convertMissingForFilter(selectedValues);
  }

  /**
   * Check or uncheck all checkboxes
   */
  function toggleSelectAll() {
    userActivated = true;
    selected = allSelected ? [] : convertMissingForInputs(values.map((v) => v.value));
  }

  /**
   * Convert possibly missing values for use in `<input>` elements
   */
  function convertMissingForInputs(filterValues: Array<MaybeMissing<string>>) {
    // TIR3 cluster 1: was `isMissing(isMissing)` — a typo that always evaluated
    // false (the function reference is never missing-equal), so the
    // MISSING_VALUE sentinel was never substituted into <input value=...>,
    // leaving the "No answer" row un-toggleable from the DOM.
    return filterValues.map((v) => (isMissing(v) ? missingValue : v));
  }

  /**
   * Convert possibly missing values for passing to `filter.include`
   */
  function convertMissingForFilter(inputValues: typeof selected) {
    return inputValues.map((v) => (v === missingValue ? MISSING_VALUE : v));
  }

  /**
   * Get the text label from the object returned by the filter.
   * @param object - party object or choice
   */
  function getLabel(object: AnyEntityVariant | AnyChoice | undefined): string | undefined {
    if (!object) return t('entityFilters.missingValue');
    // Entity
    if ('shortName' in object) return object.shortName;
    // Choice
    if ('label' in object) return object.label;
    logDebugError(`EnumeratedEntityFilter: entity's answer resulted in an invalid object: ${object}`);
    return undefined;
  }
</script>

<div
  {...concatProps(restProps, {
    class: 'grid grid-flow-row gap-x-xl gap-y-sm items-start',
    style: 'grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));'
  })}>
  {#each values as { value, object, count }}
    {@const label = getLabel(object)}
    {@const inputValue = isMissing(value) ? missingValue : value}
    {#if label != null}
      <label class="label gap-sm cursor-pointer !items-start !p-0" data-testid="entity-filter-option">
        <!-- Disable the input if there is only one value -->
        <!-- bind: keep — two-way DOM checkbox group bind:group={selected}; selected is $state -->
        <!-- value: render MISSING_VALUE as the placeholder string so the input's
             __value matches the post-conversion `selected` entries; otherwise the
             bind:group identity check fails round-trip and the missing-value
             checkbox lags one click behind the filter state. -->
        <input
          type="checkbox"
          class="checkbox"
          value={inputValue}
          bind:group={selected}
          {name}
          disabled={values.length === 1}
          onchange={() => (userActivated = true)} />
        <span class="w-full pt-2 text-left">
          {label} <span class="pl-sm text-secondary">{count}</span>
        </span>
      </label>
    {/if}
  {/each}
  {#if values.length > 3}
    <div class="mt-md col-span-full">
      <button onclick={() => toggleSelectAll()} class="label gap-sm text-primary cursor-pointer !items-start !p-0">
        <div class="w-[1.5rem]">
          <Icon name={allSelected ? 'uncheckAll' : 'checkAll'} />
        </div>
        <span class="text-primary w-full pt-2 text-left">
          {allSelected ? t('entityFilters.unselectAll') : t('entityFilters.selectAll')}
        </span>
      </button>
    </div>
  {/if}
</div>
