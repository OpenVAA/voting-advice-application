<!--
@component
Show filters for entities. This component and the individual filter components only display the UI for the filters and handle their rule updates. To access the results of the filters, you have to apply the filters to the targets.

### Properties

- `filters`: The filter objects to render.
- `targets`: The target entitiess of the filter objects. Note that these will only be used to get value options, not for actual filtering.
- Any valid attributes of a `<div>` element

### Usage

```tsx
<EntityFilters {filters} targets={candidates}/>
```
-->

<script lang="ts">
  import { FILTER_TYPE, isEnumeratedFilter, isFilterType } from '@openvaa/filters';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Expander } from '$lib/components/expander';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import type { AnyEntityVariant } from '@openvaa/data';
  import type { EntityFiltersProps } from './EntityFilters.type';

  type $$Props = EntityFiltersProps;

  export let filterGroup: $$Props['filterGroup'];
  export let targets: $$Props['targets'];

  const { t } = getComponentContext();

  /** Type params cannot be used in the HTML part */
  function _isEnumeratedFilter(filter: unknown) {
    // TODO[Svelte 5]: Check if needed
    return isEnumeratedFilter<MaybeWrappedEntityVariant, AnyEntityVariant>(filter);
  }
</script>

<div {...concatClass($$restProps, 'flex flex-col gap-md')}>
  {#each filterGroup.filters as filter}
    <Expander
      title={filter.name}
      variant="question"
      titleClass="!text-left"
      defaultExpanded={filter.active || isFilterType(filter, FILTER_TYPE.TextFilter)}>
      {#if isFilterType(filter, FILTER_TYPE.TextFilter)}
        {#await import('./text') then { TextEntityFilter }}
          <svelte:component this={TextEntityFilter} {filter} />
        {/await}
      {:else if isFilterType(filter, FILTER_TYPE.NumberQuestionFilter)}
        {#await import('./numeric') then { NumericEntityFilter }}
          <svelte:component this={NumericEntityFilter} {filter} {targets} />
        {/await}
      {:else if _isEnumeratedFilter(filter)}
        {#await import('./enumerated') then { EnumeratedEntityFilter }}
          <svelte:component this={EnumeratedEntityFilter} {filter} {targets} />
        {/await}
      {:else}
        <ErrorMessage message={$t('entityFilters.error')} />
      {/if}
    </Expander>
  {/each}
</div>
