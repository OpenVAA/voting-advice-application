<svelte:options runes />

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

<script lang="ts">
  import { Alert } from '$lib/components/alert';
  import { getComponentContext } from '$lib/contexts/component';
  import { DataConsent, DataConsentInfoButton } from '../';
  import type { DataConsentPopupProps } from './DataConsentPopup.type';

  let { ...restProps }: DataConsentPopupProps = $props();

  const { t } = getComponentContext();

  let alertRef: Alert;
</script>

<Alert bind:this={alertRef} title={t('common.privacy.dataCollection.title')} icon="privacy" {...restProps}>
  <div class="gap-md grid grid-flow-row">
    <p class="my-0">{t('dynamic.privacy.dataConsentIntro.popup')}</p>
    <DataConsentInfoButton class="!inline" />
  </div>
  {#snippet actions()}
    <DataConsent onChange={() => alertRef?.closeAlert()} description="none" />
  {/snippet}
</Alert>
