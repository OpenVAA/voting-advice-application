# EntitySelector

A single-choice group whose options are entities, each shown as a compact `EntityCard`, with plain options before and after them: "none of these", "another one", and so on.

The component is given its options and knows nothing of what a choice means. It reads no entity that is not passed to it: an option exists only for an entry of `options`.

### Dynamic component

This is a dynamic component, because it renders the dynamic `EntityCard` component.

### Properties

- `legend`: The group's name, rendered as its legend.
- `options`: The options, rendered in the order given. Each has a `value`, unique within the group, a `name`, an optional `hint` and a `kind`:
  - `'entity'`: An option with an `entity`, an object of the data root, shown as its card.
  - `'none'`, `'other'`, `'unlisted'`: A plain option, shown as its name.
- `required`: Whether a choice is required. The group is then marked `aria-required`, and a badge is shown beside the legend until something is chosen. @default `false`
- `error`: The error line. Its presence puts the group in error.
- `emptyMessage`: A line shown under the legend while none of the options is an entity.
- `detail`: A snippet rendered directly under the chosen option's row, given that option.
- `onChange`: Called with the chosen option's `value` when the user chooses.
- Any valid attributes of a `<fieldset>` element.

### Bindable properties

- `selected`: The `value` of the chosen option, `undefined` while nothing is chosen.

### Accessibility

- The group is a `<fieldset>` with the role `radiogroup`, named by its legend. In error it is `aria-invalid` and described by its error line, which is an alert.
- The options are native radios that share one `name`, so the group is one tab stop, and the arrow keys move and choose. Choosing an option does not move focus.
- Each radio is named by its option's `name` alone, through a label that covers the whole row and so is the pointer target. The card and the visible name are hidden from assistive technology, and the card holds nothing focusable and takes no pointer events, so a press on it reaches the label. A hint describes its radio.
- The chosen option is told twice: by the radio's own mark and by the row's fill.
- Every option is a row of at least the touch target's height. There is no search, no paging and no inner scroll region.

### Usage

```tsx
<EntitySelector
  legend="Party"
  options={[
    { kind: 'none', value: 'none', name: 'No party' },
    ...parties.map((party) => ({ kind: 'entity', value: party.id, name: party.name, entity: party })),
    { kind: 'other', value: 'other', name: 'Another party' }
  ]}
  bind:selected
  required>
  {#snippet detail(option)}
    {#if option.kind === 'other'}
      <Input type="text" label="The party's name" bind:value={otherName} />
    {/if}
  {/snippet}
</EntitySelector>
```

## Source

- Component: [apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.svelte)
- Types: [apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.type.ts)
