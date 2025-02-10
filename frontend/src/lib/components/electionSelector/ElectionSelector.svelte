<!--@component

# Election selection component

Display constituency selection inputs for elections.

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

<script lang="ts">
  import { concatClass, getUUID } from '$lib/utils/components';
  import type { ElectionSelectorProps } from './ElectionSelector.type';

  type $$Props = ElectionSelectorProps;

  export let elections: $$Props['elections'];
  export let selected: NonNullable<$$Props['selected']> = [];
  export let onChange: $$Props['onChange'] = undefined;

  const groupName = getUUID();

  function handleChange(): void {
    onChange?.(selected);
  }
</script>

<div {...concatClass($$restProps, 'grid gap-sm')}>
  {#each elections as { id, name }}
    <label class="label cursor-pointer justify-start gap-sm !p-0">
      <input
        type="checkbox"
        class="checkbox"
        name={groupName}
        value={id}
        bind:group={selected}
        on:change={handleChange} />
      <span class="label-text">
        {name}
      </span>
    </label>
  {/each}
</div>
