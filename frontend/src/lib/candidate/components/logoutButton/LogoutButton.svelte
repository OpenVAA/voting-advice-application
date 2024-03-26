<script lang="ts">
  import {get} from 'svelte/store';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {TimedModal} from '$lib/components/modal/timed';
  import {goto} from '$app/navigation';
  import {authContext} from '$lib/utils/authenticationStore';
  import {Button} from '$lib/components/button';
  import {getContext} from 'svelte';
  import type {AnswerContext} from '$lib/utils/answerStore';

  /** Defaults to true, so that button variant is "icon". Can be set to false if the button should be of variant "main" */
  export let variantIcon = true;

  /** time until automatic logout for modal */
  export let logoutModalTimer = 30;
  // exports from TimedModal
  let openModal: () => void;
  let closeModal: () => void;
  let timeLeft = logoutModalTimer;

  // functions for logout button
  const answerContext = getContext<AnswerContext | undefined>('answers');
  const answerstoreWritable = answerContext?.answers;
  $: answerStore = $answerstoreWritable;

  const questionstoreWritable = answerContext?.questions;
  $: questionStore = $questionstoreWritable;

  const user = get(authContext.user);
  $: remainingInfoAmount =
    4 -
    [
      user?.candidate?.gender,
      user?.candidate?.motherTongues?.length,
      user?.candidate?.birthday,
      user?.candidate?.manifesto
    ].filter((x) => x).length;

  let remainingOpinionNumber = 0;
  $: {
    if (answerStore && questionStore) {
      remainingOpinionNumber =
        Object.entries(questionStore).length - Object.entries(answerStore).length;
    }
  }
  $: unfilledData = remainingOpinionNumber > 0 || remainingInfoAmount > 0;

  const triggerLogout = () => {
    if (unfilledData) {
      openModal();
    } else {
      logout();
    }
  };

  const logout = async () => {
    await authContext.logOut();
    closeModal();
    await goto($getRoute(Route.CandAppHome));
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

<!-- Define the button based on variant ("icon" or "main"). Cannot be done shorter because of type errors. -->
{#if variantIcon}
  <Button
    on:click={triggerLogout}
    variant="icon"
    icon="logout"
    text={$t('candidateApp.navbar.logOut')}
    color="warning" />
{:else}
  <Button
    on:click={triggerLogout}
    variant="main"
    text={$t('candidateApp.allDataFilled.logOut')}
    color="warning" />
{/if}
<TimedModal
  bind:timeLeft
  bind:openModal
  bind:closeModal
  on:timeout={logout}
  title={$t('candidateApp.logoutModal.title')}
  timerDuration={logoutModalTimer}>
  <div class="notification max-w-md text-center">
    {#if remainingInfoAmount > 0}
      <p>
        {$t('candidateApp.logoutModal.body', {remainingInfoAmount, remainingOpinionNumber})}
      </p>
    {:else if remainingOpinionNumber > 0}
      <p>
        {$t('candidateApp.logoutModal.bodyBasicInfoReady', {remainingOpinionNumber})}
      </p>
    {/if}
    <p>
      {$t('candidateApp.logoutModal.confirmation', {timeLeft})}
    </p>
  </div>
  <div slot="actions" class="flex w-full flex-col items-center">
    <Button
      on:click={closeModal}
      text={$t('candidateApp.logoutModal.continueEnteringData')}
      variant="main" />
    <Button
      on:click={logout}
      text={$t('candidateApp.navbar.logOut')}
      class="w-full hover:bg-warning hover:text-warning-content"
      color="warning" />
  </div>
</TimedModal>
