# InfoItem

Used to show a label-content pair in a Candidate's basic information.

### Properties

- `label`: The label of the information.
- `vertical`: Layout mode for the item. Default: `false`
- `children`: The information contents.
- Any valid attributes of a `<div>` element

### Usage

```tsx
<InfoItem label={t('candidateApp.common.firstNameLabel')}>{candidate.firstName}</InfoItem>
```

## Source

- Component: [apps/frontend/src/lib/dynamic-components/entityDetails/InfoItem.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/entityDetails/InfoItem.svelte)
- Types: [apps/frontend/src/lib/dynamic-components/entityDetails/InfoItem.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/entityDetails/InfoItem.type.ts)
