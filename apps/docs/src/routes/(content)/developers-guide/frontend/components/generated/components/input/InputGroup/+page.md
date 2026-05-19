# InputGroup

A componend used to group `Input`-components together.

NB. Only single-row `Input`s are joined and they should not have the `info` property set.

### Properties

- `title`: Optional title for the group.
- `info`: Optional info text for the group.

### Slots

- default: The `Input` components to group.

### Usage

```tsx
<InputGroup title="Nominations" info="These are placeholders.">
  <Input type="text" label="First nomination" />
  <Input type="text" label="Second nomination" />
  <Input type="text" label="Third nomination" />
</InputGroup>
```

## Source

[frontend/src/lib/components/input/InputGroup.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/input/InputGroup.svelte)

[frontend/src/lib/components/input/InputGroup.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/input/InputGroup.type.ts)
