<!--
@component
Show a button that opens a modal describing the data the app collects.

### Dynamic component

Accesses `AppContext` to read `appSettings`.

### Properties

- Any valid properties of a `<Button>` component.

### Usage

```tsx
<DataConsentInfoButton/>
<DataConsentInfoButton class="!inline"/>
```
-->

<script lang="ts">
  import { staticSettings } from '@openvaa/app-shared';
  import { Button } from '$lib/components/button';
  import { Modal } from '$lib/components/modal';
  import { getAppContext } from '$lib/contexts/app';
  import { assertTranslationKey } from '$lib/i18n/utils';
  import { logDebugError } from '$lib/utils/logger';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import type { DataConsentInfoButtonProps } from './DataConsentInfoButton.type';

  let { ...restProps }: DataConsentInfoButtonProps = $props();

  const { appSettings, t } = getAppContext();

  const analyticsLink = staticSettings.analytics?.platform?.infoUrl
    ? `<a href="${staticSettings.analytics.platform.infoUrl}" target="_blank">${
        staticSettings.analytics.platform.name.charAt(0).toUpperCase() + staticSettings.analytics.platform.name.slice(1)
      }</a>`
    : '';

  let modalRef: Modal;
</script>

<Button
  variant="icon"
  icon="info"
  iconPos="left"
  onclick={() => modalRef?.openModal()}
  text={t('privacy.dataConsentInfoButton')}
  {...restProps} />

<Modal bind:this={modalRef} title={t('common.privacy.dataCollection.title')}>
  {#if $appSettings.analytics?.platform?.name}
    <p>{@html sanitizeHtml(t('common.privacy.dataCollection.content'))}</p>
    <p>
      {@html sanitizeHtml(
        t(assertTranslationKey(`privacy.dataCollection.platform.${$appSettings.analytics.platform.name}`), {
          analyticsLink
        })
      )}
    </p>
  {:else}
    {logDebugError('No analytics platform configured!')}
  {/if}
  {#snippet actions()}
    <div class="mx-auto flex w-full max-w-md flex-col">
      <Button onclick={() => modalRef?.closeModal()} text={t('common.close')} variant="main" />
    </div>
  {/snippet}
</Modal>
