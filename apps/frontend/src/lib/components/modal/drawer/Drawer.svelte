<!--
@component
A modal dialog that looks like a drawer.

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

See the `<ModalContainer>` component documentation for more information.

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

  let {
    title,
    isOpen = $bindable(false),
    showFloatingCloseButton = true,
    children,
    ...restProps
  }: DrawerProps = $props();

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

  onMount(() => {
    containerRef?.openModal();
  });
</script>

<ModalContainer
  bind:this={containerRef}
  {title}
  closeOnBackdropClick
  {...concatClass(restProps, 'modal-bottom justify-items-center')}
  bind:isOpen>
  <div
    class="bg-base-100 relative col-span-1 col-start-1 row-span-1 row-start-1 grid h-[calc(100dvh-3rem)] w-full max-w-xl
      place-items-stretch rounded-t-lg"
    transition:fly={{ y: '100%', duration: DELAY.xs }}>
    <!-- Enable scrolling for the actual content but keep the close buttons fixed and add bottom padding if floating button is shown so that content behind it can be seen -->
    <div class="overflow-y-auto" class:pb-[4rem]={showFloatingCloseButton}>
      {@render children?.()}
    </div>

    {#if !showFloatingCloseButton}
      <form method="dialog">
        <button class="btn btn-circle btn-ghost btn-sm absolute top-2 right-2">
          <span aria-hidden="true">✕</span>
          <span class="sr-only">{t('common.closeDialog')}</span>
        </button>
      </form>
    {:else}
      <Button
        type="button"
        variant="floating-icon"
        text="close"
        icon="close"
        onclick={() => closeModal()}
        class="!absolute right-0 bottom-0 z-10" />
    {/if}
  </div>
</ModalContainer>
