<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {TimedModal} from '$lib/components/modal/timed';
  import {goto} from '$app/navigation';
  import {Button} from '$lib/components/button';
  import {getContext} from 'svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import type {LogoutButtonProps} from '$lib/types/LogoutButton.type';

  type $$props = LogoutButtonProps;
  export let buttonVariant: $$props['buttonVariant'] = 'normal';
  export let stayOnPage: $$props['stayOnPage'] = false;

  /** time until automatic logout for modal */
  export let logoutModalTimer: $$props['logoutModalTimer'] = 30;
  // exports from TimedModal
  let openModal: () => void;
  let closeModal: () => void;
  let timeLeft = logoutModalTimer;

  const {
    nofUnansweredBasicInfoQuestionsStore,
    opinionQuestionsFilledStore,
    nofUnansweredOpinionQuestionsStore,
    basicInfoFilledStore,
    logOut
  } = getContext<CandidateContext>('candidate');

  let basicInfoQuestionsLeft: number | undefined;
  nofUnansweredBasicInfoQuestionsStore?.subscribe((value) => {
    basicInfoQuestionsLeft = value;
  });

  let opinionQuestionsLeft: number | undefined;
  nofUnansweredOpinionQuestionsStore?.subscribe((value) => {
    opinionQuestionsLeft = value;
  });

  const triggerLogout = () => {
    if (!$opinionQuestionsFilledStore || !$basicInfoFilledStore) {
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
  on:timeout={logout}
  title={$t('candidateApp.logoutModal.title')}
  timerDuration={logoutModalTimer}>
  <div class="notification max-w-md text-center">
    <h2>{$t('candidateApp.logoutModal.title')}</h2>
    <br />
    {#if !$basicInfoFilledStore}
      <p>
        {$t('candidateApp.logoutModal.itemsLeft', {
          basicInfoQuestionsLeft,
          opinionQuestionsLeft
        })}
      </p>
    {:else}
      <p>
        {$t('candidateApp.logoutModal.questionsLeft', {opinionQuestionsLeft})}
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
