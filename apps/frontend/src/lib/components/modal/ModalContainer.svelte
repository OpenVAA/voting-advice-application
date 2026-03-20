<!--
@component
A modal dialog.

### Properties

- `title`: The title of the modal
- `autofocusId`: Optional id of the element to autofocus when the dialog has opened. Note that this must be a focusable element. By default, the first focusable descendant will be focused.
- `closeOnBackdropClick`:  Whether to allow closing the modal by clicking outside of it. @default `true`
- Any valid properties of a `<dialog>` element.

### Callbacks

- `onClose`: Callback for when the modal closes. Note that the modal may still be transitioning to `hidden`.
- `onOpen`: Callback for when the modal opens. Note that the modal may still be transitioning from `hidden`.

### Bindable functions

- `openModal`: Opens the modal
- `closeModal`: Closes the modal

### Accessibility

- The modal can be closed by pressing the `Escape` key.
- When opened, either the element defined by `autofocusId` or the first focusable descendant will be focused on. Note that if the contents of the moadl are long, it's recommended to use the `autofocusId` property and select an element that appears at the start of the dialog to focus. If this is not an interactive element, set `tabindex="-1"` for it.
- For more accessibility information, see [ARIA Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/#keyboardinteraction)

### Usage

```tsx
<script lang="ts">
  let title = 'My Modal';
  let containerRef: ModalContainer;
</script>

<ModalContainer bind:this={containerRef} {title}>
  <div class="modal-box">
    <h2 class="mb-lg text-center">{title}</h2>
    Content here
  </div>
</ModalContainer>
```
-->

<svelte:options runes />

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { attemptFocus, focusFirstDescendant } from '$lib/utils/aria/focus';
  import { concatClass } from '$lib/utils/components';
  import { DELAY } from '$lib/utils/timing';
  import type { ModalContainerProps } from './ModalContainer.type';

  let {
    title,
    autofocusId = undefined,
    closeOnBackdropClick = true,
    isOpen = $bindable(false),
    onClose = undefined,
    onOpen = undefined,
    children,
    ...restProps
  }: ModalContainerProps = $props();

  /** Bind to open the modal dialog */
  export function openModal(noCallbacks?: boolean) {
    handleOpen(noCallbacks);
  }

  /** Bind to close the modal dialog */
  export function closeModal(noCallbacks?: boolean) {
    handleClose(noCallbacks);
  }

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Events
  ////////////////////////////////////////////////////////////////////

  // Used to track the animation when the element is being hidden
  let inTransition = $state(false);
  // Container element for the modal
  let modalContainer: HTMLDialogElement | undefined = $state(undefined);

  /**
   * Close the dialog by pressing the escape key. NB. Some browsers implement a default behaviour for the escape key, which closes the dialog, but this prevents us from performing cleanup, so we need a custom event handler.
   * @param e - The keyboard event.
   */
  function handleEscape(e: KeyboardEvent) {
    if (isOpen && e.key == 'Escape') {
      handleClose();
      e.stopPropagation();
    }
  }

  function handleClose(noCallbacks?: boolean) {
    modalContainer?.close();
    inTransition = true;
    isOpen = false;
    if (!noCallbacks) onClose?.();
  }

  function handleOpen(noCallbacks?: boolean) {
    modalContainer?.showModal();
    inTransition = false;
    isOpen = true;
    if (!noCallbacks) onOpen?.();
    setTimeout(() => {
      if (!isOpen) return;
      if (modalContainer) {
        if (autofocusId) {
          const el = modalContainer.querySelector(`#${autofocusId}`);
          if (el) attemptFocus(el);
        } else if (autofocusId !== false) {
          focusFirstDescendant(modalContainer);
        }
      }
    }, DELAY.sm);
  }

  function handleTransitionEnd() {
    inTransition = false;
  }
</script>

<svelte:document onkeydown={handleEscape} />

<dialog
  bind:this={modalContainer}
  ontransitionend={handleTransitionEnd}
  class:hidden={!isOpen && !inTransition}
  aria-modal="true"
  aria-label={title}
  {...concatClass(restProps, 'modal backdrop:bg-neutral backdrop:opacity-60')}>
  {@render children?.()}
  {#if closeOnBackdropClick}
    <div class="modal-backdrop">
      <button onclick={() => handleClose()} tabindex="-1">{t('common.closeDialog')}</button>
    </div>
  {/if}
</dialog>
