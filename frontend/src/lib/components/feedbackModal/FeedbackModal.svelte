<script lang="ts">
  import {onDestroy} from 'svelte';
  import {sendFeedback} from '$lib/api/feedback';
  import {t} from '$lib/i18n';
  import {logDebugError} from '$lib/utils/logger';
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
   * The maximum rating for the feedback form with the minimum being 1.
   */
  const MAX_RATING = 5;

  let rating: number | undefined;
  let description: string;
  let sending = false;
  let closeTimeout: NodeJS.Timeout | undefined;

  onDestroy(() => {
    if (closeTimeout) clearTimeout(closeTimeout);
  });

  // Exports from Modal
  let openModal: () => void;
  let closeModal: () => void;

  /**
   * Submit the feedback or close the modal if it's already been submitted.
   */
  async function submit() {
    if (sending) closeAndReset();
    sending = true;
    sendFeedback(rating, description).then((res) => {
      if (!res?.ok) logDebugError('Feedback sending failed', res);
    });
    closeTimeout = setTimeout(closeAndReset, CLOSE_DELAY);
  }

  /**
   * Close the modal and reset the form so that if the user opens it again, they can fill new feedback.
   */
  function closeAndReset() {
    rating = undefined;
    description = '';
    sending = false;
    closeModal();
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
          disabled={sending}
          checked
          class="rating-hidden" />
        {#each Array.from({length: MAX_RATING}, (_, i) => i + 1) as value}
          <input
            on:click={() => (rating = value)}
            aria-label={$t('feedback.ratingValueLabel', {rating: value, ratingMax: MAX_RATING})}
            {value}
            type="radio"
            name="rating"
            disabled={sending}
            class="mask mask-star-2 bg-primary" />
        {/each}
      </div>
    </fieldset>
    <textarea
      bind:value={description}
      disabled={sending}
      aria-label={$t('feedback.descriptionLabel')}
      class="textarea textarea-bordered min-h-[6rem] w-full"
      placeholder={$t('feedback.descriptionPlaceholder')}></textarea>
    {#if $settings.admin.email}
      <p class="text-center">
        {$t('feedback.emailIntro')}
        <a href="mailto:{$settings.admin.email}">{$settings.admin.email}</a>.
      </p>
    {/if}
  </div>

  <div class="flex w-full flex-col items-center" slot="actions">
    <Button
      on:click={submit}
      disabled={!rating && !description}
      variant="main"
      text={sending ? $t('feedback.sendButtonThanks') : $t('feedback.sendButton')} />
    <Button on:click={closeModal} disabled={sending} color="warning" text={$t('common.cancel')} />
  </div>
</Modal>
