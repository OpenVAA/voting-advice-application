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
  import { Button } from '$lib/components/button';
  import { Modal } from '$lib/components/modal';
  import { getAppContext } from '$lib/contexts/app';
  import { assertTranslationKey } from '$lib/i18n/utils';
  import { logDebugError } from '$lib/utils/logger';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import type { DataConsentInfoButtonProps } from './DataConsentInfoButton.type';

  /* eslint-disable @typescript-eslint/no-unused-vars */
  type $$Props = DataConsentInfoButtonProps;

  const { appSettings, t } = getAppContext();

  let closeModal: () => void;
  let openModal: () => void;
</script>

<Button
  variant="icon"
  icon="info"
  iconPos="left"
  on:click={openModal}
  text={$t('privacy.dataConsentInfoButton')}
  {...$$restProps} />

<Modal bind:closeModal bind:openModal title={$t('common.privacy.dataCollection.title')}>
  {#if $appSettings.analytics?.platform?.name}
    <p>{@html sanitizeHtml($t('common.privacy.dataCollection.content'))}</p>
    <p>
      {@html sanitizeHtml($t(assertTranslationKey(`privacy.dataContentPlatform.${$appSettings.analytics.platform.name}`)))}
    </p>
  {:else}
    {logDebugError('No analytics platform configured!')}
  {/if}
  <div slot="actions" class="mx-auto flex w-full max-w-md flex-col">
    <Button on:click={closeModal} text={$t('common.close')} variant="main" />
  </div>
</Modal>
