<!-- Modal.svelte -->
<script lang="ts">
  import {_} from 'svelte-i18n';
  import {tweened} from 'svelte/motion';
  export let isOpen = true;
  export let onClick: () => void;
  export let buttonText: string;
  export let timerDuration = 30; // logout timer duration in seconds
  export let timerInSeconds: number = timerDuration;

  let timeLeft = tweened(timerDuration, {duration: 0});

  const resetTimer = () => {
    timeLeft = tweened(timerDuration, {
      duration: timerDuration * 1000
    });
    timerInSeconds = timerDuration;
    $timeLeft = 0;
  };

  const resetTimeout = () => {
    timeLeft.set(timerDuration, {duration: 0});
  };

  // function for "accepting" the modal
  const onAccept = () => {
    onClick();
    isOpen = false;
    resetTimeout();
  };

  const closeModal = () => {
    isOpen = false;
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

<div class:none={!isOpen} class:modal2={isOpen}>
  <div class="parent relative rounded-lg bg-white pb-20">
    <div class="p-20">
      <slot />
      <div class="float-left">
        <button class="btn-success btn" on:click={closeModal}
          >{$_('candidateApp.navbar.cancel')}</button>
      </div>
      <div class="float-right">
        <button class="btn-outline btn-error btn" on:click={onAccept}>{buttonText}</button>
      </div>
    </div>
    <progress
      id="modal-progress"
      class="w-56 progress progress-error absolute bottom-0 left-0 right-0"
      value={$timeLeft}
      max={timerDuration} />
  </div>
</div>

<style>
  .none {
    display: none;
  }

  .modal2 {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
    z-index: 999;
    justify-content: center;
    align-items: center;
  }
</style>
