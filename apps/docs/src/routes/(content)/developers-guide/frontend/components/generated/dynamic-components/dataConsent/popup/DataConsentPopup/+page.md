# DataConsentPopup

A modal dialog that asks the voter for data consent. It opens as it mounts, and the page under it is inert while it is open.

Choosing in its consent control records that choice and closes the dialog. Closing it without a choice, by Escape, its close button, a click on the backdrop or a close the platform makes, is a decline: it is recorded exactly as the decline button records it.

### Dynamic component

Accesses `AppContext` for the translations and `setDataConsent`.

### Properties

- Any valid properties of a `<Modal>` component.

### Callbacks

- `onClose`: Callback for when the dialog closes, after a decline without a choice has been recorded.

### Usage

```tsx
<DataConsentPopup />
```

## Source

- Component: [apps/frontend/src/lib/dynamic-components/dataConsent/popup/DataConsentPopup.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/dataConsent/popup/DataConsentPopup.svelte)
- Types: [apps/frontend/src/lib/dynamic-components/dataConsent/popup/DataConsentPopup.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/dataConsent/popup/DataConsentPopup.type.ts)
