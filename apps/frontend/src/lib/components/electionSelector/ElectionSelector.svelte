<!--@component

# Election selection component

Display constituency selection inputs for elections.

If there's only one option, it is automatically selected and no interactions are allowed.

### Properties

- `elections`: The `Election`s to show.
- `selected`: Bindable value for the `Id`s of the selected elections.
- `onChange`: Callback triggered when the selection changes.
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<ElectionSelector
  elections={$dataRoot.elections}
  bind:selected={$selectedElectionIds}
  onChange={(ids) => console.info('Selected', ids)} />
```
-->

<svelte:options runes />

<script lang="ts">
  import { concatClass, getUUID } from '$lib/utils/components';
  import type { ElectionSelectorProps } from './ElectionSelector.type';

  let { elections, selected = $bindable([]), onChange, ...restProps }: ElectionSelectorProps = $props();

  const groupName = getUUID();

  // If there's only one option, it is automatically selected
  if (elections.length === 1 && !selected.length) {
    selected = [elections[0].id];
    handleChange();
  }

  function handleChange(): void {
    onChange?.(selected);
  }
</script>

<div data-testid="election-selector" {...concatClass(restProps, 'grid gap-sm')}>
  {#each elections as { id, name }}
    <label class="label gap-sm cursor-pointer justify-start !p-0" class:pointer-events-none={elections.length === 1}>
      <input
        type="checkbox"
        class="checkbox"
        name={groupName}
        value={id}
        disabled={elections.length === 1}
        data-testid="election-selector-option"
        bind:group={selected}
        onchange={handleChange} />
      <span>
        {name}
      </span>
    </label>
  {/each}
</div>
