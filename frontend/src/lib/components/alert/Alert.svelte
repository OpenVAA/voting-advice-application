<!--
@component
Show a non-model alert or dialog that appears at the bottom of the screen.

### Slots

- `actions`: The action buttons to display.
- default: The content of the alert.

### Properties

- `title`: The title of the modal 
- `icon`: The icon of the alert. @default `info`
- `autoOpen`: Whether to open the alert automatically. @default `true`
- `onClose`: The callback triggered when the alert is closed.
- Any valid properties of a `<div>` element.

### Bindable functions

- `openAlert`: Opens the alert
- `closeAlert`: Closes the alert

### Events

- `open`: Fired after the alert is opened.
- `close`: Fired when the alert is closed by any means.
- Neither event has any details.

### Usage

```tsx
<script lang="ts">
  let closeAlert: () => void;
</script>
<Alert 
  bind:closeAlert
  title="Can we help you?"
  icon="warning"
  on:close={() => console.info('Alert closed')}>
  Please tell us whether we can help you?
  <div slot="actions" class="flex flex-col w-full max-w-md mx-auto">
    <Button on:click={() => {console.info('Yes'); closeAlert();}} text="Yes" variant="main"/>
    <Button on:click={closeAlert} text="No"/>
  </div>
</Alert>
```
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { Button } from '$lib/components/button';
  import { Icon } from '$lib/components/icon';
  import { concatClass, getUUID } from '$lib/utils/components';
  import type { AlertProps } from './Alert.type';
  import { getComponentContext } from '$lib/contexts/component';

  type $$Props = AlertProps;

  export let title: $$Props['title'];
  export let icon: $$Props['icon'] = undefined;
  export let autoOpen: $$Props['autoOpen'] = true;
  export let onClose: $$Props['onClose'] = undefined;

  // Bindable
  export let isOpen: $$Props['isOpen'] = false;

  const { t } = getComponentContext();

  // For aria references
  const contentId = getUUID();

  // TODO[Svelte 5]: Refactor. NB. An onClose prop is already implemented
  const dispatchEvent = createEventDispatcher();

  ////////////////////////////////////////////////////////////////////
  // Events
  ////////////////////////////////////////////////////////////////////

  onMount(() => {
    if (autoOpen) openAlert();
  });

  export function openAlert() {
    isOpen = true;
    dispatchEvent('open');
  }

  export function closeAlert() {
    isOpen = false;
    dispatchEvent('close');
    onClose?.();
  }
</script>

<div
  role={$$slots.actions ? 'dialog' : 'alert'}
  aria-modal="false"
  aria-label={title}
  aria-describedby={contentId}
  {...concatClass(
    $$restProps,
    'alert fixed z-30 w-auto justify-items-stretch shadow-xl transition-all sm:!pr-[2rem] ' +
      (icon ? '' : 'sm:grid-cols-[minmax(auto,1fr)_auto] ') +
      'bottom-0 left-0 right-0 pb-safelgb pl-safelgl rounded-b-none ' +
      'sm:bottom-safelgb sm:left-safelgl sm:right-safelgr sm:p-lg sm:rounded-b-[var(--rounded-box,1rem)]'
  )}
  class:vaa-alert-hidden={!isOpen}>
  {#if icon}
    <Icon name={icon} class="justify-self-center" />
  {/if}
  <div id={contentId} class="w-full">
    <slot />
  </div>
  <div>
    {#if $$slots.actions}
      <slot name="actions" />
    {:else}
      <Button on:click={closeAlert} color="warning" text={$t('common.close')} class="-mt-[1rem] sm:mt-0" />
    {/if}
  </div>
  <button on:click={closeAlert} class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">
    <span aria-hidden="true">✕</span>
    <span class="sr-only">{$t('common.close')}</span>
  </button>
</div>

<style lang="postcss">
  .vaa-alert-hidden {
    @apply translate-y-[100%] opacity-0;
  }
</style>
