<!--
@component
Show filters for entities. This component and the individual filter components only display the UI for the filters and handle their rule updates. To access the results of the filters, you have to apply the filters to the targets.

### Properties

- `filterGroup`: The filters applied to the contents.
- `targets`: The target entitiess of the filter objects. Note that these will only be used to get value options, not for actual filtering.
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<EntityFilters {filters} targets={candidates}/>
```
-->

<script lang="ts">
  import { FILTER_TYPE, isEnumeratedFilter, isFilterType, isTextFilter } from '@openvaa/filters';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Expander } from '$lib/components/expander';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import type { AnyEntityVariant } from '@openvaa/data';
  import type { EntityFiltersProps } from './EntityFilters.type';

  let { filterGroup, targets, ...restProps }: EntityFiltersProps = $props();

  const { t } = getComponentContext();

  /** Type params cannot be used in the HTML part */
  function _isEnumeratedFilter(filter: unknown) {
    return isEnumeratedFilter<MaybeWrappedEntityVariant, AnyEntityVariant>(filter);
  }

  /**
   * Type-param-free `isTextFilter` wrapper — same role as `_isEnumeratedFilter`
   * above. Accepts the base TextFilter PLUS TextQuestionFilter +
   * TextPropertyFilter subclasses so `customData.filterable: true` on text
   * questions (built via `buildQuestionFilter → new TextQuestionFilter` per
   * `filterStore.svelte.ts:55-66`) renders correctly instead of falling
   * through to the error fallback. Phase 77 P02 fix.
   */
  function _isTextFilter(filter: unknown) {
    return isTextFilter<MaybeWrappedEntityVariant>(filter);
  }
</script>

<div {...concatClass(restProps, 'flex flex-col gap-md')}>
  {#each filterGroup.filters as filter}
    <Expander
      title={filter.name}
      variant="question"
      titleClass="!text-left"
      defaultExpanded={filter.active || _isTextFilter(filter)}>
      {#if _isTextFilter(filter)}
        {#await import('./text') then { TextEntityFilter }}
          <TextEntityFilter {filter} />
        {/await}
      {:else if isFilterType(filter, FILTER_TYPE.NumberQuestionFilter)}
        {#await import('./numeric') then { NumericEntityFilter }}
          <NumericEntityFilter {filter} {targets} />
        {/await}
      {:else if _isEnumeratedFilter(filter)}
        {#await import('./enumerated') then { EnumeratedEntityFilter }}
          <EnumeratedEntityFilter {filter} {targets} />
        {/await}
      {:else}
        <ErrorMessage message={t('entityFilters.error')} />
      {/if}
    </Expander>
  {/each}
</div>
