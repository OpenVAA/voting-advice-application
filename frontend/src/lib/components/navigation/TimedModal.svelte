<script lang="ts">
  import {_} from 'svelte-i18n';
  import {tweened} from 'svelte/motion';
  import {onDestroy, onMount} from 'svelte';

  export let onTimeout: () => void; // function to be triggered after time runs out
  export let timerDuration = 30; // logout timer duration in seconds
  export let timeLeftInt: number = Math.ceil(timerDuration); // time left in seconds (int)

  let progressBarTimer = tweened(timerDuration, {duration: 0}); // used for progress bar animation
  let isOpen = false; // variable for the modal state
  let modalContainer: HTMLDialogElement | null = null; // container element for the modal
  let timeout: NodeJS.Timeout | null = null; // timeout for triggering onTimeout()

  export const openModal = () => {
    if (!isOpen) {
      modalContainer?.showModal();
      isOpen = true;
      resetProgressBarTimer();
      resetTimeout();
    }
  };
  export const closeModal = () => {
    if (isOpen) {
      modalContainer?.close();
      isOpen = false;
      stopProgressBarTimer();
    }
  };

  // update progressBarTimerInt to an integer when progressBarTimer updates
  $: {
    if ($progressBarTimer) {
      const t = Math.ceil($progressBarTimer);
      if (t < timeLeftInt) {
        timeLeftInt = t;
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
    timeLeftInt = timerDuration;
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

### Properties

- onTimeout (required): A function that will be called when the modal times out.
- timerDuration (optional): The duration of the timer in seconds. Default is 30 seconds.
- timeLeftInt (optional): The time left in seconds. This is used to update the progress bar. Default is timerDuration.

### Usage

```tsx
<TimedModal onTimeout={() => console.log('Timed out!')}>
  <p>Example content</p>
</TimedModal>
```
-->

<dialog bind:this={modalContainer} class="modal">
  <div class="modal-box">
    <slot />
    <progress
      id="modal-progress"
      class="w-56 progress progress-error absolute bottom-0 left-0 right-0"
      value={$progressBarTimer}
      max={timerDuration} />
  </div>
</dialog>
