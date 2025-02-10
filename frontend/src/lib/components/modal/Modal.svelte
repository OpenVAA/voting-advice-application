<!--
@component
A modal dialog.
See [`<ModalContainer>` component](./ModalContainer.svelte) for more information.

### Slots

- `actions`: The action buttons to display.
- default: The content of the modal.

### Properties

- `title`: The title of the modal
- `boxClass`: Optional classes to add to the dialog box itself. Note that the basic `class` property is applied to the `<dialog>` element, which is rarely needed.
- Any valid properties of a `<ModalContainer>` component.

### Bindable functions

- `openModal`: Opens the modal
- `closeModal`: Closes the modal

### Events

- `open`: Fired after the modal is opened. Note that the modal may still be transitioning from `hidden`.
- `close`: Fired when the modal is closed by any means. Note that the modal may still be transitioning to `hidden`.
- Neither event has any details.

### Accessibility

See the [`<ModalContainer>` component](../ModalContainer.svelte) documentation for more information.

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

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import ModalContainer from './ModalContainer.svelte';
  import type { ModalProps } from './Modal.type';
  const { t } = getComponentContext();

  type $$Props = ModalProps;

  export let title: $$Props['title'];
  export let boxClass: $$Props['boxClass'] = '';
  export let isOpen: $$Props['isOpen'] = false;
  export let closeModal: $$Props['closeModal'] = undefined;
  export let openModal: $$Props['openModal'] = undefined;
</script>

<ModalContainer {...$$restProps} {title} bind:isOpen bind:closeModal bind:openModal on:open on:close>
  <div class="modal-box {boxClass ?? ''}">
    <h2 class="mb-lg text-center">{title}</h2>
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
</ModalContainer>
