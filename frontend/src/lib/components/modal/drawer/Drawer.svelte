<!--
@component
A modal dialog that looks like a drawer.

### Slots

- `actions`: The action buttons to display.
- default: The content of the modal.

### Properties

- `title`: The title of the modal
- Any valid properties of a `<Modal>` component.

### Bindable functions

- `openModal`: Opens the modal
- `closeModal`: Closes the modal

### Events

- `open`: Fired after the modal is opened. Note that the modal may still be transitioning from `hidden`.
- `close`: Fired when the modal is closed by any means. Note that the modal may still be transitioning to `hidden`.
- Neither event has any details.

### Accessibility

See the [`<Modal>` component](../Modal.svelte) documentation for more information.

### Usage

```tsx
<Drawer title="Drawer">
  <p>Drawer content</p>
</Drawer>

```
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { Modal } from '..';
  import type { DrawerProps } from './Drawer.type';
  import DrawerContainer from './DrawerContainer.svelte';
  import Button from '$lib/components/button/Button.svelte';

  type $$Props = DrawerProps;

  export let title: $$Props['title'];
  export function closeModal() {
    _closeModal();
  }
  export function openModal() {
    _openModal();
  }

  let _openModal: () => void;
  let _closeModal: () => void;

  let isOpen: boolean;

  onMount(() => {
    openModal();
  });
</script>

<Modal
  bind:closeModal={_closeModal}
  bind:openModal={_openModal}
  bind:isOpen
  on:open
  on:close
  {title}
  closeOnBackdropClick={true}
  {...$$restProps}
  container={DrawerContainer}>
  <slot name="actions" slot="actions" />
  <slot />
  <Button
    type="button"
    variant="icon"
    text="close"
    class="!absolute bottom-16 right-16 rounded-full bg-base-300 p-14"
    icon="close"
    on:click={closeModal} />
</Modal>
