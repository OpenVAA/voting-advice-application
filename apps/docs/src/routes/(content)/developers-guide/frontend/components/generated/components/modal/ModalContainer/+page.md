# ModalContainer

A modal dialog.

### Properties

- `title`: The title of the modal
- `autofocusId`: Optional id of the element to autofocus when the dialog has opened. Note that this must be a focusable element. By default, the first focusable descendant will be focused.
- `closeOnBackdropClick`: Whether to allow closing the modal by clicking outside of it. @default `true`
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

## Source

- Component: [apps/frontend/src/lib/components/modal/ModalContainer.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/modal/ModalContainer.svelte)
- Types: [apps/frontend/src/lib/components/modal/ModalContainer.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/modal/ModalContainer.type.ts)
