# ConstituencySelector

Display constituency selection inputs for elections.

If any of the `ConstituencyGroup`s for the `Election`s are shared, only a single selector will be shown for them. Also, if any `ConstituencyGroup`s are completely subsumed by another, only the selector for the child group will be shown and the selected parent will be implied.

### Properties

- `elections`: The `Election`s for which to show the `Constituency`s.
- `disableSorting`: If `true`, the `Constituency`s are not ordered alphabetically. Default: `false`
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. Default: `false`
- `selected`: Bindable value for the `Id`s of the selected `Constituency`s organized by `Election`.
- `useSingleGroup`: If specified, only this group is offered for selection and the `Constituency`s for the `Election`s are implied from this one. Only meaningful when there are multiple `Election`s whose `ConstituencyGroup` hierarchies overlap only partially. To be used when the `elections.startFromConstituencyGroup` setting is set.
- `selectionComplete`: A utility bindable value which is `true` when a selection has been made for each `Election` or for the single group if `useSingleGroup` is set.
- `onChange`: Callback triggered when the selection changes.
- Any valid attributes of a `<div>` element

### Usage

```tsx
<ConstituencySelector
  elections={$dataRoot.elections}
  bind:selected={$selectedConstituencies}
  onChange={(sel) => console.info('Selected', sel)}
/>
```

## Source

[frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte)

[frontend/src/lib/components/constituencySelector/ConstituencySelector.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/constituencySelector/ConstituencySelector.type.ts)
