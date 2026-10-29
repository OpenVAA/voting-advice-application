<!--
@component Show a button that opens a modal describing the data the app collects.

### Dynamic component

Accesses `AppContext` for the translations. The modal shows `common.privacy.dataCollection.content` and `privacy.dataCollection.info`, which name no analytics provider.

### Properties

- Any valid properties of a `<Button>` component.

### Usage

```tsx
<DataConsentInfoButton/>
<DataConsentInfoButton class="!inline"/>
```
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { Modal } from '$lib/components/modal';
  import { getAppContext } from '$lib/contexts/app';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import type { DataConsentInfoButtonProps } from './DataConsentInfoButton.type';

  let { ...restProps }: DataConsentInfoButtonProps = $props();

  const ctx = getAppContext();
  const { t } = ctx;
  let modalRef: Modal;
</script>

<Button
  variant="icon"
  icon="info"
  iconPos="left"
  onclick={() => modalRef?.openModal()}
  text={t('privacy.dataConsentInfoButton')}
  {...restProps} />

<!-- bind: keep — modalRef is plain let Modal; single ref read in onclick -->
<Modal bind:this={modalRef} title={t('common.privacy.dataCollection.title')}>
  <p>{@html sanitizeHtml(t('common.privacy.dataCollection.content'))}</p>
  <p>{t('privacy.dataCollection.info')}</p>
  {#snippet actions()}
    <div class="mx-auto flex w-full max-w-md flex-col">
      <Button onclick={() => modalRef?.closeModal()} text={t('common.close')} variant="main" />
    </div>
  {/snippet}
</Modal>
