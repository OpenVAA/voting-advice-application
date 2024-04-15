<script lang="ts">
  import {tweened} from 'svelte/motion';
  import {onDestroy, onMount} from 'svelte';

  /** function to be triggered after time runs out */
  export let onTimeout: () => void;
  /** logout timer duration in seconds */
  export let timerDuration = 30;
  /** time left in seconds */
  export let timeLeft = Math.ceil(timerDuration);

  let progressBarTimer = tweened(timerDuration, {duration: 0}); // used for progress bar animation
  let isOpen = false; // variable for the modal state
  let modalContainer: HTMLDialogElement | null = null; // container element for the modal
  let timeout: NodeJS.Timeout | null = null; // timeout for triggering onTimeout()

  export const openModal = () => {
    if (!isOpen) {
      isOpen = true;
      modalContainer?.showModal();
      resetProgressBarTimer();
      resetTimeout();
    }
  };

  export const closeModal = () => {
    if (isOpen) {
      isOpen = false;
      modalContainer?.close();
      stopProgressBarTimer();
    }
  };

  // update progressBarTimerInt to an integer when progressBarTimer updates
  $: {
    if ($progressBarTimer) {
      const t = Math.ceil($progressBarTimer);
      if (t < timeLeft) {
        timeLeft = t;
      }
    }
  }

  // function triggered by pressing the escape button
  const handleEscape = (e: KeyboardEvent) => {
    if (isOpen && e.key == 'Escape') {
      closeModal();
    }
  };

  // add and remove event handles on mount and unmount
  onMount(() => {
    document.addEventListener('keydown', handleEscape);
  });
  onDestroy(() => {
    document.removeEventListener('keydown', handleEscape);
  });

  const resetTimeout = () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (isOpen) {
        closeModal();
        onTimeout();
        stopProgressBarTimer();
      }
    }, timerDuration * 1000);
  };

  const resetProgressBarTimer = () => {
    progressBarTimer = tweened(timerDuration, {
      duration: timerDuration * 1000
    });
    timeLeft = timerDuration;
    $progressBarTimer = 0;
  };

  const stopProgressBarTimer = () => {
    progressBarTimer.set($progressBarTimer, {duration: 0});
    if (timeout) clearTimeout(timeout);
    timeout = null;
  };
</script>

<!--
@component
TimedModal is a modal that will automatically close after a set amount of time.

### Slots

- default: The content of the modal.

### Keyboard navigation

The dialog can be closed by pressing the `Escape` key.

### Bindable functions

- `openModal`: Opens the modal
- `closeModal`: Closes the modal

### Properties

- `onTimeout` (required): A function that will be called when the modal times out.
- `timerDuration` (optional): The duration of the timer in seconds. Default is 30 seconds.
- `timeLeft` (optional): The time left in seconds. This is used to update the progress bar. Default is timerDuration.

### Usage

```tsx
<TimedModal onTimeout={() => console.log('Timed out!')}>
  <p>Example content</p>
</TimedModal>
```
-->
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<dialog
  bind:this={modalContainer}
  tabindex={isOpen ? 0 : -1}
  class="modal dark:bg-white dark:bg-opacity-10"
  aria-modal>
  {#if isOpen}
    <div class="modal-box">
      <slot />
      <progress
        id="modal-progress"
        class="w-56 progress progress-error absolute bottom-0 left-0 right-0"
        value={$progressBarTimer}
        max={timerDuration} />
    </div>
  {/if}
</dialog>
