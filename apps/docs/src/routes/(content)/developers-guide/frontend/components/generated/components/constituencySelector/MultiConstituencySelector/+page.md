# MultiConstituencySelector

# Multiple constituency selection component

Display, for each election, the constituencies to select from, each with a checkbox, so that several constituencies can be selected in one election. Use it where one entity stands in several constituencies of an election, as a party does; `ConstituencySelector` selects one constituency in each election.

- Each election has a section of its own, headed by the election's name when there are several. In it each constituency group of the election is a group of checkboxes, labelled by a prompt that names the group.
- The selection is one list of constituencies: a constituency that two elections share is selected in both sections at once.
- With `useSingleGroup` the one group is offered as one list for every election.

### Properties

- `elections`: The `Election`s for which to show the `Constituency`s.
- `disableSorting`: If `true`, the `Constituency`s are not ordered alphabetically. Default: `false`
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. Default: `false`
- `selected`: Bindable value for the `Id`s of the selected `Constituency`s, each once.
- `useSingleGroup`: If specified, only this group is offered for selection, as one list for every `Election`. To be used when the `elections.startFromConstituencyGroup` setting is set.
- `selectionComplete`: A utility bindable value which is `true` when at least one `Constituency` is selected for each `Election`, or in the single group if `useSingleGroup` is set.
- `onChange`: Callback triggered when the selection changes.
- Any valid attributes of a `<div>` element

### Accessibility

- Each group of checkboxes is a `<fieldset>` whose `<legend>` names the constituency group.

### Usage

```tsx
<MultiConstituencySelector
  elections={ctx.dataRoot.elections}
  bind:selected
  bind:selectionComplete
  onChange={(sel) => console.info('Selected', sel)}
/>
```

## Source

- Component: [apps/frontend/src/lib/components/constituencySelector/MultiConstituencySelector.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/constituencySelector/MultiConstituencySelector.svelte)
- Types: [apps/frontend/src/lib/components/constituencySelector/MultiConstituencySelector.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/constituencySelector/MultiConstituencySelector.type.ts)
