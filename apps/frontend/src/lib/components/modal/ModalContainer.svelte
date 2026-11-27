<!--
@component A modal dialog.

### Properties

- `title`: The title of the modal
- `autofocusId`: Optional id of the element to autofocus when the dialog has opened. Note that this must be a focusable element. By default, the first focusable descendant will be focused.
- `closeOnBackdropClick`:  Whether to allow closing the modal by clicking outside of it. @default `true`
- `holdOpen`: Whether the modal refuses every close but `closeModal`, while something it started must finish. Its close controls read as unavailable while it is up: the backdrop's button is `aria-disabled`. @default `false`
- Any valid properties of a `<dialog>` element.

### Callbacks

- `onClose`: Callback for when the modal closes. Note that the modal may still be transitioning to `hidden`.
- `onOpen`: Callback for when the modal opens. Note that the modal may still be transitioning from `hidden`.

### Bindable functions

- `openModal`: Opens the modal
- `closeModal`: Closes the modal

### Accessibility

- The modal can be closed by pressing the `Escape` key.
- Escape closes only the topmost open modal, the one shown last, whether it is opened inside another modal, beside it or above a drawer of `DrawerHost`: that one takes the Escape first, and the one under it closes on the next. The modal that takes an Escape cancels the key's default action, so the browser does not close the dialog under it as well.
- A close the platform makes, such as a phone's back gesture, counts as a close, and `onClose` runs.
- While `holdOpen` is up, Escape, a click on the backdrop and the dialog's `cancel` event close nothing, the close controls are `aria-disabled` so they read as unavailable, and a close the platform forces anyway opens the dialog again at once, with no callback. `closeModal` still closes it. Hold a modal only while something the user asked for in it runs, such as a sign-out, and lift the hold when that settles.
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

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { attemptFocus, focusFirstDescendant } from '$lib/utils/aria/focus';
  import { concatClass } from '$lib/utils/components';
  import { DELAY } from '$lib/utils/timing';
  import { isTopmostDialog, pushOpenDialog, removeOpenDialog } from './openDialogs';
  import type { ModalContainerProps } from './ModalContainer.type';

  let {
    title,
    autofocusId = undefined,
    closeOnBackdropClick = true,
    holdOpen = false,
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

  $effect(() => {
    const dialog = modalContainer;
    return () => removeOpenDialog(dialog);
  });

  /**
   * Close the modal on the Escape key through `handleClose`, so `onClose` runs. Only the topmost open modal takes the key, whatever the order the modals' listeners run in (see `openDialogs.ts`), and an Escape another modal has already taken is left alone. The key's propagation is stopped and its default action cancelled: the browser's own Escape handling runs after this listener, and would otherwise send `cancel` to whichever dialog is topmost once this one has closed.
   * @param e - The keyboard event.
   */
  function handleEscape(e: KeyboardEvent) {
    if (e.defaultPrevented || !isTopmostDialog(modalContainer)) return;
    if (isOpen && !holdOpen && e.key == 'Escape') {
      handleClose();
      e.stopPropagation();
      e.preventDefault();
    }
  }

  /** Close the modal on a close the user asks for, unless it is held open. */
  function handleUserClose() {
    if (!holdOpen) handleClose();
  }

  /**
   * Refuse the close the platform asks for while the modal is held open.
   * @param e - The dialog's `cancel` event.
   */
  function handleCancel(e: Event) {
    if (holdOpen) e.preventDefault();
  }

  function handleClose(noCallbacks?: boolean) {
    modalContainer?.close();
    removeOpenDialog(modalContainer);
    inTransition = true;
    isOpen = false;
    if (!noCallbacks) onClose?.();
  }

  function handleNativeClose() {
    // A `close` queued by an earlier close can arrive after the dialog was opened again.
    if (!isOpen || modalContainer?.open) return;
    // A platform may close a dialog whose `cancel` was prevented, as Chromium does on repeated Escapes.
    if (holdOpen && modalContainer) {
      modalContainer.showModal();
      pushOpenDialog(modalContainer);
    } else handleClose();
  }

  function handleOpen(noCallbacks?: boolean) {
    if (modalContainer) {
      modalContainer.showModal();
      pushOpenDialog(modalContainer);
    }
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

<!-- bind: keep — modalContainer is $state(undefined) single ref; read in event handlers -->
<dialog
  bind:this={modalContainer}
  ontransitionend={handleTransitionEnd}
  oncancel={handleCancel}
  onclose={handleNativeClose}
  class:hidden={!isOpen && !inTransition}
  aria-modal="true"
  aria-label={title}
  {...concatClass(restProps, 'modal backdrop:bg-neutral backdrop:opacity-60')}>
  {@render children?.()}
  {#if closeOnBackdropClick}
    <div class="modal-backdrop">
      <button onclick={handleUserClose} tabindex="-1" aria-disabled={holdOpen ? 'true' : undefined}
        >{t('common.closeDialog')}</button>
    </div>
  {/if}
</dialog>
