# ModalContainer

A modal dialog.

### Slots

- default: The modal.

### Properties

- `title`: The title of the modal
- `autofocusId`: Optional id of the element to autofocus when the dialog has opened. Note that this must be a focusable element. By default, the first focusable descendant will be focused.
- `closeOnBackdropClick`: Whether to allow closing the modal by clicking outside of it. @default `true`
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
  export let title;
  export let isOpen;
  export let closeModal;
  export let openModal;
</script>

<ModalContainer {...$$restProps} {title} bind:isOpen bind:closeModal bind:openModal>
  <div class="modal-box">
    <h2 class="mb-lg text-center">{title}</h2>
    <slot />
  </div>
</ModalContainer>
```

## Source

[frontend/src/lib/components/modal/ModalContainer.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/modal/ModalContainer.svelte)

[frontend/src/lib/components/modal/ModalContainer.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/modal/ModalContainer.type.ts)
