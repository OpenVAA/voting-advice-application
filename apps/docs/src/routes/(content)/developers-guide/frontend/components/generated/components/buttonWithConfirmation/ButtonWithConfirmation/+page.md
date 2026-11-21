# ButtonWithConfirmation

A button which asks the user to confirm before the action is executed, in a confirmation modal or inline, in place of the button.

A destructive action confirms inline when it acts on one item among several shown together, such as a card in a list, so that the question stays beside the item it concerns and the rest of the page stays in view; an action on the page or the whole of its data confirms in the modal.

### Properties

- `modalTitle`: The question the confirmation asks: the title of the confirmation modal, or the inline prompt.
- `onConfirm`: Callback triggered when the user confirms the action.
- `onCancel`: Callback triggered when the user cancels the action.
- `cancelLabel`: The label for the cancel button. @default t('common.cancel')
- `confirmLabel`: The label for the confirm button. @default t('common.continue')
- `confirmationType`: Whether the confirmation is asked in a modal dialog or inline. @default 'dialog'
- `open`: Bindable. Whether the inline prompt is shown in place of the button. Not used with `confirmationType='dialog'`. @default false
- Any valid properties of a `<Button>` component except `href` and `onclick`.

### Inline confirmation

Pressing the button replaces it with a warning that asks `modalTitle`, followed by Confirm and Cancel. Confirm has the button's `icon`, `iconPos` and `color`, and is described by the question.

- Pressing the button moves focus to Confirm; Cancel closes the prompt and moves focus back to the button.
- While the promise `onConfirm` returns is pending, Confirm shows its loading state and Cancel is disabled. The prompt then closes and focus is left to the caller, whose action may have removed the button.
- With a `data-testid` on the button, the prompt, Confirm and Cancel carry it followed by `-prompt`, `-confirm` and `-cancel`.

### Reactivity

Reactivity is not supported for the properties: `variant`, `iconPos`.

### Usage

```tsx
<ButtonWithConfirmation
  text="Delete"
  modalTitle="Delete the job?"
  onConfirm={deleteJob} />

<ButtonWithConfirmation
  confirmationType="inline"
  bind:open={confirming}
  text="Delete"
  icon="removeFromList"
  color="warning"
  modalTitle="Delete this nomination?"
  confirmLabel="Delete"
  onConfirm={deleteNomination} />
```

## Source

- Component: [apps/frontend/src/lib/components/buttonWithConfirmation/ButtonWithConfirmation.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/buttonWithConfirmation/ButtonWithConfirmation.svelte)
- Types: [apps/frontend/src/lib/components/buttonWithConfirmation/ButtonWithConfirmation.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/buttonWithConfirmation/ButtonWithConfirmation.type.ts)
