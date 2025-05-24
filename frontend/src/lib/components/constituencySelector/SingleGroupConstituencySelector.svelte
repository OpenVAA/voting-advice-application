<!--@component

# Single group constituency selection component

Display constituency selection input for just one `ConstituencyGroup` which is not necessarily tied to a specific `Election`.

### Properties

- `group`: The `ConstituencyGroup` to be show.
- `label`: The `aria-label` and placeholder text for the select input. Default `$t('components.constituencySelector.selectPrompt', { constituencyGroup: group.name })`.
- `disableSorting`: If `true`, the `Constituency`s are not ordered alphabetically. Default `false`.
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. @default false
- `selected`: Bindable value for the `Id` of the selected `Constituency`.
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
  import Select from '../select/Select.svelte';
  import type { SingleGroupConstituencySelectorProps } from './SingleGroupConstituencySelector.type';

  type $$Props = SingleGroupConstituencySelectorProps;

  export let group: $$Props['group'];
  export let label: $$Props['label'] = undefined;
  export let disableSorting: $$Props['disableSorting'] = undefined;
  export let onShadedBg: $$Props['onShadedBg'] = undefined;
  export let selected: $$Props['selected'] = '';
  export let onChange: $$Props['onChange'] = undefined;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { locale, t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Intialization
  ////////////////////////////////////////////////////////////////////

  $: label ??= $t('components.constituencySelector.selectPrompt', { constituencyGroup: group.name });

  ////////////////////////////////////////////////////////////////////
  // Sort items
  ////////////////////////////////////////////////////////////////////

  function sort(constituencies: Array<Constituency>): Array<Constituency> {
    return disableSorting ? constituencies : constituencies.sort((a, b) => a.name.localeCompare(b.name, $locale));
  }
</script>

<Select
  {label}
  options={sort(group.constituencies).map((c) => ({ id: c.id, label: c.name }))}
  bind:selected
  {onChange}
  {onShadedBg}
  autocomplete={group.singleConstituency ? 'off' : 'on'} />
