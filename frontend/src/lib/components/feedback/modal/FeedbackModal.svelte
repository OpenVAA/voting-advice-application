<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Feedback } from '..';
  import type { FeedbackModalProps } from './FeedbackModal.type';
  import { Modal } from '$lib/components/modal';
  import { t } from '$lib/i18n';

  type $$Props = FeedbackModalProps;

  export let title: $$Props['title'] = undefined;

  /**
   * The delay for autoclosing the modal after it's been submitted.
   */
  const CLOSE_DELAY = 1500;

  let closeTimeout: NodeJS.Timeout | undefined;

  onDestroy(() => {
    if (closeTimeout) clearTimeout(closeTimeout);
  });

  // Export from Feedback
  let reset: () => void;

  // Exports from Modal
  let openModal: () => void;
  let closeModal: () => void;

  export function closeFeedback() {
    closeModal();
  }

  export function openFeedback() {
    openModal();
  }

  function onSent() {
    closeTimeout = setTimeout(() => {
      closeFeedback();
      reset();
    }, CLOSE_DELAY);
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
  <Feedback on:cancel={closeFeedback} on:sent={onSent} bind:reset />
</Modal>
