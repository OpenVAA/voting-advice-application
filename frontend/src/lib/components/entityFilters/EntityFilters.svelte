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
  import {
    ChoiceQuestionFilter,
    NumberFilter,
    NumberQuestionFilter,
    ObjectFilter,
    TextFilter
  } from '@openvaa/filters';
  import { Expander } from '$lib/components/expander';
  import { concatClass } from '$lib/utils/components';
  import type { EntityFiltersProps } from './EntityFilters.type';

  type $$Props = EntityFiltersProps;

  export let filterGroup: $$Props['filterGroup'];
  export let targets: $$Props['targets'];
</script>

<div {...concatClass($$restProps, 'flex flex-col gap-md')}>
  {#each filterGroup.filters as filter}
    <Expander
      title={filter.name}
      variant="question"
      titleClass="!text-left"
      defaultExpanded={filter.active || filter instanceof TextFilter}>
      {#if filter instanceof TextFilter}
        {#await import('./text') then { TextEntityFilter }}
          <svelte:component this={TextEntityFilter} {filter} />
        {/await}
      {:else if filter instanceof NumberFilter || filter instanceof NumberQuestionFilter}
        {#await import('./numeric') then { NumericEntityFilter }}
          <svelte:component this={NumericEntityFilter} {filter} {targets} />
        {/await}
      {:else if filter instanceof ObjectFilter || filter instanceof ChoiceQuestionFilter}
        {#await import('./enumerated') then { EnumeratedEntityFilter }}
          <svelte:component this={EnumeratedEntityFilter} {filter} {targets} />
        {/await}
      {/if}
    </Expander>
  {/each}
</div>
