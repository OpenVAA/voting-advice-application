<!--
@component
Show a form for sending feedback.

### Dynamic component

Accesses the `AppContext` and the `FeedbackWriter` api.

### Properties

- `showActions`: Whether to show the standard action buttons below the feedback form. Default: `true`
- `variant`: The layout variant of the feedback form. Default: `'default'`
- Any valid attributes of a `<form>` element.

### Bindable properties

- `canSubmit`: Bind to this to know whether the feedback can be submitted, i.e. the user has entered something. Default: `false`
- `status`: Bind to this to access the status of the feedback form. Default: `'default'`
- `submit`: Submit the feedback or close the modal if it's already been submitted.
- `reset`: Reset the form so that if the user opens it again, they can fill new feedback. You should call this when closing any modal containing the feedback.

### Callback Props

- `onCancel`: Called when the user clicks the cancel button or the submit button again after submitting or an error, indicating that the form should close.
- `onError`: Called when there is an error sending the feedback.
- `onSent`: Called when the feedback is successfully sent.

### Tracking events

- `feedback_sent`: Feedback is successfully sent. Contains `rating` and `description` properties.
- `feedback_error`: There was an error sending the feedback. Contains `rating` and `description` properties.

### Usage

```tsx
<script lang="ts">
  let reset: () => void;
  function close() {
    // Also hide the feedback somehow
    reset();
  }
</script>
<Feedback bind:reset onCancel={close} onSent={close}/>
```
-->

<svelte:options runes />

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import { concatClass } from '$lib/utils/components';
  import { getEmailUrl } from '$lib/utils/email';
  import type { FeedbackProps } from './Feedback.type';

  let {
    showActions = true,
    status = $bindable('default'),
    variant = 'default',
    canSubmit = $bindable(false),
    onCancel = undefined,
    onError = undefined,
    onSent = undefined,
    ...restProps
  }: FeedbackProps = $props();

  /**
   * The delay for autoclosing the modal after it's been submitted.
   */
  const ERROR_TIMEOUT = 5000;
  /**
   * The maximum rating for the feedback form with the minimum being 1.
   */
  const MAX_RATING = 5;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, sendFeedback, setFeedbackStatus, t, startEvent } = getAppContext();

  ////////////////////////////////////////////////////////////////////
  // Handle feedback submission
  ////////////////////////////////////////////////////////////////////

  let description = $state('');
  let errorTimeout: NodeJS.Timeout | undefined;
  let rating: number | undefined = $state(undefined);
  let textareaExpanded = $state(variant === 'default');
  let zeroInput: HTMLInputElement;

  onDestroy(clearErrorTimeout);

  $effect(() => {
    canSubmit = status !== 'sending' && (rating != null || !!description);
  });

  /**
   * Submit the feedback or close the modal if it's already been submitted.
   */
  export async function submit() {
    if (status === 'sent' || status === 'error') onCancel?.();
    // Set the user preference so that we won't ask for feedback again.
    setFeedbackStatus('received');
    status = 'sending';
    sendFeedback({ rating, description }).then((res) => {
      if (res?.type !== 'success') {
        startEvent('feedback_error', { rating, description });
        status = 'error';
        onError?.();
        return;
      }
      clearErrorTimeout();
      startEvent('feedback_sent', { rating, description });
      status = 'sent';
      onSent?.();
    });
    // Only wait for sending to succeed for `ERROR_TIMEOUT` ms
    errorTimeout = setTimeout(() => {
      if (status !== 'sent') {
        status = 'error';
        onError?.();
      }
    }, ERROR_TIMEOUT);
  }

  /**
   * Reset the form so that if the user opens it again, they can fill new feedback. You should call this when closing any modal containing the feedback.
   */
  export function reset() {
    rating = undefined;
    description = '';
    status = 'default';
    if (zeroInput) zeroInput.checked = true;
  }

  /**
   * Clear the error timeout.
   */
  function clearErrorTimeout() {
    if (errorTimeout) clearTimeout(errorTimeout);
  }

  /**
   * Construct an email link with the subject and body of the email.
   */
  function getErrorEmail() {
    return getEmailUrl({
      subject: `${t('feedback.error.emailSubject')}: ${t('dynamic.appName')}`,
      to: $appSettings.admin.email,
      body: description ?? ''
    });
  }
</script>

<form data-testid="feedback-form" {...concatClass(restProps, 'grid justify-items-stretch gap-lg')}>
  <!-- Rating -->
  <fieldset class="flex justify-center">
    <legend class="mb-md w-full text-center" class:sr-only={variant === 'compact'}>
      {t('feedback.rating.label')}
    </legend>
    <div class="rating">
      <input
        bind:this={zeroInput}
        onclick={() => (rating = undefined)}
        aria-label={t('feedback.rating.valueLabel', { rating: 0, ratingMax: MAX_RATING })}
        value={0}
        type="radio"
        name="rating"
        disabled={status !== 'default'}
        checked
        class="rating-hidden" />
      {#each Array.from({ length: MAX_RATING }, (_, i) => i + 1) as value}
        <input
          onclick={() => (rating = value)}
          aria-label={t('feedback.rating.valueLabel', { rating: value, ratingMax: MAX_RATING })}
          {value}
          type="radio"
          name="rating"
          disabled={status !== 'default'}
          data-testid="feedback-rating-{value}"
          class="mask mask-star-2 bg-primary" />
      {/each}
    </div>
  </fieldset>

  <!-- Description textarea -->
  <textarea
    bind:value={description}
    onfocus={() => (textareaExpanded = true)}
    disabled={status !== 'default'}
    aria-label={t('feedback.description.label')}
    data-testid="feedback-description"
    class="textarea h-[1rem] w-full resize-none"
    class:resize-y={textareaExpanded}
    class:min-h-[6rem]={textareaExpanded}
    placeholder={t('feedback.description.placeholder')}></textarea>

  <!-- Email info and error -->
  {#if status !== 'error'}
    {#if variant !== 'compact' && $appSettings.admin.email}
      {@const mailto = getErrorEmail()}
      <p class="text-center">
        {t('feedback.emailIntro')}
        <a href={mailto} target="_blank">{$appSettings.admin.email}</a>.
      </p>
    {/if}
  {:else}
    <div class="gap-md grid">
      <p class="text-warning mb-0 text-center">
        {t('feedback.error.message')}
        {#if $appSettings.admin.email}
          {t('feedback.error.emailIntro')}
        {/if}
      </p>
      {#if $appSettings.admin.email}
        {@const mailto = getErrorEmail()}
        <a href={mailto} target="_blank" class="bg-base-300 px-lg py-md justify-self-center rounded-full"
          >{$appSettings.admin.email}</a>
      {/if}
    </div>
  {/if}

  <!-- Actions -->
  {#if showActions}
    <div class="flex w-full flex-col items-center">
      <Button
        onclick={submit}
        disabled={!canSubmit}
        variant="main"
        data-testid="feedback-submit"
        text={status === 'sent'
          ? t('feedback.thanks')
          : status === 'sending'
            ? t('feedback.sending')
            : status === 'error'
              ? t('common.close')
              : t('feedback.send')} />
      <Button
        onclick={() => onCancel?.()}
        disabled={status !== 'default'}
        color="warning"
        data-testid="feedback-cancel"
        text={t('common.cancel')} />
    </div>
  {/if}
</form>
