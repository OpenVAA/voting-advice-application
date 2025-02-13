<!--
@component
A modal dialog that looks like a drawer.

### Slots

- default: The content of the modal.

### Properties

- `title`: The title of the modal
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
<Drawer title="Drawer">
  <p>Drawer content</p>
</Drawer>
```
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import Button from '$lib/components/button/Button.svelte';
  import { t } from '$lib/i18n';
  import ModalContainer from '../ModalContainer.svelte';
  import type { DrawerProps } from './Drawer.type';

  type $$Props = DrawerProps;

  export let title: $$Props['title'];
  export let isOpen: $$Props['isOpen'] = false;
  export let closeModal: $$Props['closeModal'] = undefined;
  export let openModal: $$Props['openModal'] = undefined;

  onMount(() => {
    openModal?.();
  });
</script>

<ModalContainer
  closeOnBackdropClick={true}
  {...$$restProps}
  {title}
  bind:isOpen
  bind:closeModal
  bind:openModal
  on:open
  on:close>
  <div
    class="max-w-80 relative col-span-1 col-start-1 row-span-1 row-start-1 h-[calc(100vh-2rem)] rounded-t-[2rem] bg-base-100 p-24 pt-40 sm:translate-y-[1rem]"
    in:fly={{ y: '100%', duration: 200 }}
    out:fly={{ y: '100%', duration: 200 }}>
    <h2 class="mb-lg text-center">{title}</h2>
    <slot />
    <form method="dialog">
      <button class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">
        <span aria-hidden="true">✕</span>
        <span class="sr-only">{$t('common.closeDialog')}</span>
      </button>
    </form>
    <Button
      type="button"
      variant="floating-icon"
      text="close"
      icon="close"
      on:click={closeModal}
      class="!absolute bottom-0 right-0" />
  </div>
</ModalContainer>
