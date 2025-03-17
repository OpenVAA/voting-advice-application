<!--
@component
A modal dialog that will automatically close after a set amount of time.

### Slots

- `actions`: The action buttons to display.
- default: The content of the modal.

### Properties

- `title`: The title of the modal
- `timerDuration`: Logout timer duration in seconds. @default `30`
- `timeLeft`: Bind to this to get time left in seconds 
- Any valid properties of a `<Modal>` component.

### Callbacks

- `onClose`: Callback for when the modal closes. Note that the modal may still be transitioning to `hidden`.
- `onOpen`: Callback for when the modal opens. Note that the modal may still be transitioning from `hidden`.
- `timeout`: Callback triggered right before the modal is closed due to a timeout. Note that the `onClose` callback will be triggered after this.

### Bindable functions

- `openModal`: Opens the modal
- `closeModal`: Closes the modal

### Accessibility

See the [`<Modal>` component](../Modal.svelte) documentation for more information.

### Usage

```tsx
<TimedModal 
  bind:closeModal
  title="Timout modal"
  onOpen={() => console.info('Opened')}
  onClose={() => console.info('Closed')}
  onTimeout={() => console.info('Timeout!')}>
  <p>Wait for it…</p>
  <Button slot="actions" on:click={closeModal} text="Close" variant="main"/>
</TimedModal>
```
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { tweened } from 'svelte/motion';
  import Modal from '../Modal.svelte';
  import type { TimedModalProps } from './TimedModal.type';

  type $$Props = TimedModalProps;
  const DEFAULT_DURATION = 30;

  export let title: $$Props['title'];
  export let timerDuration: $$Props['timerDuration'] = DEFAULT_DURATION;
  export let timeLeft: $$Props['timeLeft'] = Math.ceil(timerDuration ?? DEFAULT_DURATION);
  export let onClose: $$Props['onClose'] = undefined;
  export let onOpen: $$Props['onOpen'] = undefined;
  export let onTimeout: $$Props['onTimeout'] = undefined;

  export let closeModal: $$Props['closeModal'] = undefined;
  export let openModal: $$Props['openModal'] = undefined;

  let isOpen: boolean;

  // Used for progress bar animation
  let progressBarTimer = tweened(timerDuration, { duration: 0 });
  // Timeout for triggering onTimeout()
  let timeout: NodeJS.Timeout | undefined;

  // Update progressBarTimerInt to an integer when progressBarTimer updates
  $: if ($progressBarTimer) {
    const t = Math.ceil($progressBarTimer);
    if (t < (timeLeft ?? 0)) timeLeft = t;
  }

  // Clean up if the containing document is left
  onDestroy(() => {
    if (timeout) clearTimeout(timeout);
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
    if (timeout) clearTimeout(timeout);
    progressBarTimer = tweened(timerDuration, {
      duration: (timerDuration ?? DEFAULT_DURATION) * 1000
    });
    timeLeft = timerDuration;
    $progressBarTimer = 0;
    timeout = setTimeout(
      () => {
        if (isOpen) {
          onTimeout?.();
          closeModal?.();
        }
      },
      (timerDuration ?? DEFAULT_DURATION) * 1000
    );
  }

  /** Stop the timeout and the progress bar */
  function stopTimeout() {
    if (timeout) clearTimeout(timeout);
    timeout = undefined;
    progressBarTimer.set($progressBarTimer, { duration: 0 });
  }
</script>

<Modal
  bind:closeModal
  bind:openModal
  bind:isOpen
  onOpen={handleOpen}
  onClose={handleClose}
  {title}
  closeOnBackdropClick={false}
  {...$$restProps}>
  <slot name="actions" slot="actions" />
  <slot />
  <progress
    id="modal-progress"
    class="progress progress-error absolute bottom-0 left-0 right-0"
    value={progressBarTimer ? $progressBarTimer : 0}
    max={timerDuration} />
</Modal>
