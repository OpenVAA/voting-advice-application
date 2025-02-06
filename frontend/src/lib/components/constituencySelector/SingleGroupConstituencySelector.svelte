<!--@component

# Single group constituency selection component

Display constituency selection input for just one `ConstituencyGroup` which is not necessarily tied to a specific `Election`.

### Properties

- `group`: The `ConstituencyGroup` to be show.
- `label`: The `aria-label` and placeholder text for the select input. Default `$t('components.constituencySelector.selectPrompt', { constituencyGroup: group.name })`.
- `disableSorting`: If `true`, the `Constituency`s are not ordered alphabetically. Default `false`.
- `selected`: Bindable value for the `Id`s of the selected `Constituency`.
- `onChange`: Callback triggered when the selection changes.
- Any valid attributes of a `<select>` element.

### Usage

```tsx
<SingleGroupConstituencySelector
  group={election.constituencyGroups[0]}
  bind:selected={selectedId} 
  onChange={(id) => console.info('Selected constituency with id', id)} />
```
-->

<script lang="ts">
  import { type Constituency } from '@openvaa/data';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import type { SingleGroupConstituencySelectorProps } from './SingleGroupConstituencySelector.type';

  type $$Props = SingleGroupConstituencySelectorProps;

  export let group: $$Props['group'];
  export let label: $$Props['label'] = undefined;
  export let disableSorting: $$Props['disableSorting'] = undefined;
  export let selected: $$Props['selected'] = '';
  export let onChange: $$Props['onChange'] = undefined;

  const { locale, t } = getComponentContext();

  $: label ??= $t('components.constituencySelector.selectPrompt', { constituencyGroup: group.name });

  // If there's only one item, show that as preselected
  $: if (group.singleConstituency && !selected) {
    selected = group.singleConstituency.id;
    handleChange();
  }

  function sort(constituencies: Array<Constituency>): Array<Constituency> {
    return disableSorting ? constituencies : constituencies.sort((a, b) => a.name.localeCompare(b.name, $locale));
  }

  function handleChange(): void {
    onChange?.(selected);
  }
</script>

<select
  aria-label={label}
  {...concatClass($$restProps, 'select w-full max-w-md place-self-center')}
  bind:value={selected}
  on:change={handleChange}>
  {#if !group.singleConstituency}
    <option disabled selected value="">
      {label}
    </option>
    {#each sort(group.constituencies) as { id, name }}
      <option value={id}>{name}</option>
    {/each}
  {:else}
    {@const { id, name } = group.singleConstituency}
    <!-- If there's only one item, show that as preselected -->
    <option selected value={id}>{name}</option>
  {/if}
</select>
