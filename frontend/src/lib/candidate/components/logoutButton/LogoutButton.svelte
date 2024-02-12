<script lang="ts">
  import {_} from 'svelte-i18n';
  import {candidateAppRoute} from '$lib/utils/routes';
  import TimedModal from '$lib/components/modal/TimedModal.svelte';
  import {goto} from '$app/navigation';
  import {authContext} from '$lib/utils/authenticationStore';
  import {Button} from '$lib/components/button';

  /** Default variant is "icon". Can be set to false if the button should be of variant "main" */
  export let variantIcon = true;

  /** time until automatic logout for modal */
  export let logoutModalTimer = 30;
  // exports from TimedModal
  let openModal: () => void;
  let closeModal: () => void;
  let timeLeft = logoutModalTimer;

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
    await authContext.logOut();
    closeModal();
    await goto(candidateAppRoute);
  };
</script>

<!--
@component
Allows user to log out. Displays modal notification if the user
hasn't filled all the data. 

This component has optional boolean property `variantIcon`:
When set to true (default), the button variant is icon. 
When set to false, the button variant is main.

### Usage
```tsx
  <LogoutButton />
```
-->

{#if variantIcon}
  <Button
    on:click={triggerLogout}
    variant="icon"
    icon="logout"
    text={$_('candidateApp.navbar.logOut')}
    color="warning" />
{:else}
  <Button
    on:click={triggerLogout}
    variant="main"
    text={$_('candidateApp.allDataFilled.logOut')}
    color="warning" />
{/if}

<TimedModal
  bind:timeLeft
  bind:openModal
  bind:closeModal
  onTimeout={logout}
  timerDuration={logoutModalTimer}>
  <div class="notification max-w-md text-center">
    <h2>{$_('candidateApp.logoutModal.title')}</h2>
    <br />
    <p>
      {$_('candidateApp.logoutModal.body')}
    </p>
    <p>
      {$_('candidateApp.logoutModal.confirmation', {values: {timeLeft}})}
    </p>
    <Button
      on:click={closeModal}
      text={$_('candidateApp.logoutModal.continueEnteringData')}
      variant="main"
      class="mt-40" />
    <div class="h-4" />
    <Button
      on:click={logout}
      text={$_('candidateApp.navbar.logOut')}
      class="w-full hover:bg-warning hover:text-primary-content"
      color="warning" />
  </div>
</TimedModal>
