# ElectionSelector

# Election selection component

Display constituency selection inputs for elections.

If there’s only one option, it is automatically selected and no interactions are allowed.

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
  onChange={(ids) => console.info('Selected', ids)}
/>
```

## Source

[frontend/src/lib/components/electionSelector/ElectionSelector.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/electionSelector/ElectionSelector.svelte)

[frontend/src/lib/components/electionSelector/ElectionSelector.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/electionSelector/ElectionSelector.type.ts)
