<!--
@component
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
<ButtonWithConfirmation onclick={next} variant="main" icon="next"
text="Continue"/>
```
-->

<svelte:options runes />

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { ConfirmationModal } from '$lib/components/modal/confirmation';
  import type { ButtonWithConfirmationProps } from './ButtonWithConfirmation.type';

  let { text, onConfirm, modalTitle, onCancel, cancelLabel, confirmLabel, children, ...restProps }: ButtonWithConfirmationProps = $props();

  let confirmModalRef: ConfirmationModal;
</script>

<Button {text} onclick={() => confirmModalRef?.openModal()} {...restProps}></Button>

<ConfirmationModal bind:this={confirmModalRef} title={modalTitle} {...{ onConfirm, onCancel, cancelLabel, confirmLabel }}>
  {@render children?.()}
</ConfirmationModal>
