<script lang="ts">
  import {_} from 'svelte-i18n';
  import {candidateAppRoute} from '$candidate/placeholder.json';
  import TimedModal from '$lib/components/modal/TimedModal.svelte';
  import {goto} from '$app/navigation';
  import {authContext} from '$lib/utils/authenticationStore';
  import {Button} from '$lib/components/button';

  const logoutModalTimer = 30; // time until automatic logout for modal
  // exports from TimedModal
  let openModal: () => void;
  let closeModal: () => void;
  let timeLeftInt = logoutModalTimer;

  // functions for logout button
  // TODO: add proper check of unfilled data
  let unfilledData = true;

  const triggerLogout = () => {
    // TODO: check if candidate has filled all the data
    if (unfilledData) {
      openModal();
    } else {
      logout();
    }
  };

  const logout = async () => {
    authContext.logOut();
    closeModal();
    await goto(candidateAppRoute);
  };
</script>

<!--
    @component
    Allows user to log out. Displays modal notification if the user
    hasn't filled all the data. This component doesn't have slots or
    properties.

    ### Usage
    ```tsx
    <LogoutButton />
    ```
-->

<Button
  on:click={triggerLogout}
  variant="icon"
  icon="logout"
  text={$_('candidateApp.navbar.logOut')}
  color="warning" />

<TimedModal
  bind:timeLeftInt
  bind:openModal
  bind:closeModal
  onTimeout={logout}
  timerDuration={logoutModalTimer}>
  <div class="notification max-w-md text-center">
    <h1>{$_('candidateApp.logoutModal.title')}</h1>
    <br />
    <p>
      {$_('candidateApp.logoutModal.body')}
    </p>
    <p>
      {$_('candidateApp.logoutModal.confirmation', {values: {timeLeft: timeLeftInt}})}
    </p>
    <br />
    <Button
      on:click={closeModal}
      text={$_('candidateApp.logoutModal.continueEnteringData')}
      variant="main" />
    <div class="h-4" />
    <Button
      on:click={logout}
      text={$_('candidateApp.navbar.logOut')}
      class="w-full hover:bg-warning hover:text-primary-content"
      color="warning" />
  </div>
</TimedModal>
