<!--
@component
A modal dialog.
See `<ModalContainer>` component for more information.

### Properties

- `title`: The title of the modal
- `boxClass`: Optional classes to add to the dialog box itself. Note that the basic `class` property is applied to the `<dialog>` element, which is rarely needed.
- Any valid properties of a `<ModalContainer>` component.

### Snippet Props

- `actions`: The action buttons to display.
- `children`: The content of the modal.

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
  let modalRef: Modal;
  let answer = $state('?');

  function setAnswer(a: string) {
    if (answer == '?') answer = a;
  }
</script>

<Button onclick={() => modalRef?.openModal()}>Open modal</Button>

<h2>Answer: {answer}</h2>

<Modal
  bind:this={modalRef}
  title="What's your answer?"
  onOpen={() => answer = '?'}
  onClose={() => setAnswer('No')}>
  <p>Click below or hit ESC to exit.</p>
  {#snippet actions()}
    <div class="flex flex-col w-full max-w-md mx-auto">
      <Button onclick={() => {setAnswer('Yes'); modalRef?.closeModal();}} text="Yes" variant="main"/>
      <Button onclick={() => modalRef?.closeModal()} text="No"/>
    </div>
  {/snippet}
</Modal>
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import ModalContainer from './ModalContainer.svelte';
  import type { ModalProps } from './Modal.type';

  let { title, boxClass = '', isOpen = $bindable(false), actions, children, ...restProps }: ModalProps = $props();

  let containerRef: ModalContainer | undefined = $state(undefined);

  /** Bind to open the modal dialog */
  export function openModal(noCallbacks?: boolean) {
    containerRef?.openModal(noCallbacks);
  }

  /** Bind to close the modal dialog */
  export function closeModal(noCallbacks?: boolean) {
    containerRef?.closeModal(noCallbacks);
  }

  const { t } = getComponentContext();
</script>

<ModalContainer
  bind:this={containerRef}
  {...concatClass(restProps, 'modal-bottom sm:modal-middle')}
  {title}
  bind:isOpen>
  <div class="modal-box {boxClass ?? ''}">
    <h2 class="mb-lg text-center">{title}</h2>
    {@render children?.()}
    {#if actions}
      <div class="modal-action justify-center">
        {@render actions()}
      </div>
    {/if}
    <button class="btn btn-circle btn-ghost btn-sm absolute top-2 right-2" onclick={() => closeModal()}>
      <span aria-hidden="true">✕</span>
      <span class="sr-only">{t('common.closeDialog')}</span>
    </button>
  </div>
</ModalContainer>
