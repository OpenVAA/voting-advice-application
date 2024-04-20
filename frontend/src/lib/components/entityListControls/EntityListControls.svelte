<script lang="ts">
  import {onDestroy} from 'svelte';
  import {locale, t} from '$lib/i18n';
  import {concatClass} from '$lib/utils/components';
  import {Button} from '$lib/components/button';
  import {Modal} from '$lib/components/modal';
  import {EntityFilters} from '$lib/components/entityFilters';
  import {Icon} from '$lib/components/icon';
  import type {EntityListControlsProps} from './EntityListControls.type';
  import {TextPropertyFilter} from '$lib/voter/vaa-filters';
  import {TextEntityFilter} from '../entityFilters/text';
  import InfoBadge from '../infoBadge/infoBadge.svelte';

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

  function updateFilters() {
    filteredContents = filterGroup ? filterGroup.apply(contents) : [...contents];
    numActiveFilters = filterGroup ? filterGroup.filters.filter((f) => f.active).length : 0;
    updateSearch();
  }

  function updateSearch() {
    output = searchFilter ? searchFilter.apply(filteredContents) : [...filteredContents];
  }

  // Open filters dialog and init filters
  function openFilters() {
    openFiltersModal();
  }

  // Reset and close the filters dialog
  function resetFilters() {
    filterGroup?.reset();
    closeFiltersModal();
  }
</script>

<!--
@component
Show filter, sorting (TBA) and search tools for an associated `<EntityList>`.

### Properties

- Any valid attributes of a `<div>` element.


### Usage

```tsx

```
-->

<div {...concatClass($$restProps, 'flex flex-col')}>
  <div class="mb-md flex flex-row-reverse justify-between">
    {#if searchFilter}
      <TextEntityFilter
        filter={searchFilter}
        placeholder={$t('components.entityListControls.searchPlaceholder')}
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
          text={$t('components.entityFilters.filterButtonLabel')}>
          <InfoBadge text={numActiveFilters} slot="badge" />
        </Button>
      {:else}
        <Button
          on:click={openFilters}
          icon="filter"
          iconPos="left"
          class="!w-auto"
          text={$t('components.entityFilters.filterButtonLabel')} />
      {/if}
    {/if}
  </div>
  {#if contents.length > 0 && output.length === 0}
    {#if filterGroup}
      <button
        class="my-lg flex flex-col items-center text-center text-secondary"
        on:click={openFilters}>
        <Icon name="info" />
        {$t('components.entityListControls.noFilterResults')}
      </button>
    {:else}
      <div class="my-lg flex flex-col items-center text-center text-secondary">
        <Icon name="info" />
        {$t('components.entityListControls.noSearchResults')}
      </div>
    {/if}
  {/if}
</div>

{#if filterGroup}
  <Modal
    title={$t('components.entityFilters.filters')}
    boxClass="sm:max-w-[calc(36rem_+_2_*_24px)]"
    bind:openModal={openFiltersModal}
    bind:closeModal={closeFiltersModal}>
    <EntityFilters {filterGroup} targets={contents} />
    <div class="flex w-full flex-col items-center" slot="actions">
      <Button
        on:click={closeFiltersModal}
        text={$t('components.entityFilters.applyAndClose')}
        variant="main" />
      <Button
        on:click={resetFilters}
        color="warning"
        disabled={!numActiveFilters}
        text={$t('components.entityFilters.reset')} />
    </div>
  </Modal>
{/if}