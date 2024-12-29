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
  import { SurveyButton } from '..';
  import type { SurveyPopupProps } from './SurveyPopup.type';
  import { getComponentContext } from '$lib/contexts/component';

  /* eslint-disable @typescript-eslint/no-unused-vars */
  type $$Props = SurveyPopupProps;

  /**
   * The delay for autoclosing the modal after it's been submitted.
   */
  const CLOSE_DELAY = 1500;

  const { t } = getComponentContext();

  let closeTimeout: NodeJS.Timeout | undefined;

  onDestroy(() => {
    if (closeTimeout) clearTimeout(closeTimeout);
  });

  let closeAlert: () => void;

  function onClick() {
    closeTimeout = setTimeout(() => {
      closeAlert();
    }, CLOSE_DELAY);
  }
</script>

<Alert bind:closeAlert title={$t('dynamic.survey.title')} {...$$restProps}>
  <div class="justify-self-stretch">
    <h3 class="mb-sm mt-0 text-center">
      {$t('dynamic.survey.popupTitle')}
    </h3>
  </div>
  <div slot="actions">
    <SurveyButton on:click={onClick} variant="main" />
    <p class="my-sm text-sm">
      {$t('dynamic.survey.popupInfo')}
    </p>
    <Button on:click={closeAlert} text={$t('common.thanksNo')} color="warning" />
  </div>
</Alert>
