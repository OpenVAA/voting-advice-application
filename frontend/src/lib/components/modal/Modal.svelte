<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { t } from '$lib/i18n';
  import { attemptFocus, focusFirstDescendant } from '$lib/utils/aria/focus';
  import { concatClass, getUUID } from '$lib/utils/components';
  import type { ModalProps } from './Modal.type';

  type $$Props = ModalProps;

  export let title: $$Props['title'];
  export let autofocusId: $$Props['autofocusId'] = undefined;
  export let boxClass: $$Props['boxClass'] = '';
  export let closeOnBackdropClick: $$Props['closeOnBackdropClick'] = true;
  export let isOpen: $$Props['isOpen'] = false;

  /** Bind to open the modal dialog */
  export function openModal() {
    if (!isOpen) {
      modalContainer?.showModal();
      onOpen();
    }
  }
  /** Bind to close the modal dialog */
  export function closeModal() {
    if (isOpen) modalContainer?.close();
  }

  const dispatchEvent = createEventDispatcher();

  // We need a small timeout before trying to focus for the dialog to be visible
  const FOCUS_TIMEOUT = 225;

  // Used to track the animation when the element is being hidden
  let inTransition = false;
  // Container element for the modal
  let modalContainer: HTMLDialogElement | undefined;

  // For the h2 element
  const titleId = getUUID();

  /**
   * Close the dialog by pressing the escape key. NB. Some browsers implement a default behaviour for the escape key, which closes the dialog, but this prevents us from performing cleanup, so we need a custom event handler.
   * @param e The keyboard event.
   */
  function handleEscape(e: KeyboardEvent) {
    if (isOpen && e.key == 'Escape') {
      closeModal();
      e.stopPropagation();
    }
  }

  function onClose() {
    inTransition = true;
    isOpen = false;
    dispatchEvent('close');
  }

  function onOpen() {
    inTransition = false;
    isOpen = true;
    dispatchEvent('open');
    setTimeout(() => {
      if (!isOpen) return;
      if (modalContainer) {
        if (autofocusId != null) {
          const el = modalContainer.querySelector(`#${autofocusId}`);
          if (el) attemptFocus(el);
        } else {
          focusFirstDescendant(modalContainer);
        }
      }
    }, FOCUS_TIMEOUT);
  }

  function onTransitionEnd() {
    inTransition = false;
  }
</script>

<!--
@component
A modal dialog.

### Slots

- `actions`: The action buttons to display.
- default: The content of the modal.

### Properties

- `title`: The title of the modal 
- `autofocusId`: Optional id of the element to autofocus when the dialog has opened. Note that this must be a focusable element. By default, the first focusable descendant will be focused.
- `boxClass`: Optional classes to add to the dialog box itself. Note that the basic `class` property is applied to the `<dialog>` element, which is rarely needed.
- `closeOnBackdropClick`:  Whether to allow closing the modal by clicking outside of it. @default `true`
- Any valid properties of a `<dialog>` element.

### Bindable functions

- `openModal`: Opens the modal
- `closeModal`: Closes the modal

### Events

- `open`: Fired after the modal is opened. Note that the modal may still be transitioning from `hidden`.
- `close`: Fired when the modal is closed by any means. Note that the modal may still be transitioning to `hidden`.
- Neither event has any details.

### Accessibility

- The modal can be closed by pressing the `Escape` key.
- When opened, either the element defined by `autofocusId` or the first focusable descendant will be focused on. Note that if the contents of the moadl are long, it's recommended to use the `autofocusId` property and select an element that appears at the start of the dialog to focus. If this is not an interactive element, set `tabindex="-1"` for it.
- For more accessibility information, see [ARIA Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/#keyboardinteraction)

### Usage

```tsx
<script lang="ts">
  let openModal: () => void;
  let closeModal: () => void;
  let answer = '?';

  // Will only set answer if it's not been set yet, because this will fire even when we close the modal ourselves
  function setAnswer(a: string) {
    if (answer == '?') answer = a;
  }
</script>

<Button on:click={openModal}>Open modal</Button>

<h2>Answer: {answer}</h2>

<Modal 
  bind:closeModal
  bind:openModal
  title="What's your answer?"
  on:open={() => answer = '?'}
  on:close={() => setAnswer('No')}>
  <p>Click below or hit ESC to exit.</p>
  <div slot="actions" class="flex flex-col w-full max-w-md mx-auto">
    <Button on:click={() => {setAnswer('Yes'); closeModal();}} text="Yes" variant="main"/>
    <Button on:click={closeModal} text="No"/>
  </div>
</Modal>
```
-->

<svelte:document on:keydown={handleEscape} />

<dialog
  bind:this={modalContainer}
  on:close={onClose}
  on:transitionend={onTransitionEnd}
  class:hidden={!isOpen && !inTransition}
  aria-modal="true"
  aria-labelledby={titleId}
  {...concatClass($$restProps, 'modal modal-bottom sm:modal-middle backdrop:bg-neutral backdrop:opacity-60')}>
  <div class="modal-box {boxClass ?? ''}">
    <h2 id={titleId} class="mb-lg text-center">{title}</h2>
    <slot />
    {#if $$slots.actions}
      <div class="modal-action justify-center">
        <slot name="actions" />
      </div>
    {/if}
    <form method="dialog">
      <button class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">
        <span aria-hidden="true">✕</span>
        <span class="sr-only">{$t('common.closeDialog')}</span>
      </button>
    </form>
  </div>
  {#if closeOnBackdropClick}
    <div class="modal-backdrop" aria-hidden="true">
      <button on:click={closeModal} tabindex="-1">{$t('common.closeDialog')}</button>
    </div>
  {/if}
</dialog>
