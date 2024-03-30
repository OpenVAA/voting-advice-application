<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import TimedModal from '$lib/components/modal/TimedModal.svelte';
  import {goto} from '$app/navigation';
  import {Button} from '$lib/components/button';
  import {getContext} from 'svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';

  /** Defaults to true, so that button variant is "icon". Can be set to false if the button should be of variant "main" */
  export let variantIcon = true;

  /** time until automatic logout for modal */
  export let logoutModalTimer = 30;
  // exports from TimedModal
  let openModal: () => void;
  let closeModal: () => void;
  let timeLeft = logoutModalTimer;

  const {
    nofUnasweredBasicInfoQuestionsStore,
    opinionQuestionsFilledStore,
    nofUnansweredOpinionQuestionsStore,
    logOut
  } = getContext<CandidateContext>('candidate');

  let opinionQuestionsLeft: number | undefined;
  nofUnasweredBasicInfoQuestionsStore?.subscribe((value) => {
    opinionQuestionsLeft = value;
  });

  let opinionQuestionsFilled: boolean | undefined;
  opinionQuestionsFilledStore?.subscribe((value) => {
    opinionQuestionsFilled = value;
  });

  let basicInfoQuestionsLeft: number | undefined;
  nofUnansweredOpinionQuestionsStore?.subscribe((value) => {
    basicInfoQuestionsLeft = value;
  });

  const triggerLogout = () => {
    if (!opinionQuestionsFilled || !basicInfoQuestionsLeft) {
      openModal();
    } else {
      logout();
    }
  };

  const logout = async () => {
    await logOut();
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
When set to false, the button variant is ghost.

### Usage
```tsx
  <LogoutButton />
```
-->

<!-- Define the button based on variant ("icon" or "ghost"). Cannot be done shorter because of type errors. -->
{#if variantIcon}
  <Button
    on:click={triggerLogout}
    variant="icon"
    icon="logout"
    text={$t('candidateApp.navbar.logOut')}
    color="warning" />
{:else}
  <Button on:click={triggerLogout} text={$t('candidateApp.homePage.logOut')} color="warning" />
{/if}
<TimedModal
  bind:timeLeft
  bind:openModal
  bind:closeModal
  onTimeout={logout}
  timerDuration={logoutModalTimer}>
  <div class="notification max-w-md text-center">
    <h2>{$t('candidateApp.logoutModal.title')}</h2>
    <br />
    {#if basicInfoQuestionsLeft && basicInfoQuestionsLeft > 0}
      <p>
        {$t('candidateApp.logoutModal.body', {
          remainingInfoAmount: basicInfoQuestionsLeft,
          remainingOpinionNumber: opinionQuestionsLeft
        })}
      </p>
    {:else if opinionQuestionsLeft && opinionQuestionsLeft > 1}
      <p>
        {$t('candidateApp.logoutModal.bodyBasicInfoReady', {
          remainingOpinionNumber: opinionQuestionsLeft
        })}
      </p>
    {:else}
      <p>
        {$t('candidateApp.logoutModal.bodyBasicInfoReady1OpinionLeft')}
      </p>
    {/if}
    <p>
      {$t('candidateApp.logoutModal.confirmation', {timeLeft})}
    </p>
    <Button
      on:click={closeModal}
      text={$t('candidateApp.logoutModal.continueEnteringData')}
      variant="main"
      class="mt-40" />
    <div class="h-4" />
    <Button
      on:click={logout}
      text={$t('candidateApp.navbar.logOut')}
      class="w-full hover:bg-warning hover:text-primary-content"
      color="warning" />
  </div>
</TimedModal>
