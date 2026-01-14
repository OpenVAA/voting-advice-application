# InfoItem

Used to show a label-content pair in a Candidate's basic information.

### Properties

- `label`: The label of the information.
- `vertical`: Layout mode for the item. Default: `false`
- Any valid attributes of a `<div>` element

### Slots

- default: the information contents.

### Usage

```tsx
<InfoItem label={$t('candidateApp.common.firstNameLabel')}>{candidate.firstName}</InfoItem>
```

## Source

[frontend/src/lib/dynamic-components/entityDetails/InfoItem.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityDetails/InfoItem.svelte)

[frontend/src/lib/dynamic-components/entityDetails/InfoItem.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityDetails/InfoItem.type.ts)
