<!--
@component
Show a non-model alert or dialog that appears at the bottom of the screen.

### Properties

- `title`: The title of the alert.
- `icon`: Possible icon of the alert.
- `autoOpen`: Whether to open the alert automatically. Default: `true`
- `isOpen`: Bind to this to get the alert's open state.
- `onClose`: The callback triggered when the alert is closed.
- `onOpen`: The callback triggered when the alert is opened.
- Any valid attributes of a `<dialog>` element

### Snippet Props

- `actions`: The action buttons to display.
- `children`: The content of the alert.

### Bindable functions

- `openAlert`: Opens the alert
- `closeAlert`: Closes the alert

### Usage

```tsx
<script lang="ts">
  let alertRef: Alert;
</script>
<Alert
  bind:this={alertRef}
  title="Can we help you?"
  icon="warning"
  onClose={() => console.info('Alert closed')}>
  Please tell us whether we can help you?
  {#snippet actions()}
    <div class="flex flex-col w-full max-w-md mx-auto">
      <Button onclick={() => {console.info('Yes'); alertRef.closeAlert();}} text="Yes" variant="main"/>
      <Button onclick={() => alertRef.closeAlert()} text="No"/>
    </div>
  {/snippet}
</Alert>
```
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/button';
  import { Icon } from '$lib/components/icon';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass, getUUID } from '$lib/utils/components';
  import type { AlertProps } from './Alert.type';

  let {
    title,
    icon = undefined,
    autoOpen = true,
    onClose = undefined,
    onOpen = undefined,
    isOpen = $bindable(false),
    actions,
    children,
    ...restProps
  }: AlertProps = $props();

  const { t } = getComponentContext();

  // For aria references
  const contentId = getUUID();

  ////////////////////////////////////////////////////////////////////
  // Events
  ////////////////////////////////////////////////////////////////////

  onMount(() => {
    if (autoOpen) openAlert();
  });

  export function openAlert() {
    isOpen = true;
    onOpen?.();
  }

  export function closeAlert() {
    isOpen = false;
    onClose?.();
  }
</script>

<div
  role={actions ? 'dialog' : 'alert'}
  aria-modal="false"
  aria-label={title}
  aria-describedby={contentId}
  {...concatClass(
    restProps,
    'alert fixed z-30 w-full sm:w-auto max-w-2xl justify-items-stretch shadow-xl transition-all sm:!pr-[2rem] ' +
      (icon ? '' : 'sm:grid-cols-[minmax(auto,1fr)_auto] ') +
      'bottom-0 mx-auto pb-safelgb pl-safelgl rounded-b-none ' +
      'sm:bottom-safelgb sm:left-safelgl sm:right-safelgr sm:p-lg sm:rounded-b-[var(--radius-box,1rem)]'
  )}
  class:vaa-alert-hidden={!isOpen}>
  {#if icon}
    <Icon name={icon} class="justify-self-center" />
  {/if}
  <div id={contentId} class="w-full">
    {@render children?.()}
  </div>
  <div>
    {#if actions}
      {@render actions()}
    {:else}
      <Button onclick={closeAlert} color="warning" text={t('common.close')} class="-mt-[1rem] sm:mt-0" />
    {/if}
  </div>
  <button onclick={closeAlert} class="btn btn-circle btn-ghost btn-sm absolute top-2 right-2">
    <span aria-hidden="true">✕</span>
    <span class="sr-only">{t('common.close')}</span>
  </button>
</div>

<style lang="postcss">
  @reference "../../../tailwind-theme.css";
  .vaa-alert-hidden {
    @apply translate-y-[100%] opacity-0;
  }
</style>
