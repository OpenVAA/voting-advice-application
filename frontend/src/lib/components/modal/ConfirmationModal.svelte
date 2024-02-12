<script lang="ts">
  import {_} from 'svelte-i18n';
  import {Button} from '$lib/components/button';
  import {onDestroy, onMount} from 'svelte';

  let isOpen = false; // variable for the modal state
  let modalContainer: HTMLDialogElement | null = null; // container element for the modal

  export let title: string;
  export let body = '';

  export let confirmText = 'OK';
  export let cancelText = 'Cancel';

  // Function for actions when the user clicks the confirm button
  export let confirmAction: () => void;

  export const openModal = () => {
    if (!isOpen) {
      modalContainer?.showModal();
      isOpen = true;
    }
  };

  export const closeModal = () => {
    if (isOpen) {
      modalContainer?.close();
      isOpen = false;
    }
  };

  // Close the modal by pressing the escape button
  const handleEscape = (e: KeyboardEvent) => {
    if (isOpen && e.key == 'Escape') {
      closeModal();
    }
  };

  // Add and remove event handles on mount and unmount
  onMount(() => {
    document.addEventListener('keydown', handleEscape);
  });
  onDestroy(() => {
    document.removeEventListener('keydown', handleEscape);
  });
</script>

<!--
@component
ConfirmationModal is a modal for asking the user to confirm some action.

### Slots

- default: Additional content for the modal, not required for basic use.

### Keyboard navigation

The dialog can be closed by pressing the `Escape` key.

### Bindable functions

- `openModal`: Opens the modal
- `closeModal`: Closes the modal
- `confirmAction`: Actions taken after user clicks the confirming button

### Properties

- `title` (required): Title shown on top of the modal
- `body` (optional): Explatonary text for the confirmation
- `confirmText` (optional): Text for the confirming button
- `cancelText` (optional): Text for the cancel button

### Usage

```tsx
<ConfirmationModal
  bind:openModal
  bind:closeModal
  confirmAction={exampleFunction}
  title="Confirm Example"
  body="Are you sure?"
/>
```
-->

<dialog bind:this={modalContainer} class="modal dark:bg-white dark:bg-opacity-10" aria-modal>
  <div class="modal-box items-center">
    <p class="text-center text-xl"><strong>{title}</strong></p>

    <p>{body}</p>

    <slot />

    <div class="flex justify-between">
      <Button on:click={confirmAction} text={confirmText} variant="main" class="mx-4 w-1/2 " />
      <Button on:click={closeModal} text={cancelText} class="mx-4 w-1/2" />
    </div>
  </div>
</dialog>
