<!--
@component
Show filter, sorting (TBA) and search tools for an associated `<EntityList>`.

TODO: Consider moving the tracking events away from the component and just adding callbacks that the consumer can use to trigger tracking events.

### Properties

- `entities`: A list of possibly ranked entities, e.g. candidates or a parties.
- `filterGroup`: The filters applied to the entities
- `searchProperty`: The property used for the search tool. Default 'name'
- Any valid attributes of a `<div>` element.

###  Callbacks

-  `onUpdate`: Callback for when the filters are applied.

### Tracking events

- `filters_reset`
- `filters_active` with `activeFilters` listing the (localized) names of the currently active filters

### Usage

```tsx
<EntityListControls entities={allParties} bind:output={filteredParties}/>
```
-->

<script lang="ts">
  import { TextPropertyFilter } from '@openvaa/filters';
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { EntityFilters } from '$lib/components/entityFilters';
  import { Icon } from '$lib/components/icon';
  import { InfoBadge } from '$lib/components/infoBadge';
  import { Modal } from '$lib/components/modal';
  import { getAppContext } from '$lib/contexts/app';
  import { concatClass } from '$lib/utils/components';
  import { TextEntityFilter } from '$lib/components/entityFilters/text';
  import type { EntityListControlsProps } from './EntityListControls.type';

  type $$Props = EntityListControlsProps;

  export let entities: $$Props['entities'];
  export let filterGroup: $$Props['filterGroup'] = undefined;
  export let searchProperty: $$Props['searchProperty'] = 'name';
  export let onUpdate: $$Props['onUpdate'];

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { locale, startEvent, t } = getAppContext();

  ////////////////////////////////////////////////////////////////////
  // Filtering
  ////////////////////////////////////////////////////////////////////

  // Exports from Modal
  let openFiltersModal: () => void;
  let closeFiltersModal: () => void;

  /**
   * Contents after filtering but before search
   */
  let filteredContents: $$Props['entities'];

  /**
   * Final entities
   */
  let output: $$Props['entities'];

  // This is kept in sync by `updateFilters()`
  let numActiveFilters = 0;

  // Create the text search filter
  const searchFilter = searchProperty
    ? new TextPropertyFilter<MaybeWrappedEntityVariant>({ property: searchProperty as keyof MaybeWrappedEntityVariant }, $locale)
    : undefined;

  // Listen to changes in the filters
  filterGroup?.onChange(updateFilters);
  searchFilter?.onChange(updateSearch);

  // Initialize the filters and react to changes in input
  $: {
    updateFilters();
    entities; // eslint-disable-line @typescript-eslint/no-unused-expressions
  }

  // Clean up
  onDestroy(() => {
    filterGroup?.onChange(updateFilters, false);
    searchFilter?.onChange(updateSearch, false);
  });

  ////////////////////////////////////////////////////////////////////
  // Functions
  ////////////////////////////////////////////////////////////////////

  /** Update all filters */
  function updateFilters() {
    filteredContents = filterGroup ? filterGroup.apply(entities) : [...entities];
    numActiveFilters = filterGroup ? filterGroup.filters.filter((f) => f.active).length : 0;
    updateSearch();
  }

  /** Update text search */
  function updateSearch() {
    output = searchFilter ? searchFilter.apply(filteredContents) : [...filteredContents];
    onUpdate(output);
  }

  /** Open filters dialog */
  function openFilters() {
    openFiltersModal();
  }

  /** Reset and close the filters dialog */
  function resetFilters() {
    filterGroup?.reset();
    if (filterGroup) startEvent('filters_reset');
    closeFiltersModal();
  }

  /**
   * Create a tracking event for the active filters
   */
  function trackActiveFilters() {
    const activeFilters = filterGroup?.filters
      .filter((f) => f.active)
      .map((f) => f.name)
      .join(',');
    if (activeFilters) startEvent('filters_active', { activeFilters });
  }
</script>

<div {...concatClass($$restProps, 'flex flex-col')}>
  <div class="mb-md flex flex-row-reverse justify-between gap-lg">
    {#if searchFilter}
      <TextEntityFilter
        filter={searchFilter}
        placeholder={$t('entityList.controls.searchPlaceholder')}
        variant="discrete"
        class="grow" />
    {/if}
    <!-- 
      Sorting (TBA)
      <Button 
        on:click={() => console.warn('Not implemented yet')}
        icon="sort"
        iconPos="left"
        class="!w-auto grow"
        text="Sort results"/> 
    -->
    {#if filterGroup?.filters.length}
      {#if numActiveFilters}
        <Button
          on:click={openFilters}
          color="warning"
          icon="filter"
          iconPos="left"
          class="!w-auto"
          text={$t('entityFilters.filterButtonLabel')}>
          <InfoBadge text={numActiveFilters} slot="badge" />
        </Button>
      {:else}
        <Button
          on:click={openFilters}
          icon="filter"
          iconPos="left"
          class="!w-auto"
          text={$t('entityFilters.filterButtonLabel')} />
      {/if}
    {/if}
  </div>
  {#if entities.length > 0 && output.length === 0}
    {#if filterGroup?.filters.length}
      <button class="my-lg flex flex-col items-center text-center text-secondary" on:click={openFilters}>
        <Icon name="info" />
        {$t('entityList.controls.noFilterResults')}
      </button>
    {:else}
      <div class="my-lg flex flex-col items-center text-center text-secondary">
        <Icon name="info" />
        {$t('entityList.controls.noSearchResults')}
      </div>
    {/if}
  {/if}
</div>

{#if filterGroup?.filters.length}
  <Modal
    title={$t('entityFilters.filters')}
    boxClass="sm:max-w-[calc(36rem_+_2_*_24px)]"
    on:close={trackActiveFilters}
    bind:openModal={openFiltersModal}
    bind:closeModal={closeFiltersModal}>
    <EntityFilters {filterGroup} targets={entities} />
    <div class="flex w-full flex-col items-center" slot="actions">
      <Button on:click={closeFiltersModal} text={$t('entityFilters.applyAndClose')} variant="main" />
      <Button on:click={resetFilters} color="warning" disabled={!numActiveFilters} text={$t('entityFilters.reset')} />
    </div>
  </Modal>
{/if}
