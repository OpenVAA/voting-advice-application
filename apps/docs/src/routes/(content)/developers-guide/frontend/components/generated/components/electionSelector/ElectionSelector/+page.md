# ElectionSelector

# Election selection component

Display the elections to select from, each with a checkbox.

If there's only one option, it is automatically selected and no interactions are allowed.

Each election is a checkbox with the election's name beside it. A name longer than the space beside the checkbox wraps onto further lines instead of widening the selector.

### Properties

- `elections`: The `Election`s to show.
- `selected`: Bindable value for the `Id`s of the selected elections.
- `onChange`: Callback triggered when the selection changes.
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<ElectionSelector elections={ctx.dataRoot.elections} bind:selected onChange={(ids) => console.info('Selected', ids)} />
```

## Source

- Component: [apps/frontend/src/lib/components/electionSelector/ElectionSelector.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/electionSelector/ElectionSelector.svelte)
- Types: [apps/frontend/src/lib/components/electionSelector/ElectionSelector.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/electionSelector/ElectionSelector.type.ts)
