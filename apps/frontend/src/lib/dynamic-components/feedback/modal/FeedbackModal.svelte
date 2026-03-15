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

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Modal } from '$lib/components/modal';
  import { getComponentContext } from '$lib/contexts/component';
  import { Feedback } from '..';
  import type { FeedbackModalProps } from './FeedbackModal.type';

  type $$Props = FeedbackModalProps;

  export let title: $$Props['title'] = undefined;

  /**
   * The delay for autoclosing the modal after it's been submitted.
   */
  const CLOSE_DELAY = 1500;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Events
  ////////////////////////////////////////////////////////////////////

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

<Modal
  title={title ?? $t('feedback.title')}
  boxClass="sm:max-w-[calc(36rem_+_2_*_24px)]"
  bind:openModal
  bind:closeModal
  {...$$restProps}>
  <Feedback on:cancel={closeFeedback} on:sent={onSent} bind:reset />
</Modal>
