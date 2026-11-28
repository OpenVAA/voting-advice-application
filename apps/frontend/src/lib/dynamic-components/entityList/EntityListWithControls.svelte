<!--
@component An `EntityListControls` rendering an `EntityList` of the filtered entities, filtered by the voter's active `FilterGroup` unless one is given.

### Properties

- `entities`: Array of possibly-wrapped entities to display.
- `filterGroup`: optional override for the active `FilterGroup`. When
  omitted, pulls from `filterContext.filterGroup`.
- `searchProperty`: property used by the search filter. @default `'name'`
- `itemsPerPage` / `itemsTolerance` / `scrollIntoView`: forwarded to the
  nested `<EntityList>`.
- `data-testid`: forwarded to the nested `<EntityList>`.
- Any valid attributes of a `<div>` element.
-->
<script lang="ts" generics="TEntity extends MaybeWrappedEntityVariant = MaybeWrappedEntityVariant">
  import { getFilterContext } from '$lib/contexts/filter';
  import EntityList from './EntityList.svelte';
  import EntityListControls from './EntityListControls.svelte';
  import type { FilterGroup } from '@openvaa/filters';
  import type { EntityListWithControlsProps } from './EntityListWithControls.type';

  let {
    entities,
    filterGroup,
    searchProperty = 'name',
    itemsPerPage,
    itemsTolerance,
    scrollIntoView,
    // Forwarded to the cards container rather than the controls wrapper: consumers passing `data-testid` (e.g. the results page's `voter-results-list`) point at the list.
    'data-testid': dataTestId,
    ...restProps
  }: EntityListWithControlsProps<TEntity> = $props();

  const fctx = getFilterContext();
</script>

<EntityListControls
  {entities}
  filterGroup={filterGroup ?? (fctx.filterGroup as FilterGroup<TEntity> | undefined)}
  {searchProperty}
  {...restProps}
  data-testid="entity-list-with-controls">
  {#snippet children(filtered)}
    <EntityList
      cards={filtered.map((e) => ({ entity: e }))}
      {itemsPerPage}
      {itemsTolerance}
      {scrollIntoView}
      class="mb-lg"
      data-testid={dataTestId ?? 'entity-list-with-controls-list'} />
  {/snippet}
</EntityListControls>
