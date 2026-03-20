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
  import { Feedback } from '..';
  import type { SendingStatus } from '..';
  import type { FeedbackPopupProps } from './FeedbackPopup.type';

  let { ...restProps }: FeedbackPopupProps = $props();

  const CLOSE_DELAY = 1500;
  const { t } = getComponentContext();
  let closeTimeout: NodeJS.Timeout | undefined;
  onDestroy(() => { if (closeTimeout) clearTimeout(closeTimeout); });

  let canSubmit: boolean;
  let status: SendingStatus;
  let alertRef: Alert;
  let feedbackRef: { reset: () => void; submit: () => Promise<void> };

  function onSent() { closeTimeout = setTimeout(() => { alertRef?.closeAlert(); feedbackRef?.reset(); }, CLOSE_DELAY); }
  function onSubmit(): void { if (canSubmit) { feedbackRef?.submit(); return; } alertRef?.closeAlert(); }
</script>

<Alert bind:this={alertRef} title={t('privacy.title')} {...restProps}>
  <div class="justify-self-stretch">
    <h3 class="mb-lg mt-0 text-center">{t('feedback.popupTitle')}</h3>
    <Feedback onSent={onSent} bind:canSubmit bind:status bind:this={feedbackRef} showActions={false} variant="compact" class="w-full" />
  </div>
  {#snippet actions()}
    <div>
      <Button onclick={onSubmit} color={canSubmit ? 'primary' : 'warning'} variant={canSubmit ? 'main' : 'normal'}
        text={status === 'sending' ? t('feedback.sending') : status === 'sent' ? t('feedback.thanks') : canSubmit ? t('feedback.send') : t('common.close')}
        class="min-w-full sm:min-w-[12rem]" />
    </div>
  {/snippet}
</Alert>
