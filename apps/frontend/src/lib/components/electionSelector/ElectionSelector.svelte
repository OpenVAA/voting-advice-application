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
// bind: keep — usage example in @component doc
<ElectionSelector
  elections={$dataRoot.elections}
  bind:selected={$selectedElectionIds}
  onChange={(ids) => console.info('Selected', ids)} />
```
-->

<script lang="ts">
  import { concatClass, getUUID } from '$lib/utils/components';
  import type { ElectionSelectorProps } from './ElectionSelector.type';

  let { elections, selected = $bindable([]), onChange, ...restProps }: ElectionSelectorProps = $props();

  const groupName = getUUID();

  // If there's only one option, it is automatically selected. This must
  // run reactively because `elections` may arrive asynchronously after
  // the component mounts (Phase 64-04 fix — the previous init-time
  // short-circuit fired against a snapshot value of an empty `elections`
  // array on first paint and never re-fired when the data resolved,
  // contributing to voter-app cascade failures in the canonical
  // Playwright capture).
  $effect(() => {
    if (elections.length === 1 && !selected.length) {
      selected = [elections[0].id];
      handleChange();
    }
  });

  function handleChange(): void {
    onChange?.(selected);
  }
</script>

<div data-testid="election-selector" {...concatClass(restProps, 'grid gap-sm')}>
  {#each elections as { id, name }}
    <label class="label gap-sm cursor-pointer justify-start !p-0" class:pointer-events-none={elections.length === 1}>
      <!-- bind: keep — two-way DOM checkbox group bind:group={selected}; selected is $bindable([]) -->
      <input
        bind:group={selected}
        type="checkbox"
        class="checkbox"
        name={groupName}
        value={id}
        disabled={elections.length === 1}
        data-testid="election-selector-option"
        onchange={handleChange} />
      <span>
        {name}
      </span>
    </label>
  {/each}
</div>
