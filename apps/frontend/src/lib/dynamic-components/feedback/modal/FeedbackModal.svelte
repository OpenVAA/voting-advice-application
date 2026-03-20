<svelte:options runes />

<!--
@component
Show a modal dialog for sending feedback.

### Properties

- `title`: Optional title for the modal. Defaults to `{t('feedback.title')}`
- Any valid properties of a `<Modal>` component.

### Usage

```tsx
<script lang="ts">
  let openFeedback: () => void;
</script>
<FeedbackModal bind:openFeedback>
<Button onclick={openFeedback} text="Open feedback"/>
```
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Modal } from '$lib/components/modal';
  import { getComponentContext } from '$lib/contexts/component';
  import { Feedback } from '..';
  import type { FeedbackModalProps } from './FeedbackModal.type';

  let { title, ...restProps }: FeedbackModalProps = $props();

  const CLOSE_DELAY = 1500;
  const { t } = getComponentContext();
  let closeTimeout: NodeJS.Timeout | undefined;
  onDestroy(() => { if (closeTimeout) clearTimeout(closeTimeout); });

  let feedbackRef: { reset: () => void };
  let modalRef: Modal;

  export function closeFeedback() { modalRef?.closeModal(); }
  export function openFeedback() { modalRef?.openModal(); }

  function onSent() { closeTimeout = setTimeout(() => { closeFeedback(); feedbackRef?.reset(); }, CLOSE_DELAY); }
</script>

<Modal title={title ?? t('feedback.title')} boxClass="sm:max-w-[calc(36rem_+_2_*_24px)]" bind:this={modalRef} {...restProps}>
  <Feedback onCancel={closeFeedback} onSent={onSent} bind:this={feedbackRef} />
</Modal>
