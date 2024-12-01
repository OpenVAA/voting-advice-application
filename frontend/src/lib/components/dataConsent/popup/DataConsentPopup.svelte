<script lang="ts">
  import { Alert } from '$lib/components/alert';
  import { t } from '$lib/i18n';
  import { userPreferences } from '$lib/legacy-stores';
  import { DataConsent, DataConsentInfoButton } from '../';
  import type { DataConsentPopupProps } from './DataConsentPopup.type';

  /* eslint-disable @typescript-eslint/no-unused-vars */
  type $$Props = DataConsentPopupProps;

  let closeAlert: () => void;
</script>

<!--
@component
Show a popup with a data consent form, if data consent has not been given yet.

### Properties

- Any valid properties of an `<Alert>` component.

### Usage

```tsx
<DataConsentPopup/>
```
-->

{#if !$userPreferences.dataCollection?.consent || $userPreferences.dataCollection?.consent === 'indetermined'}
  <Alert bind:closeAlert title={$t('common.privacy.dataCollection.title')} icon="privacy" {...$$restProps}>
    <div class="grid grid-flow-row sm:grid-flow-col">
      <p class="my-0">
        {$t('dynamic.privacy.dataConsentIntro.popup')}
      </p>
      <DataConsentInfoButton class="!inline" />
    </div>
    <DataConsent on:change={closeAlert} description="none" slot="actions" />
  </Alert>
{/if}
