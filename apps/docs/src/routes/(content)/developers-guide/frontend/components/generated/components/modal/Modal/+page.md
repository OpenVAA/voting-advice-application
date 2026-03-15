# Modal

A modal dialog.
See `<ModalContainer>` component for more information.

### Slots

- `actions`: The action buttons to display.
- default: The content of the modal.

### Properties

- `title`: The title of the modal
- `boxClass`: Optional classes to add to the dialog box itself. Note that the basic `class` property is applied to the `<dialog>` element, which is rarely needed.
- Any valid properties of a `<ModalContainer>` component.

### Callbacks

- `onClose`: Callback for when the modal closes. Note that the modal may still be transitioning to `hidden`.
- `onOpen`: Callback for when the modal opens. Note that the modal may still be transitioning from `hidden`.

### Bindable functions

- `openModal`: Opens the modal
- `closeModal`: Closes the modal

### Accessibility

See the `<ModalContainer>` component documentation for more information.

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
  onOpen={() => answer = '?'}
  onClose={() => setAnswer('No')}>
  <p>Click below or hit ESC to exit.</p>
  <div slot="actions" class="flex flex-col w-full max-w-md mx-auto">
    <Button on:click={() => {setAnswer('Yes'); closeModal();}} text="Yes" variant="main"/>
    <Button on:click={closeModal} text="No"/>
  </div>
</Modal>
```

## Source

[frontend/src/lib/components/modal/Modal.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/modal/Modal.svelte)

[frontend/src/lib/components/modal/Modal.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/modal/Modal.type.ts)
