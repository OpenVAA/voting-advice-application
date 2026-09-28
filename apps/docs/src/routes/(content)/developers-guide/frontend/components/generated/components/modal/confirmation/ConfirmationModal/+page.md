# ConfirmationModal

A modal dialog that asks for user confirmation.

### Properties

- `title`: The title of the modal
- `onConfirm`: The action to perform when the user confirms.
- `onCancel`: The action to perform when the user cancels.
- `confirmLabel`: Optional label for the confirm button. @default t('common.continue')
- `cancelLabel`: Optional label for the cancel button. @default t('common.cancel')
- Any valid properties of a `<Modal>` component.

### Bindable functions

- `openModal`: Opens the modal
- `closeModal`: Closes the modal

### Usage

```tsx
<ConfirmationModal
  bind:this={confirmModal}
  title="Are you sure?"
  onConfirm={() => doSomething()}
  onCancel={() => console.log('Cancelled')}>
  <p>This action cannot be undone.</p>
</ConfirmationModal>
```

## Source

[apps/frontend/src/lib/components/modal/confirmation/ConfirmationModal.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/modal/confirmation/ConfirmationModal.svelte)

[apps/frontend/src/lib/components/modal/confirmation/ConfirmationModal.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/modal/confirmation/ConfirmationModal.type.ts)
