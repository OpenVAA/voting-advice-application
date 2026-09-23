# ButtonWithConfirmation

A button which will open a confirmation modal when clicked before the action is executed.

### Properties

- `modalTitle`: The title of the confirmation modal.
- `onConfirm`: Callback triggered when the user confirms the action.
- `onCancel`: Callback triggered when the user cancels the action.
- `cancelLabel`: The label for the cancel button in the modal.
- `confirmLabel`: The label for the confirm button in the modal.
- Any valid properties of a `<Button>` component except `href` and `onclick`.

### Reactivity

Reactivity is not supported for the properties: `variant`, `iconPos`.

### Usage

```tsx
<ButtonWithConfirmation onclick={next} variant="main" icon="next" text="Continue" />
```

## Source

[apps/frontend/src/lib/components/buttonWithConfirmation/ButtonWithConfirmation.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/buttonWithConfirmation/ButtonWithConfirmation.svelte)

[apps/frontend/src/lib/components/buttonWithConfirmation/ButtonWithConfirmation.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/buttonWithConfirmation/ButtonWithConfirmation.type.ts)
