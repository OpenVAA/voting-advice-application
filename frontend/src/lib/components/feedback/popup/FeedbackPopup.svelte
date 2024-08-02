<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Feedback, type SendingStatus } from '..';
  import { Alert } from '$lib/components/alert';
  import { Button } from '$lib/components/button';
  import { t } from '$lib/i18n';
  import type { FeedbackPopupProps } from './FeedbackPopup.type';

  /* eslint-disable @typescript-eslint/no-unused-vars */
  type $$Props = FeedbackPopupProps;

  /**
   * The delay for autoclosing the modal after it's been submitted.
   */
  const CLOSE_DELAY = 1500;

  let closeTimeout: NodeJS.Timeout | undefined;

  onDestroy(() => {
    if (closeTimeout) clearTimeout(closeTimeout);
  });

  let canSubmit: boolean;
  let status: SendingStatus;
  let closeAlert: () => void;
  let reset: () => void;
  let submit: () => Promise<void>;

  function onSent() {
    closeTimeout = setTimeout(() => {
      closeAlert();
      reset();
    }, CLOSE_DELAY);
  }

  function onSubmit(): void {
    if (canSubmit) {
      submit();
      return;
    }
    closeAlert();
  }
</script>

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

<Alert bind:closeAlert title={$t('privacy.title')} {...$$restProps}>
  <div class="justify-self-stretch">
    <h3 class="mb-lg mt-0 text-center">
      {$t('feedback.popupTitle')}
    </h3>
    <Feedback
      on:sent={onSent}
      bind:canSubmit
      bind:reset
      bind:status
      bind:submit
      showActions={false}
      variant="compact"
      class="w-full" />
  </div>
  <div slot="actions">
    <Button
      on:click={onSubmit}
      color={canSubmit ? 'primary' : 'warning'}
      variant={canSubmit ? 'main' : 'normal'}
      text={status === 'sending'
        ? $t('feedback.sendButtonSending')
        : status === 'sent'
          ? $t('feedback.sendButtonThanks')
          : canSubmit
            ? $t('feedback.sendButton')
            : $t('common.close')}
      class="min-w-full sm:min-w-[12rem]" />
  </div>
</Alert>
