<!--
@component
Show a form for sending feedback.

### Dynamic component

Accesses the `AppContext` and the `FeedbackWriter` api.

### Properties

- Any valid attributes of a `<form>` element.

### Bindable properties and functions

- `status`: The status of the feedback form. @default `'default'`
- `canSubmit`: Bind to this to know whether the feedback can be submitted, i.e. the user has entered something. @default `false`
- `reset()`: Reset the form so that if the user opens it again, they can fill new feedback. You should call this when closing any modal containing the feedback.
- `submit()`: Submit the feedback.

### Events

- `cancel`: Fired when the user clicks the cancel button or the submit button again after submitting or an error, indicating that the form should close.
- `error`: Fired when there is an error sending the feedback.
- `sent`: Fired when the feedback is successfully sent.

### Tracking events

- `feedback_sent`: Feedback is succesfully sent. Contains `rating` and `description` properties.
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
<Feedback bind:reset on:cancel={close} on:sent={close}/>
```
-->

<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { concatClass } from '$lib/utils/components';
  import type { FeedbackProps } from './Feedback.type';
  import { getAppContext } from '$lib/contexts/app';

  type $$Props = FeedbackProps;

  export let showActions: $$Props['showActions'] = true;
  export let status: $$Props['status'] = 'default';
  export let variant: $$Props['variant'] = 'default';
  export let canSubmit: $$Props['canSubmit'] = false;

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

  const dispatch = createEventDispatcher<{
    cancel: null;
    error: null;
    sent: null;
  }>();

  let description: string;
  let errorTimeout: NodeJS.Timeout | undefined;
  let rating: number | undefined;
  let textareaExpanded = variant === 'default';
  let zeroInput: HTMLInputElement;

  onDestroy(clearErrorTimeout);

  $: canSubmit = status !== 'sending' && (rating != null || !!description);

  /**
   * Submit the feedback or close the modal if it's already been submitted.
   */
  export async function submit() {
    if (status === 'sent' || status === 'error') dispatch('cancel');
    // Set the user preference so that we won't ask for feedback again.
    setFeedbackStatus('received');
    status = 'sending';
    sendFeedback({ rating, description }).then((res) => {
      if (!res?.ok) {
        startEvent('feedback_error', { rating, description });
        status = 'error';
        dispatch('error');
        return;
      }
      clearErrorTimeout();
      startEvent('feedback_sent', { rating, description });
      status = 'sent';
      dispatch('sent');
    });
    // Only wait for sending to succeed for `ERROR_TIMEOUT` ms
    errorTimeout = setTimeout(() => {
      if (status !== 'sent') {
        status = 'error';
        dispatch('error');
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
    const subject = encodeURIComponent(`${$t('feedback.error.emailSubject')}: ${$t('dynamic.appName')}`);
    const start = `mailto:${$appSettings.admin.email}?subject=${encodeURIComponent(subject)}`;
    let end = `\n\nDate: ${new Date()}`;
    end += `\nURL: ${window?.location?.href ?? '-'}`;
    if (navigator?.userAgent) end += `\nUser Agent: ${navigator?.userAgent ?? '-'}`;
    end = encodeURIComponent(end);
    // Truncate description if the url would get too long so that we don't get an error when sending the email. See https://stackoverflow.com/questions/13317429/mailto-max-length-of-each-internet-browsers/33041454#33041454
    // We need to check the length after encoding all the parts
    let mailto = '';
    let trimmedDescription = description.replaceAll(/(\n *)+/g, '\n').substring(0, 1850);
    while (!mailto || mailto.length > 1900) {
      mailto = `${start}&body=${encodeURIComponent(trimmedDescription)}${end}`;
      // Trim the description in chunks of 10 characters. We don't want to truncate the encoded string, because it might get corrupted if trim in the middle of an encoded character
      trimmedDescription = trimmedDescription.substring(0, trimmedDescription.length - 10);
    }
    return mailto;
  }
</script>

<form {...concatClass($$restProps, 'grid justify-items-stretch gap-lg')}>
  <!-- Rating -->
  <fieldset class="flex justify-center">
    <legend class="mb-md w-full text-center" class:sr-only={variant === 'compact'}>
      {$t('feedback.rating.label')}
    </legend>
    <div class="rating">
      <input
        bind:this={zeroInput}
        on:click={() => (rating = undefined)}
        aria-label={$t('feedback.rating.valueLabel', { rating: 0, ratingMax: MAX_RATING })}
        value={0}
        type="radio"
        name="rating"
        disabled={status !== 'default'}
        checked
        class="rating-hidden" />
      {#each Array.from({ length: MAX_RATING }, (_, i) => i + 1) as value}
        <input
          on:click={() => (rating = value)}
          aria-label={$t('feedback.rating.valueLabel', { rating: value, ratingMax: MAX_RATING })}
          {value}
          type="radio"
          name="rating"
          disabled={status !== 'default'}
          class="mask mask-star-2 bg-primary" />
      {/each}
    </div>
  </fieldset>

  <!-- Description textarea -->
  <textarea
    bind:value={description}
    on:focus={() => (textareaExpanded = true)}
    disabled={status !== 'default'}
    aria-label={$t('feedback.description.label')}
    class="textarea textarea-bordered h-[1rem] w-full resize-none"
    class:resize-y={textareaExpanded}
    class:min-h-[6rem]={textareaExpanded}
    placeholder={$t('feedback.description.placeholder')}></textarea>

  <!-- Email info and error -->
  {#if status !== 'error'}
    {#if variant !== 'compact' && $appSettings.admin.email}
      <p class="text-center">
        {$t('feedback.emailIntro')}
        <a href="mailto:{$appSettings.admin.email}" target="_blank">{$appSettings.admin.email}</a>.
      </p>
    {/if}
  {:else}
    <div class="grid gap-md">
      <p class="mb-0 text-center text-warning">
        {$t('feedback.error.message')}
        {#if $appSettings.admin.email}
          {$t('feedback.error.emailIntro')}
        {/if}
      </p>
      {#if $appSettings.admin.email}
        {@const mailto = getErrorEmail()}
        <a href={mailto} target="_blank" class="justify-self-center rounded-full bg-base-300 px-lg py-md"
          >{$appSettings.admin.email}</a>
      {/if}
    </div>
  {/if}

  <!-- Actions -->
  {#if showActions}
    <div class="flex w-full flex-col items-center">
      <Button
        on:click={submit}
        disabled={!canSubmit}
        variant="main"
        text={status === 'sent'
          ? $t('feedback.thanks')
          : status === 'sending'
            ? $t('feedback.sending')
            : status === 'error'
              ? $t('common.close')
              : $t('feedback.send')} />
      <Button
        on:click={() => dispatch('cancel')}
        disabled={status !== 'default'}
        color="warning"
        text={$t('common.cancel')} />
    </div>
  {/if}
</form>
