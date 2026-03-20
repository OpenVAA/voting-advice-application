<svelte:options runes />

<!--
@component
Show a popup asking for user feedback.

### Properties

- Any valid properties of an `<Alert>` component.

### Usage

```tsx
<FeedbackPopup/>
```
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Alert } from '$lib/components/alert';
  import { Button } from '$lib/components/button';
  import { getComponentContext } from '$lib/contexts/component';
  import { SurveyButton } from '..';
  import type { SurveyPopupProps } from './SurveyPopup.type';

  let { ...restProps }: SurveyPopupProps = $props();

  const CLOSE_DELAY = 1500;
  const { t } = getComponentContext();
  let closeTimeout: NodeJS.Timeout | undefined;
  onDestroy(() => { if (closeTimeout) clearTimeout(closeTimeout); });

  let alertRef: Alert;

  function onClick() { closeTimeout = setTimeout(() => { alertRef?.closeAlert(); }, CLOSE_DELAY); }
</script>

<Alert bind:this={alertRef} title={t('dynamic.survey.title')} {...restProps}>
  <div class="justify-self-stretch">
    <h3 class="mb-sm mt-0 text-center">{t('dynamic.survey.popupTitle')}</h3>
  </div>
  {#snippet actions()}
    <div>
      <SurveyButton onClick={onClick} variant="main" />
      <p class="small-info my-sm">{t('dynamic.survey.popupInfo')}</p>
      <Button onclick={() => alertRef?.closeAlert()} text={t('common.thanksNo')} color="warning" />
    </div>
  {/snippet}
</Alert>
