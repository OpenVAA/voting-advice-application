<!--
@component A modal dialog that asks the voter for data consent. It opens as it mounts, and the page under it is inert while it is open.

Choosing in its consent control records that choice and closes the dialog. Closing it without a choice, by Escape, its close button, a click on the backdrop or a close the platform makes, is a decline: it is recorded exactly as the decline button records it.

### Dynamic component

Accesses `AppContext` for the translations and `setDataConsent`.

### Properties

- Any valid properties of a `<Modal>` component.

### Callbacks

- `onClose`: Callback for when the dialog closes, after a decline without a choice has been recorded.

### Usage

```tsx
<DataConsentPopup/>
```
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { Modal } from '$lib/components/modal';
  import { getAppContext } from '$lib/contexts/app';
  import { DataConsent, DataConsentInfoButton } from '../';
  import type { DataConsentPopupProps } from './DataConsentPopup.type';

  let { onClose, ...restProps }: DataConsentPopupProps = $props();

  const { setDataConsent, t } = getAppContext();

  let modalRef: Modal;
  let chosen = false;

  onMount(() => modalRef?.openModal());

  function handleChoice(): void {
    chosen = true;
    modalRef?.closeModal();
  }

  function handleClose(): void {
    if (!chosen) setDataConsent('denied');
    onClose?.();
  }
</script>

<!-- bind: keep — modalRef is plain let Modal; single ref read in onMount and the choice handler -->
<Modal bind:this={modalRef} title={t('common.privacy.dataCollection.title')} {...restProps} onClose={handleClose}>
  <div class="gap-md grid grid-flow-row">
    <p class="my-0">{t('dynamic.privacy.dataConsentIntro.popup')}</p>
    <DataConsentInfoButton class="!inline" />
  </div>
  {#snippet actions()}
    <DataConsent onChange={handleChoice} description="none" />
  {/snippet}
</Modal>
