<!--
@component
A modal dialog that will automatically close after a set amount of time.

### Snippet Props

- `actions`: The action buttons to display.
- `children`: The content of the modal.

### Properties

- `title`: The title of the modal
- `timerDuration`: Logout timer duration in seconds. @default `30`
- `timeLeft`: Bind to this to get time left in seconds
- Any valid properties of a `<Modal>` component.

### Callbacks

- `onClose`: Callback for when the modal closes. Note that the modal may still be transitioning to `hidden`.
- `onOpen`: Callback for when the modal opens. Note that the modal may still be transitioning from `hidden`.
- `onTimeout`: Callback triggered right before the modal is closed due to a timeout. Note that the `onClose` callback will be triggered after this.

### Bindable functions

- `openModal`: Opens the modal
- `closeModal`: Closes the modal

### Accessibility

See the `<Modal>` component documentation for more information.

### Usage

```tsx
<script lang="ts">
  let timedModal: TimedModal;
</script>

<TimedModal
  bind:this={timedModal}
  title="Timeout modal"
  onOpen={() => console.info('Opened')}
  onClose={() => console.info('Closed')}
  onTimeout={() => console.info('Timeout!')}>
  <p>Wait for it...</p>
  {#snippet actions()}
    <Button onclick={() => timedModal.closeModal()} text="Close" variant="main"/>
  {/snippet}
</TimedModal>
```
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { tweened } from 'svelte/motion';
  import Modal from '../Modal.svelte';
  import type { TimedModalProps } from './TimedModal.type';

  const DEFAULT_DURATION = 30;

  let {
    title,
    timerDuration = DEFAULT_DURATION,
    timeLeft = $bindable(Math.ceil(timerDuration ?? DEFAULT_DURATION)),
    onClose = undefined,
    onOpen = undefined,
    onTimeout = undefined,
    actions,
    children,
    ...restProps
  }: TimedModalProps = $props();

  let modalRef: Modal | undefined = $state(undefined);
  let isOpen = $state(false);

  /** Bind to open the modal dialog */
  export function openModal(noCallbacks?: boolean) {
    modalRef?.openModal(noCallbacks);
  }

  /** Bind to close the modal dialog */
  export function closeModal(noCallbacks?: boolean) {
    modalRef?.closeModal(noCallbacks);
  }

  // Used for progress bar animation
  let progressBarTimer = tweened(timerDuration, { duration: 0 });
  // Timeout for triggering onTimeout()
  let timer: ReturnType<typeof setTimeout> | undefined;

  // Update timeLeft to an integer when progressBarTimer updates
  $effect(() => {
    const val = $progressBarTimer;
    if (val) {
      const t = Math.ceil(val);
      if (t < (timeLeft ?? 0)) timeLeft = t;
    }
  });

  // Clean up if the containing document is left
  onDestroy(() => {
    if (timer) clearTimeout(timer);
  });

  ////////////////////////////////////////////////////////////////////
  // Events
  ////////////////////////////////////////////////////////////////////

  function handleOpen() {
    startTimeout();
    onOpen?.();
  }

  function handleClose() {
    stopTimeout();
    onClose?.();
  }

  /** Start or reset the timeout and the progress bar */
  function startTimeout() {
    if (timer) clearTimeout(timer);
    progressBarTimer = tweened(timerDuration, {
      duration: (timerDuration ?? DEFAULT_DURATION) * 1000
    });
    timeLeft = timerDuration;
    $progressBarTimer = 0;
    timer = setTimeout(
      () => {
        if (isOpen) {
          onTimeout?.();
          modalRef?.closeModal();
        }
      },
      (timerDuration ?? DEFAULT_DURATION) * 1000
    );
  }

  /** Stop the timeout and the progress bar */
  function stopTimeout() {
    if (timer) clearTimeout(timer);
    timer = undefined;
    progressBarTimer.set($progressBarTimer, { duration: 0 });
  }
</script>

<Modal
  bind:this={modalRef}
  bind:isOpen
  onOpen={handleOpen}
  onClose={handleClose}
  {title}
  {actions}
  closeOnBackdropClick={false}
  {...restProps}>
  {@render children?.()}
  <progress
    id="modal-progress"
    class="progress progress-error absolute right-0 bottom-0 left-0"
    value={progressBarTimer ? $progressBarTimer : 0}
    max={timerDuration} />
</Modal>
