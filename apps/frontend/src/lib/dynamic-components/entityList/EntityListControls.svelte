<!--
@component Show filter, sorting (TBA) and search tools for a list of entities, and render the list from the filtered entities with the `children` snippet.

TODO: Consider moving the tracking events away from the component and just adding callbacks that the consumer can use to trigger tracking events.

### Properties

- `entities`: A list of possibly ranked entities, e.g. candidates or a parties.
- `filterGroup`: The filters applied to the contents.
- `searchProperty`: The property used for the search tool. Default: `'name'`
- Any valid attributes of a `<div>` element.

### Snippet Props

- `children`: Renders the list. Receives the entities left after the filters and the search.

### Tracking events

- `filters_reset`
- `filters_active` with `count`, the number of currently active filters

### Usage

```tsx
<EntityListControls entities={allParties} {filterGroup}>
  {#snippet children(filtered)}
    <EntityList cards={filtered.map((entity) => ({ entity }))} />
  {/snippet}
</EntityListControls>
```
-->

<script lang="ts" generics="TEntity extends MaybeWrappedEntityVariant = MaybeWrappedEntityVariant">
  import { TextPropertyFilter } from '@openvaa/filters';
  import { slide } from 'svelte/transition';
  import { Button } from '$lib/components/button';
  import { EntityFilters } from '$lib/components/entityFilters';
  import { TextEntityFilter } from '$lib/components/entityFilters/text';
  import { InfoBadge } from '$lib/components/infoBadge';
  import { Modal } from '$lib/components/modal';
  import { getAppContext } from '$lib/contexts/app';
  import { concatClass } from '$lib/utils/components';
  import { DELAY } from '$lib/utils/timing';
  import { computeFiltered, countActiveFilters } from './helpers';
  import type { FilterGroup } from '@openvaa/filters';
  import type { EntityListControlsProps } from './EntityListControls.type';

  let {
    entities,
    filterGroup: filterGroupProp,
    searchProperty = 'name',
    children,
    ...restProps
  }: EntityListControlsProps<TEntity> = $props();

  const ctx = getAppContext();
  const { track, t } = ctx;
  // locale is a reactive accessor — read via ctx.locale, never destructure.
  const locale = $derived(ctx.locale);

  // `FilterGroup<TEntity>` is invariant in `TEntity`, while `EntityFilters` and `computeFiltered` only read its filters and call `apply`.
  const filterGroup = $derived(filterGroupProp as FilterGroup<MaybeWrappedEntityVariant> | undefined);

  const searchFilter = $derived(
    searchProperty
      ? new TextPropertyFilter<MaybeWrappedEntityVariant>(
          { property: searchProperty as keyof MaybeWrappedEntityVariant },
          locale
        )
      : undefined
  );

  // Version counters bridging the filters' imperative `onChange` into `$derived`: a `FilterGroup` is mutated in place, so its reference never changes. Each effect detaches its handler before a new filter attaches one.
  let filterVersion = $state(0);
  $effect(() => {
    const fg = filterGroup;
    if (!fg) return;
    function handler() {
      filterVersion++;
    }
    fg.onChange(handler, true);
    return () => fg.onChange(handler, false);
  });

  let searchVersion = $state(0);
  $effect(() => {
    const sf = searchFilter;
    if (!sf) return;
    function handler() {
      searchVersion++;
    }
    sf.onChange(handler, true);
    return () => sf.onChange(handler, false);
  });

  // `computeFiltered` only calls `apply`, which the generic filter types declare invariantly in their target type.
  type ApplyFn = { apply: <TFn>(targets: Array<TFn>) => Array<TFn> };
  const filtered = $derived.by(() => {
    void filterVersion;
    void searchVersion;
    return computeFiltered(
      entities,
      filterGroup as unknown as ApplyFn | undefined,
      searchFilter as unknown as ApplyFn | undefined
    );
  });

  const numActiveFilters = $derived.by(() => {
    void filterVersion;
    return countActiveFilters(filterGroup);
  });

  let filtersModalRef: Modal | undefined = $state();

  function openFilters() {
    filtersModalRef?.openModal();
  }
  function resetFilters() {
    filterGroup?.reset();
    if (filterGroup) track('filters_reset');
    filtersModalRef?.closeModal();
  }
  function trackActiveFilters() {
    const count = countActiveFilters(filterGroup);
    if (count > 0) track('filters_active', { count });
  }
</script>

<div data-testid="entity-list-controls" {...concatClass(restProps, 'flex flex-col')}>
  <div class="mb-md gap-lg flex flex-row-reverse justify-between">
    {#if searchFilter}
      <TextEntityFilter
        filter={searchFilter}
        placeholder={t('entityList.controls.searchPlaceholder')}
        variant="discrete"
        class="grow"
        data-testid="entity-list-search" />
    {/if}
    {#if filterGroup?.filters.length}
      {#if numActiveFilters}
        <Button
          onclick={openFilters}
          color="warning"
          icon="filter"
          iconPos="left"
          class="!w-auto"
          data-testid="entity-list-filter"
          text={t('entityFilters.filterButtonLabel')}
          >{#snippet badge()}<InfoBadge text={numActiveFilters} />{/snippet}</Button>
      {:else}
        <Button
          onclick={openFilters}
          icon="filter"
          iconPos="left"
          class="!w-auto"
          data-testid="entity-list-filter"
          text={t('entityFilters.filterButtonLabel')} />
      {/if}
    {/if}
  </div>
  {#if entities.length > 0}
    {#if filtered.length === 0}
      <div
        class="my-lg text-secondary flex flex-col items-center text-center"
        transition:slide={{ duration: DELAY.md }}>
        {filterGroup?.filters.length
          ? t('entityList.controls.noFilterResults')
          : t('entityList.controls.noSearchResults')}
      </div>
    {:else if filtered.length !== entities.length}
      <div
        class="my-lg text-secondary flex flex-col items-center text-center"
        transition:slide={{ duration: DELAY.md }}>
        {t('entityList.controls.showingNumResults', { numShown: filtered.length })}
      </div>
    {/if}
  {/if}
</div>

{#if filterGroup?.filters.length}
  <!-- bind: keep — filtersModalRef is $state(); single ref read in event handlers -->
  <Modal
    bind:this={filtersModalRef}
    title={t('entityFilters.filters')}
    boxClass="sm:max-w-[calc(36rem_+_2_*_24px)]"
    data-testid="entity-filter-dialog"
    onClose={trackActiveFilters}>
    <EntityFilters {filterGroup} targets={entities} />
    {#snippet actions()}
      <div class="flex w-full flex-col items-center">
        <Button
          onclick={() => filtersModalRef?.closeModal()}
          text={t('entityFilters.applyAndClose')}
          variant="main"
          data-testid="entity-filter-dialog-apply" />
        <Button
          onclick={resetFilters}
          color="warning"
          disabled={!numActiveFilters}
          text={t('entityFilters.reset')}
          data-testid="entity-filter-dialog-reset" />
      </div>
    {/snippet}
  </Modal>
{/if}

{@render children?.(filtered)}
