<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import TimedModal from '$lib/components/modal/TimedModal.svelte';
  import {goto} from '$app/navigation';
  import {Button} from '$lib/components/button';
  import {getContext} from 'svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import type {LogoutButtonProps} from '$lib/types/LogoutButton.type';

  type $$props = LogoutButtonProps;
  export let buttonVariant: $$props['buttonVariant'] = 'normal';
  /** Defaults to normal, button variant can be "normal" for just text, "icon" for a button with an icon and "main" for a filled red box */
  /*Determines whether the user is taken to the login page after logging out or stays on the current page*/
  export let stayOnPage: $$props['stayOnPage'] = false;

  /** time until automatic logout for modal */
  export let logoutModalTimer: $$props['logoutModalTimer'] = 30;
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
    if (!stayOnPage) {
      await goto($getRoute(Route.CandAppHome));
    }
  };
</script>

<!--
@component
Allows user to log out. Displays modal notification if the user
hasn't filled all the data.
- `buttonVariant`:the style variant of the button, either normal for plain text, icon for graphical icon or main for a box with text.
  Defaults to normal
-`stayOnPage`: boolean deciding if pressing the button takes the user to the login page or not. Defaults to true
-`logoutModalTimer`:Time in seconds that the logout modal created by the button waits before automatically logging the user out. Defaults to 30

### Usage
```tsx
  <LogoutButton />
```
-->

<!-- Define the button based on variant ("icon", "main" or "normal"). Cannot be done shorter because of type errors. -->
{#if buttonVariant === 'icon'}
  <Button
    on:click={triggerLogout}
    variant="icon"
    icon="logout"
    text={$t('candidateApp.navbar.logOut')}
    color="warning" />
{:else if buttonVariant === 'main'}
  <Button
    on:click={triggerLogout}
    text={$t('candidateApp.homePage.logOut')}
    color="warning"
    variant="main" />
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
