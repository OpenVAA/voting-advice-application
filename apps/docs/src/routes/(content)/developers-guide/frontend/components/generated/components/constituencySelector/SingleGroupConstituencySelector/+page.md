# SingleGroupConstituencySelector

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
  onChange={(id) => console.info('Selected constituency with id', id)}
/>
```

## Source

[frontend/src/lib/components/constituencySelector/SingleGroupConstituencySelector.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/constituencySelector/SingleGroupConstituencySelector.svelte)

[frontend/src/lib/components/constituencySelector/SingleGroupConstituencySelector.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/constituencySelector/SingleGroupConstituencySelector.type.ts)
