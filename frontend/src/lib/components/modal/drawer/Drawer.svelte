<!--
@component
A modal dialog that looks like a drawer.

### Slots

- default: The content of the modal.

### Properties

- `title`: The title of the modal
- `isOpen`: A bindable property which is `true` when the drawer is open
- `showFloatingCloseButton`: Whether to show the floating close button. @default true
- Any valid properties of a `<ModalContainer>` component.

### Callbacks

- `onClose`: Callback for when the modal closes. Note that the modal may still be transitioning to `hidden`.
- `onOpen`: Callback for when the modal opens. Note that the modal may still be transitioning from `hidden`.

### Bindable functions

- `openModal`: Opens the modal
- `closeModal`: Closes the modal

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
  import { Button } from '$lib/components/button';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import { DELAY } from '$lib/utils/timing';
  import { ModalContainer } from '..';
  import type { DrawerProps } from './Drawer.type';

  type $$Props = DrawerProps;

  export let title: $$Props['title'];
  export let isOpen: $$Props['isOpen'] = false;
  export let showFloatingCloseButton: $$Props['showFloatingCloseButton'] = true;
  export let closeModal: $$Props['closeModal'] = undefined;
  export let openModal: $$Props['openModal'] = undefined;

  const { t } = getComponentContext();

  onMount(() => {
    openModal?.();
  });
</script>

<ModalContainer
  {title}
  closeOnBackdropClick
  {...concatClass($$restProps, 'modal-bottom justify-items-center')}
  bind:isOpen
  bind:closeModal
  bind:openModal>
  <div
    class="relative col-span-1 col-start-1 row-span-1 row-start-1 grid h-[calc(100dvh-3rem)] w-full max-w-xl place-items-stretch
      rounded-t-lg bg-base-100"
    transition:fly={{ y: '100%', duration: DELAY.xs }}>
    <!-- Enable scrolling for the actual content but keep the close buttons fixed and add bottom padding if floating button is shown so that content behind it can be seen -->
    <div class="overflow-y-auto" class:pb-[4rem]={showFloatingCloseButton}>
      <slot />
    </div>

    {#if !showFloatingCloseButton}
      <form method="dialog">
        <button class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">
          <span aria-hidden="true">✕</span>
          <span class="sr-only">{$t('common.closeDialog')}</span>
        </button>
      </form>
    {:else}
      <Button
        type="button"
        variant="floating-icon"
        text="close"
        icon="close"
        on:click={closeModal}
        class="!absolute bottom-0 right-0 z-10" />
    {/if}
  </div>
</ModalContainer>
