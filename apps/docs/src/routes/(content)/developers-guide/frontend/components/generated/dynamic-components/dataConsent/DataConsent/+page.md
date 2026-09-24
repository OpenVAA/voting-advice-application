# DataConsent

Show buttons opting in or out of data collection and possibly information about data collection.

### Dynamic component

Accesses `AppContext` to set and read `userPreferences`.

### Properties

- `description`: Whether and how to show the data consent description. Default: `'modal'`
  - `'none'`: Don't show the description.
  - `'inline'`: Show the consent description above the buttons.
  - `'modal'`: Show a button that opens the description in a modal.
- Any valid attributes of a `<div>` element.

### Callback Props

- `onChange`: Called when the user changes their data collection consent. Receives the new `consent` value.

### Usage

```tsx
<DataConsent/>
<DataConsent description="none"/>
```

## Source

[apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte)

[apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.type.ts)
