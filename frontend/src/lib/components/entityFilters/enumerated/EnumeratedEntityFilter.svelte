<script lang="ts">
  import {isMissing, type Choice} from '$voter/vaa-filters';
  import {t} from '$lib/i18n';
  import {concatProps, getUUID} from '$lib/utils/components';
  import {logDebugError} from '$lib/utils/logger';
  import type {EnumeratedEntityFilterProps} from './EnumeratedEntityFilter.type';

  type $$Props = EnumeratedEntityFilterProps;

  export let filter: $$Props['filter'];
  export let targets: $$Props['targets'];

  /** A unique input.value for missing values */
  const missingValue = getUUID();

  // Initialize values and possibly saved filter state
  const values = filter.parseValues(targets);
  let selected = (filter.include?.length ? filter.include : values.map((v) => v.value)).map((v) =>
    isMissing(isMissing) ? missingValue : v
  );

  $: filter.include = selected?.length === values.length ? undefined : selected;

  /**
   * Get the text label from the object returned by the filter.
   * @param object party object or choice
   */
  function getLabel(object: PartyProps | Choice | undefined): string | undefined {
    if (!object) return $t('components.entityFilters.missingValue');
    if ('name' in object) return object.name;
    if ('label' in object) return object.label;
    logDebugError(
      `EnumeratedEntityFilter: entity's answer resulted in an invalid object: ${object}`
    );
    return undefined;
  }
</script>

<!--
@component
Render an enumerated filter for entities that displays a list of values to include in the results. These can be, for example, parties or answers to enumerated questions, like gender or language. The filter works for both single and multiple selection questions.

### Properties

- `filter`: The filter object
- `targets`: An array of target entities or rankings
- Any valid attributes of a `<form>` element

### Usage

```tsx
<EnumeratedEntityFilter {filter} targets={candidates}/>
```
-->

<form
  {...concatProps($$restProps, {
    class: 'grid grid-flow-row gap-x-xl gap-y-sm items-start',
    style: 'grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));'
  })}>
  {#each values as { value, object, count }}
    {@const label = getLabel(object)}
    {#if label != null}
      <label class="label cursor-pointer !items-start gap-sm !p-0">
        <input type="checkbox" class="checkbox" {value} bind:group={selected} />
        <span class="label-text w-full text-left">
          {label} <span class="pl-sm text-secondary">{count}</span>
        </span>
      </label>
    {/if}
  {/each}
</form>
