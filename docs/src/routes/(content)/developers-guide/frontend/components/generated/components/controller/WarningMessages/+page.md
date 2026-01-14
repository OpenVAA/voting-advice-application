# WarningMessages

Reusable component for displaying warning and error messages with scrolling.

### Properties

- `warnings`: Array of warning messages to display. Default: `[]`
- `errors`: Array of error messages to display. Default: `[]`
- Any valid attributes of a `<div>` element

### Usage

```tsx
<WarningMessages warnings={warningMessages} errors={errorMessages} />
```

## Source

[frontend/src/lib/components/controller/WarningMessages.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/controller/WarningMessages.svelte)

[frontend/src/lib/components/controller/WarningMessages.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/controller/WarningMessages.type.ts)
