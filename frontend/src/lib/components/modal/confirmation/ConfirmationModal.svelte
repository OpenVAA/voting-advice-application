<!--
@component
A modal dialog that will automatically close after a set amount of time.

### Slots

- `actions`: The action buttons to display.
- default: The content of the modal.

### Properties

- `title`: The title of the modal
- `timerDuration`: Logout timer duration in seconds. @default `30`
- `timeLeft`: Bind to this to get time left in seconds 
- Any valid properties of a `<Modal>` component.

### Callbacks

- `onClose`: Callback for when the modal closes. Note that the modal may still be transitioning to `hidden`.
- `onOpen`: Callback for when the modal opens. Note that the modal may still be transitioning from `hidden`.
- `timeout`: Callback triggered right before the modal is closed due to a timeout. Note that the `onClose` callback will be triggered after this.

### Bindable functions

- `openModal`: Opens the modal
- `closeModal`: Closes the modal

### Accessibility

See the [`<Modal>` component](../Modal.svelte) documentation for more information.

### Usage

```tsx
<TimedModal 
  bind:closeModal
  title="Timout modal"
  onOpen={() => console.info('Opened')}
  onClose={() => console.info('Closed')}
  onTimeout={() => console.info('Timeout!')}>
  <p>Wait for it…</p>
  <Button slot="actions" on:click={closeModal} text="Close" variant="main"/>
</TimedModal>
```
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getComponentContext } from '$lib/contexts/component';
  import Modal from '../Modal.svelte';
  import type { ConfirmationModalProps } from './ConfirmationModal.type';

  type $$Props = ConfirmationModalProps;

  export let title: $$Props['title'];
  export let onConfirm: $$Props['onConfirm'];
  export let cancelLabel: $$Props['cancelLabel'] = undefined;
  export let confirmLabel: $$Props['confirmLabel'] = undefined;
  export let onCancel: $$Props['onCancel'] = undefined;
  export let openModal: $$Props['openModal'] = undefined;
  export let closeModal: $$Props['closeModal'] = undefined;

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
    closeModal?.(true);
  }
</script>

<Modal bind:closeModal bind:openModal onClose={handleClose} {title} closeOnBackdropClick={false} {...$$restProps}>
  <slot />
  <div slot="actions" class="flex w-full flex-col items-center">
    <Button on:click={() => closeModal?.()} text={cancelLabel || $t('common.cancel')} />
    <Button on:click={handleConfirm} text={confirmLabel || $t('common.continue')} variant="main" />
  </div>
</Modal>
