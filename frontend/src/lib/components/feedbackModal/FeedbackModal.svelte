<script lang="ts">
  import {onDestroy} from 'svelte';
  import {sendFeedback} from '$lib/api/feedback';
  import {t} from '$lib/i18n';
  import {settings} from '$lib/utils/stores';
  import {Button} from '$lib/components/button';
  import {Modal} from '$lib/components/modal';
  import type {FeedbackModalProps} from './FeedbackModal.type';

  type $$Props = FeedbackModalProps;

  export let title: $$Props['title'] = undefined;

  /**
   * The delay for autoclosing the modal after it's been submitted.
   */
  const CLOSE_DELAY = 1500;
  /**
   * The delay for autoclosing the modal after it's been submitted.
   */
  const ERROR_TIMEOUT = 5000;
  /**
   * The maximum rating for the feedback form with the minimum being 1.
   */
  const MAX_RATING = 5;

  let status: 'default' | 'sending' | 'sent' | 'error' = 'default';
  let rating: number | undefined;
  let description: string;
  let closeTimeout: NodeJS.Timeout | undefined;
  let errorTimeout: NodeJS.Timeout | undefined;

  onDestroy(() => {
    if (closeTimeout) clearTimeout(closeTimeout);
    if (errorTimeout) clearTimeout(errorTimeout);
  });

  // Exports from Modal
  let openModal: () => void;
  let closeModal: () => void;

  /**
   * Submit the feedback or close the modal if it's already been submitted.
   */
  async function submit() {
    if (status === 'sent' || status === 'error') closeAndReset();
    status = 'sending';
    sendFeedback(rating, description).then((res) => {
      if (!res?.ok) {
        status = 'error';
        return;
      }
      status = 'sent';
      closeTimeout = setTimeout(closeAndReset, CLOSE_DELAY);
    });
    // Only wait for sending to succeed for `ERROR_TIMEOUT` ms
    errorTimeout = setTimeout(() => {
      if (status !== 'sent') status = 'error';
    }, ERROR_TIMEOUT);
  }

  /**
   * Close the modal and reset the form so that if the user opens it again, they can fill new feedback.
   */
  function closeAndReset() {
    rating = undefined;
    description = '';
    status = 'default';
    closeModal();
  }

  /**
   * Construct an email link with the subject and body of the email.
   */
  function getErrorEmail() {
    const subject = encodeURIComponent(
      `${$t('feedback.errorEmailSubject')}: ${$t('viewTexts.appTitle')}`
    );
    const start = `mailto:${$settings.admin.email}?subject=${encodeURIComponent(subject)}`;
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

  export function closeFeedback() {
    closeModal();
  }

  export function openFeedback() {
    openModal();
  }
</script>

<!--
@component
Show a modal dialog for sending feedback.


### Properties

- `title`: Optional title for the modal. Defaults to `{$t('feedback.title')}`
- Any valid properties of a `<Modal>` component.

### Usage

```tsx
<script lang="ts">
  let openFeedback: () => void;
</script>
<FeedbackModal bind:openFeedback>
<Button on:click={openFeedback} text="Open feedback"/>
```
-->

<Modal
  title={title ?? $t('feedback.title')}
  boxClass="sm:max-w-[calc(36rem_+_2_*_24px)]"
  bind:openModal
  bind:closeModal
  {...$$restProps}>
  <div class="grid justify-items-stretch gap-md">
    <fieldset class="flex justify-center">
      <legend class="mb-md w-full text-center">{$t('feedback.ratingLabel')}</legend>
      <div class="rating">
        <input
          on:click={() => (rating = undefined)}
          aria-label={$t('feedback.ratingValueLabel', {rating: 0, ratingMax: MAX_RATING})}
          value={0}
          type="radio"
          name="rating"
          disabled={status !== 'default'}
          checked
          class="rating-hidden" />
        {#each Array.from({length: MAX_RATING}, (_, i) => i + 1) as value}
          <input
            on:click={() => (rating = value)}
            aria-label={$t('feedback.ratingValueLabel', {rating: value, ratingMax: MAX_RATING})}
            {value}
            type="radio"
            name="rating"
            disabled={status !== 'default'}
            class="mask mask-star-2 bg-primary" />
        {/each}
      </div>
    </fieldset>
    <textarea
      bind:value={description}
      disabled={status !== 'default'}
      aria-label={$t('feedback.descriptionLabel')}
      class="textarea textarea-bordered min-h-[6rem] w-full"
      placeholder={$t('feedback.descriptionPlaceholder')}></textarea>
    {#if status !== 'error'}
      {#if $settings.admin.email}
        <p class="text-center">
          {$t('feedback.emailIntro')}
          <a href="mailto:{$settings.admin.email}" target="_blank">{$settings.admin.email}</a>.
        </p>
      {/if}
    {:else}
      <p class="mb-0 text-center text-warning">
        {$t('feedback.error')}
        {#if $settings.admin.email}
          {$t('feedback.errorEmailIntro')}
        {/if}
      </p>
      {#if $settings.admin.email}
        {@const mailto = getErrorEmail()}
        <a
          href={mailto}
          target="_blank"
          class="justify-self-center rounded-full bg-base-300 px-lg py-md"
          >{$settings.admin.email}</a>
      {/if}
    {/if}
  </div>

  <div class="flex w-full flex-col items-center" slot="actions">
    <Button
      on:click={submit}
      disabled={(!rating && !description) || status === 'sending'}
      variant="main"
      text={status === 'sent'
        ? $t('feedback.sendButtonThanks')
        : status === 'sending'
          ? $t('feedback.sendButtonSending')
          : status === 'error'
            ? $t('common.close')
            : $t('feedback.sendButton')} />
    <Button
      on:click={closeModal}
      disabled={status !== 'default'}
      color="warning"
      text={$t('common.cancel')} />
  </div>
</Modal>
