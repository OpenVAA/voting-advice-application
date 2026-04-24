<!--
@component
Compound component combining search + filter controls with an `EntityList`
in a fixed layout (D-01 + D-03). Replaces the broken `$effect` +
`filterGroup.onChange` + `updateFilters` circular chain on
`EntityListControls.svelte:56-73` (RESULTS-01) with pure `$derived`
computations bridged to `FilterGroup.onChange` via the version counter
provided by `filterContext` (Phase 62 D-04, D-05).

### Properties

- `entities`: Array of possibly-wrapped entities to display.
- `filterGroup`: optional override for the active `FilterGroup`. When
  omitted, pulls from `filterContext.filterGroup`.
- `searchProperty`: property used by the search filter. @default `'name'`
- `itemsPerPage` / `itemsTolerance` / `scrollIntoView`: forwarded to the
  nested `<EntityList>`.
- Any valid attributes of a `<div>` element.

### Reactivity bridge

This component reads `fctx.version` inside its `$derived` so that any
filter-rule mutation (which fires `FilterGroup.onChange` and bumps
`fctx.version` via the `filterContext` `$effect`) re-runs the filter
computation. The local `searchVersion` mirrors the same pattern for the
search filter (no global subscription needed — search state is
component-local). See `EntityListWithControls.helpers.ts` for the pure
`computeFiltered` / `countActiveFilters` functions consumed here.
-->
<script lang="ts" generics="TEntity extends MaybeWrappedEntityVariant = MaybeWrappedEntityVariant">
  import { TextPropertyFilter } from '@openvaa/filters';
  import { fromStore } from 'svelte/store';
  import { slide } from 'svelte/transition';
  import { Button } from '$lib/components/button';
  import { EntityFilters } from '$lib/components/entityFilters';
  import { TextEntityFilter } from '$lib/components/entityFilters/text';
  import { InfoBadge } from '$lib/components/infoBadge';
  import { Modal } from '$lib/components/modal';
  import { getAppContext } from '$lib/contexts/app';
  import { getFilterContext } from '$lib/contexts/filter';
  import { concatClass } from '$lib/utils/components';
  import { DELAY } from '$lib/utils/timing';
  import EntityList from './EntityList.svelte';
  import { computeFiltered, countActiveFilters } from './EntityListWithControls.helpers';
  import type { FilterGroup } from '@openvaa/filters';
  import type { EntityListWithControlsProps } from './EntityListWithControls.type';

  let {
    entities,
    filterGroup: filterGroupProp,
    searchProperty = 'name',
    itemsPerPage,
    itemsTolerance,
    scrollIntoView,
    ...restProps
  }: EntityListWithControlsProps<TEntity> = $props();

  const { locale, startEvent, t } = getAppContext();
  const fctx = getFilterContext();
  // appContext exposes locale as a Readable<string> (store-wrapped per
  // appContext.type.ts line 26). Bridge to a rune-friendly value via fromStore.
  const localeState = fromStore(locale);

  // Active FilterGroup: prop override wins over context (D-02 additive contract
  // for off-context use such as tests and the candidate-app migration).
  // The cast to FilterGroup<MaybeWrappedEntityVariant> handles the generic
  // variance gap — FilterGroup<TEntity> is invariant in TEntity, but our
  // consumers (EntityFilters, computeFiltered helper) treat the FilterGroup
  // structurally and only call the contravariant `apply` and `filters` shapes.
  const activeFilterGroup = $derived(
    (filterGroupProp ?? fctx.filterGroup) as FilterGroup<MaybeWrappedEntityVariant> | undefined
  );

  // Search filter — stable per searchProperty change. TextPropertyFilter is
  // pure w.r.t. entities `[VERIFIED: packages/filters/src/filter/base/filter.ts:92-105]`.
  const searchFilter = $derived(
    searchProperty
      ? new TextPropertyFilter<MaybeWrappedEntityVariant>(
          { property: searchProperty as keyof MaybeWrappedEntityVariant },
          localeState.current
        )
      : undefined
  );

  // Local version counter for searchFilter.onChange. Mirrors the filterContext
  // pattern (RESEARCH §Pitfall 1, Pattern 1) for the search-state branch.
  let searchVersion = $state(0);
  $effect(() => {
    const sf = searchFilter;
    if (!sf) return;
    const handler = () => {
      searchVersion++;
    };
    sf.onChange(handler, true);
    // Pitfall 2: mandatory cleanup. The $effect re-runs when searchFilter
    // changes (rare — only if searchProperty changes), so we MUST detach the
    // old handler before the new one attaches.
    return () => sf.onChange(handler, false);
  });

  // Pure $derived — no side effects, no $effect, no callback chain.
  // Subscribes to BOTH version counters so mutations through either bridge
  // trigger a re-run. This is the line that replaces EntityListControls.svelte:56-73
  // (the circular chain that caused effect_update_depth_exceeded).
  // The structural casts to `{ apply: ... }` close the generic-variance gap in
  // TextPropertyFilter / FilterGroup whose `apply` is invariant in TEntity;
  // computeFiltered only consumes the contravariant `apply` shape.
  type ApplyFn = { apply: <T>(targets: Array<T>) => Array<T> };
  const filtered = $derived.by(() => {
    void fctx.version; // subscribe to filterGroup mutations via filterContext bridge
    void searchVersion; // subscribe to searchFilter mutations via local bridge
    return computeFiltered(
      entities,
      activeFilterGroup as unknown as ApplyFn | undefined,
      searchFilter as unknown as ApplyFn | undefined
    );
  });

  const numActiveFilters = $derived(countActiveFilters(activeFilterGroup));

  let filtersModalRef = $state<Modal | undefined>();

  function openFilters(): void {
    filtersModalRef?.openModal();
  }

  function resetAllFilters(): void {
    activeFilterGroup?.reset();
    if (activeFilterGroup) startEvent('filters_reset');
    filtersModalRef?.closeModal();
    // No manual recompute — reset() fires onChange → version counter bumps → $derived re-runs.
  }

  function trackActiveFilters(): void {
    const af = activeFilterGroup?.filters
      .filter((f) => f.active)
      .map((f) => f.name)
      .join(',');
    if (af) startEvent('filters_active', { activeFilters: af });
  }
</script>

<div data-testid="entity-list-with-controls" {...concatClass(restProps, 'flex flex-col')}>
  <div class="mb-md gap-lg flex flex-row-reverse justify-between">
    {#if searchFilter}
      <TextEntityFilter
        filter={searchFilter}
        placeholder={t('entityList.controls.searchPlaceholder')}
        variant="discrete"
        class="grow"
        data-testid="entity-list-search" />
    {/if}
    {#if activeFilterGroup?.filters.length}
      {#if numActiveFilters}
        <Button
          onclick={openFilters}
          color="warning"
          icon="filter"
          iconPos="left"
          class="!w-auto"
          data-testid="entity-list-filter"
          text={t('entityFilters.filterButtonLabel')}>
          {#snippet badge()}<InfoBadge text={numActiveFilters} />{/snippet}
        </Button>
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
        {activeFilterGroup?.filters.length
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

{#if activeFilterGroup?.filters.length}
  <Modal
    bind:this={filtersModalRef}
    title={t('entityFilters.filters')}
    boxClass="sm:max-w-[calc(36rem_+_2_*_24px)]"
    onClose={trackActiveFilters}>
    <EntityFilters filterGroup={activeFilterGroup} targets={entities} />
    {#snippet actions()}
      <div class="flex w-full flex-col items-center">
        <Button onclick={() => filtersModalRef?.closeModal()} text={t('entityFilters.applyAndClose')} variant="main" />
        <Button
          onclick={resetAllFilters}
          color="warning"
          disabled={!numActiveFilters}
          text={t('entityFilters.reset')} />
      </div>
    {/snippet}
  </Modal>
{/if}

<EntityList
  cards={filtered.map((e) => ({ entity: e }))}
  {itemsPerPage}
  {itemsTolerance}
  {scrollIntoView}
  class="mb-lg"
  data-testid="entity-list-with-controls-list" />
