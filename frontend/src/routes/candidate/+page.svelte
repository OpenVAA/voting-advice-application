<script lang="ts">
  import Modal from './modal.svelte';
  import {goto} from '$app/navigation';
  import {_} from 'svelte-i18n';
  import {appName, candidateAppRoute} from '$candidate/placeholder.json';

  // TODO: add proper check of unfilled data
  let unfilledData = true;
  let isOpen = false; // variable bound to Modal
  let isPopupVisible = false; // variable for popup
  const logoutModalTimer = 30; // time until automatic logout for modal
  let timerInSeconds = logoutModalTimer;

  const triggerLogout = () => {
    // TODO: check if candidate has filler all the data
    if (unfilledData) {
      isOpen = true;
    } else {
      logout();
    }
  };

  const logout = () => {
    // TODO check when login functionality is ready
    localStorage.removeItem('jwt');
    togglePopup();
    // TODO: redirect to login page
    goto(candidateAppRoute);
  };

  function togglePopup() {
    isPopupVisible = !isPopupVisible;
  }
</script>

{#if isPopupVisible}
  <div
    class="alert"
    style="position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); z-index: 9999;">
    <span>You have logged out, congrats </span>
  </div>
{/if}

<h1>Welcome to the {appName}</h1>

<button class="btn-error btn" on:click={triggerLogout}>{$_('candidateApp.navbar.logOut')}</button>

<div>
  <Modal
    bind:isOpen
    bind:timerInSeconds
    onClick={logout}
    timerDuration={logoutModalTimer}
    buttonText={$_('candidateApp.navbar.logOut')}>
    <div class="notification">
      You will be automatically logged out after {timerInSeconds} seconds.
    </div>
  </Modal>
</div>

<style>
  .notification {
    width: 20em;
    height: 10em;
    color: black;
  }
</style>
