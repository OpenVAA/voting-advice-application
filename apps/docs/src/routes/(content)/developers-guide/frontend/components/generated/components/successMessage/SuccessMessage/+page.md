# SuccessMessage

Used to display a message when an action succeeds.

### Properties

- `inline`: Whether to show an inline version of the message. By default the message tries to center itself in the available area and displays a large emoji. Default: `false`
- `message`: The message to display. Default: `$t('common.success')`
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<SuccessMessage />
<SuccessMessage inline message="Password saved!" />
```

## Source

[frontend/src/lib/components/successMessage/SuccessMessage.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/successMessage/SuccessMessage.svelte)

[frontend/src/lib/components/successMessage/SuccessMessage.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/successMessage/SuccessMessage.type.ts)
