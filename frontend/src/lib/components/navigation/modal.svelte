<!-- Modal.svelte -->
<script lang="ts">
  import {_} from 'svelte-i18n';
  import {tweened} from 'svelte/motion';
  export let onClick: () => void;
  export let buttonText: string;
  export let timerDuration = 30; // logout timer duration in seconds
  export let timerInSeconds: number = timerDuration; // time left in seconds (int)

  let timeLeft = tweened(timerDuration, {duration: 0});
  let isOpen = false;

  export const toggleModal = () => {
    isOpen = !isOpen;
  };

  const resetTimer = () => {
    timeLeft = tweened(timerDuration, {
      duration: timerDuration * 1000
    });
    timerInSeconds = timerDuration;
    $timeLeft = 0;
  };

  const resetTimeout = () => {
    timeLeft.set($timeLeft, {duration: 0});
  };

  // function for "accepting" the modal
  const onAccept = () => {
    onClick();
    isOpen = false;
    resetTimeout();
  };

  // timeout for triggering onAccept()
  let timeOut: NodeJS.Timeout | null = null;

  // update timerInSeconds to an integer when timeLeft updates
  $: {
    if (timeLeft) {
      const t = Math.ceil($timeLeft);
      if (t < timerInSeconds) {
        timerInSeconds = t;
      }
    }
  }

  // trigger events if the modal is closed or opened
  $: {
    if (isOpen) {
      // one open, set timeout timer
      resetTimer();
      timeOut = setTimeout(() => {
        onAccept();
      }, timerDuration * 1000);
    } else {
      // on close, reset the timer and delete/cancel timeout
      if (timeOut) clearTimeout(timeOut);
      timeOut = null;
      resetTimeout();
    }
  }
</script>

<div class:visible={isOpen}>
  <input type="checkbox" id="modal1" checked={isOpen} class="modal-toggle" />
  <div class="modal">
    <div class="modal-box">
      <slot />
      <br />
      <button class="btn-glass btn-primary btn w-full" on:click={toggleModal}
        >{$_('candidateApp.navbar.cancel')}</button>
      <div class="h-4" />
      <button class="btn-outline btn-error btn w-full" on:click={onAccept}>{buttonText}</button>
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
