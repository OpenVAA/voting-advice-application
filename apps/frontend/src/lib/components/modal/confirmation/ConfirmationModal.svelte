<!--
@component
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
-->

<svelte:options runes />

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getComponentContext } from '$lib/contexts/component';
  import Modal from '../Modal.svelte';
  import type { ConfirmationModalProps } from './ConfirmationModal.type';

  let {
    title,
    onConfirm,
    cancelLabel = undefined,
    confirmLabel = undefined,
    onCancel = undefined,
    children,
    ...restProps
  }: ConfirmationModalProps = $props();

  let modalRef: Modal | undefined = $state(undefined);

  /** Bind to open the modal dialog */
  export function openModal(noCallbacks?: boolean) {
    modalRef?.openModal(noCallbacks);
  }

  /** Bind to close the modal dialog */
  export function closeModal(noCallbacks?: boolean) {
    modalRef?.closeModal(noCallbacks);
  }

  ////////////////////////////////////////////////////////////////////
  // Contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Events and callbacks
  ////////////////////////////////////////////////////////////////////

  function handleClose() {
    onCancel?.();
  }

  function handleConfirm() {
    onConfirm?.();
    modalRef?.closeModal(true);
  }
</script>

<Modal bind:this={modalRef} onClose={handleClose} {title} closeOnBackdropClick={false} {...restProps}>
  {@render children?.()}
  {#snippet actions()}
    <div class="flex w-full flex-col items-center">
      <Button onclick={() => modalRef?.closeModal()} text={cancelLabel || t('common.cancel')} />
      <Button onclick={handleConfirm} text={confirmLabel || t('common.continue')} variant="main" />
    </div>
  {/snippet}
</Modal>
