<script lang="ts">
  import {onDestroy} from 'svelte';
  import {locale, t} from '$lib/i18n';
  import {TextPropertyFilter} from '$lib/voter/vaa-filters';
  import {startEvent} from '$lib/utils/analytics/track';
  import {concatClass} from '$lib/utils/components';
  import {Button} from '$lib/components/button';
  import {InfoBadge} from '$lib/components/infoBadge';
  import {Modal} from '$lib/components/modal';
  import {EntityFilters} from '$lib/components/entityFilters';
  import {Icon} from '$lib/components/icon';
  import {TextEntityFilter} from '../entityFilters/text';
  import type {EntityListControlsProps} from './EntityListControls.type';

  type $$Props = EntityListControlsProps;

  export let contents: $$Props['contents'];
  export let filterGroup: $$Props['filterGroup'] = undefined;
  export let searchProperty: $$Props['searchProperty'] = 'name';
  export let output: $$Props['output'];

  /**
   * Contents after filtering but before search
   */
  let filteredContents: $$Props['contents'];

  // This is kept in sync by `updateFilters()`
  let numActiveFilters = 0;

  // Exports from Modal
  let openFiltersModal: () => void;
  let closeFiltersModal: () => void;

  // Create the text search filter
  const searchFilter = searchProperty
    ? new TextPropertyFilter<MaybeRanked>({property: searchProperty as keyof MaybeRanked}, $locale)
    : undefined;

  // Listen to changes in the filters
  filterGroup?.onChange(updateFilters);
  searchFilter?.onChange(updateSearch);

  // Initialize because the `filterGroup` object passed may contain active filters
  updateFilters();

  // Cleanup
  onDestroy(() => {
    filterGroup?.onChange(updateFilters, false);
    searchFilter?.onChange(updateSearch, false);
  });

  /** Update all filters */
  function updateFilters() {
    filteredContents = filterGroup ? filterGroup.apply(contents) : [...contents];
    numActiveFilters = filterGroup ? filterGroup.filters.filter((f) => f.active).length : 0;
    updateSearch();
  }
  /** Update text search */
  function updateSearch() {
    output = searchFilter ? searchFilter.apply(filteredContents) : [...filteredContents];
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
    if (activeFilters) startEvent('filters_active', {activeFilters});
  }
</script>

<!--
@component
Show filter, sorting (TBA) and search tools for an associated `<EntityList>`.

### Properties

- Any valid attributes of a `<div>` element.

### Tracking events

- `filters_reset`
- `filters_active` with `activeFilters` listing the (localized) names of the currently active filters

### Usage

```tsx
<EntityListControls contents={allParties} bind:output={filteredParties}/>
```
-->

<div {...concatClass($$restProps, 'flex flex-col')}>
  <div class="mb-md flex flex-row-reverse justify-between gap-lg">
    {#if searchFilter}
      <TextEntityFilter
        filter={searchFilter}
        placeholder={$t('entityList.controls.searchPlaceholder')}
        variant="discrete" />
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
    {#if filterGroup}
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
  {#if contents.length > 0 && output.length === 0}
    {#if filterGroup}
      <button
        class="my-lg flex flex-col items-center text-center text-secondary"
        on:click={openFilters}>
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

{#if filterGroup}
  <Modal
    title={$t('entityFilters.filters')}
    boxClass="sm:max-w-[calc(36rem_+_2_*_24px)]"
    on:close={trackActiveFilters}
    bind:openModal={openFiltersModal}
    bind:closeModal={closeFiltersModal}>
    <EntityFilters {filterGroup} targets={contents} />
    <div class="flex w-full flex-col items-center" slot="actions">
      <Button
        on:click={closeFiltersModal}
        text={$t('entityFilters.applyAndClose')}
        variant="main" />
      <Button
        on:click={resetFilters}
        color="warning"
        disabled={!numActiveFilters}
        text={$t('entityFilters.reset')} />
    </div>
  </Modal>
{/if}
