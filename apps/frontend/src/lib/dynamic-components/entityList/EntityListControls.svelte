<svelte:options runes />

<!--
@component
Show filter, sorting (TBA) and search tools for an associated `<EntityList>`.

TODO: Consider moving the tracking events away from the component and just adding callbacks that the consumer can use to trigger tracking events.

### Properties

- `entities`: A list of possibly ranked entities, e.g. candidates or a parties.
- `filterGroup`: The filters applied to the contents.
- `searchProperty`: The property used for the search tool. Default: `'name'`
- `onUpdate`: Callback for when the filters are applied.
- Any valid attributes of a `<div>` element.

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
  import { slide } from 'svelte/transition';
  import { Button } from '$lib/components/button';
  import { EntityFilters } from '$lib/components/entityFilters';
  import { TextEntityFilter } from '$lib/components/entityFilters/text';
  import { InfoBadge } from '$lib/components/infoBadge';
  import { Modal } from '$lib/components/modal';
  import { getAppContext } from '$lib/contexts/app';
  import { concatClass } from '$lib/utils/components';
  import { DELAY } from '$lib/utils/timing';
  import type { EntityListControlsProps } from './EntityListControls.type';

  let { entities, filterGroup, searchProperty = 'name', onUpdate, ...restProps }: EntityListControlsProps = $props();

  const { locale, startEvent, t } = getAppContext();
  let filtersModalRef: Modal;
  let filteredContents: EntityListControlsProps['entities'] = $state([]);
  let output: EntityListControlsProps['entities'] = $state([]);
  let numActiveFilters = $state(0);

  const searchFilter = searchProperty ? new TextPropertyFilter<MaybeWrappedEntityVariant>({ property: searchProperty as keyof MaybeWrappedEntityVariant }, $locale) : undefined;

  filterGroup?.onChange(updateFilters);
  searchFilter?.onChange(updateSearch);

  $effect(() => { entities; updateFilters(); });

  onDestroy(() => { filterGroup?.onChange(updateFilters, false); searchFilter?.onChange(updateSearch, false); });

  function updateFilters() {
    filteredContents = filterGroup ? filterGroup.apply(entities) : [...entities];
    numActiveFilters = filterGroup ? filterGroup.filters.filter((f) => f.active).length : 0;
    updateSearch();
  }

  function updateSearch() { output = searchFilter ? searchFilter.apply(filteredContents) : [...filteredContents]; onUpdate(output); }
  function openFilters() { filtersModalRef?.openModal(); }
  function resetFilters() { filterGroup?.reset(); if (filterGroup) startEvent('filters_reset'); filtersModalRef?.closeModal(); }
  function trackActiveFilters() { const af = filterGroup?.filters.filter((f) => f.active).map((f) => f.name).join(','); if (af) startEvent('filters_active', { activeFilters: af }); }
</script>

<div data-testid="entity-list-controls" {...concatClass(restProps, 'flex flex-col')}>
  <div class="mb-md gap-lg flex flex-row-reverse justify-between">
    {#if searchFilter}
      <TextEntityFilter filter={searchFilter} placeholder={t('entityList.controls.searchPlaceholder')} variant="discrete" class="grow" data-testid="entity-list-search" />
    {/if}
    {#if filterGroup?.filters.length}
      {#if numActiveFilters}
        <Button onclick={openFilters} color="warning" icon="filter" iconPos="left" class="!w-auto" data-testid="entity-list-filter" text={t('entityFilters.filterButtonLabel')}>{#snippet badge()}<InfoBadge text={numActiveFilters} />{/snippet}</Button>
      {:else}
        <Button onclick={openFilters} icon="filter" iconPos="left" class="!w-auto" data-testid="entity-list-filter" text={t('entityFilters.filterButtonLabel')} />
      {/if}
    {/if}
  </div>
  {#if entities.length > 0}
    {#if output.length === 0}
      <div class="my-lg text-secondary flex flex-col items-center text-center" transition:slide={{ duration: DELAY.md }}>{filterGroup?.filters.length ? t('entityList.controls.noFilterResults') : t('entityList.controls.noSearchResults')}</div>
    {:else if output.length !== entities.length}
      <div class="my-lg text-secondary flex flex-col items-center text-center" transition:slide={{ duration: DELAY.md }}>{t('entityList.controls.showingNumResults', { numShown: output.length })}</div>
    {/if}
  {/if}
</div>

{#if filterGroup?.filters.length}
  <Modal bind:this={filtersModalRef} title={t('entityFilters.filters')} boxClass="sm:max-w-[calc(36rem_+_2_*_24px)]" onClose={trackActiveFilters}>
    <EntityFilters {filterGroup} targets={entities} />
    {#snippet actions()}
      <div class="flex w-full flex-col items-center">
        <Button onclick={() => filtersModalRef?.closeModal()} text={t('entityFilters.applyAndClose')} variant="main" />
        <Button onclick={resetFilters} color="warning" disabled={!numActiveFilters} text={t('entityFilters.reset')} />
      </div>
    {/snippet}
  </Modal>
{/if}
