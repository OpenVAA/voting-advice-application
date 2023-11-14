<!-- TimedModal.svelte -->
<script lang="ts">
  import {_} from 'svelte-i18n';
  import {tweened} from 'svelte/motion';
  import {onMount} from 'svelte';
  export let onTimeout: () => void;
  export let timerDuration = 30; // logout timer duration in seconds
  export let timeLeftInt: number = timerDuration; // time left in seconds (int)

  let timeLeft = tweened(timerDuration, {duration: 0}); // used for progress bar animation
  let isOpen = false; // variable for the modal state

  let modalContainer: HTMLDialogElement | null = null;

  onMount(() => {
    // Stop the timer when the modal is closed with the escape key
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (isOpen && e.key == 'Escape') {
        closeModal();
      }
    });
  });

  export const openModal = () => {
    if (!isOpen) {
      modalContainer?.showModal();
      isOpen = true;
    }
  };

  export const closeModal = () => {
    if (isOpen) {
      modalContainer?.close();
      isOpen = false;
    }
  };

  // reset timer to timerDuration
  const resetTimer = () => {
    timeLeft = tweened(timerDuration, {
      duration: timerDuration * 1000
    });
    timeLeftInt = timerDuration;
    $timeLeft = 0;
  };

  // stop the timer
  const stopTimer = () => {
    timeLeft.set($timeLeft, {duration: 0});
  };

  // function for "accepting" the modal
  const onAccept = () => {
    closeModal();
    onTimeout();
    stopTimer();
  };

  // update timeLeftInt to an integer when timeLeft updates
  $: {
    if (timeLeft) {
      const t = Math.ceil($timeLeft);
      if (t < timeLeftInt) {
        timeLeftInt = t;
      }
    }
  }

  // timeout for triggering onTimeout()
  let timeout: NodeJS.Timeout | null = null;

  // trigger events if the modal is closed or opened
  $: {
    if (isOpen) {
      // one open, set timeout timer
      resetTimer();
      timeout = setTimeout(() => {
        onAccept();
      }, timerDuration * 1000);
    } else {
      // on close, reset the timer and delete/cancel timeout
      if (timeout) clearTimeout(timeout);
      timeout = null;
      stopTimer();
    }
  }
</script>

<dialog bind:this={modalContainer} class="modal">
  <div class="modal-box">
    <slot />
    <progress
      id="modal-progress"
      class="w-56 progress progress-error absolute bottom-0 left-0 right-0"
      value={$timeLeft}
      max={timerDuration} />
  </div>
</dialog>
