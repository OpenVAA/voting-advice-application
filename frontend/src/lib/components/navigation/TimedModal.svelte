<!-- TimedModal.svelte -->
<script lang="ts">
  import {_} from 'svelte-i18n';
  import {tweened} from 'svelte/motion';
  export let onTimeout: () => void;
  export let timerDuration = 30; // logout timer duration in seconds
  export let timeLeftInt: number = timerDuration; // time left in seconds (int)

  let timeLeft = tweened(timerDuration, {duration: 0}); // used for progress bar animation
  let isOpen = false; // variable for the modal state

  export const openModal = () => {
    if (!isOpen) {
      isOpen = true;
    }
  };

  export const closeModal = () => {
    if (isOpen) {
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
    onTimeout();
    isOpen = false;
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

<div class:visible={isOpen}>
  <input type="checkbox" id="modal1" checked={isOpen} class="modal-toggle" />
  <div class="modal">
    <div class="modal-box">
      <slot />
      <progress
        id="modal-progress"
        class="w-56 progress progress-error absolute bottom-0 left-0 right-0"
        value={$timeLeft}
        max={timerDuration} />
    </div>
  </div>
</div>

<style>
  .visible {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(1px);
    z-index: 999;
    justify-content: center;
    align-items: center;
  }
</style>
