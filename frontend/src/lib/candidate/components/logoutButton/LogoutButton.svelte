<script lang="ts">
  import { getContext } from 'svelte';
  import type { LogoutButtonProps } from './LogoutButton.type';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { TimedModal } from '$lib/components/modal/timed';
  import { t } from '$lib/i18n';
  import type { CandidateContext } from '$lib/utils/candidateStore';
  import { getRoute, Route } from '$lib/utils/navigation';

  type $$props = LogoutButtonProps;

  export let stayOnPage: $$props['stayOnPage'] = false;
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
Allows user to log out. Displays modal notification if the user hasn't filled all the data.

- `logoutModalTimer`:Time in seconds that the logout modal created by the button waits before automatically logging the user out. Defaults to 30
- `stayOnPage`: boolean deciding if pressing the button takes the user to the login page or not. Defaults to true
- Any valid properties of a `<Button>` component.

### Usage
```tsx
  <LogoutButton />
```
-->

<Button
  on:click={triggerLogout}
  icon="logout"
  text={$t('candidateApp.common.logOut')}
  color="warning"
  {...$$restProps} />

<TimedModal
  bind:timeLeft
  bind:openModal
  bind:closeModal
  on:timeout={logout}
  title={$t('candidateApp.logoutModal.title')}
  timerDuration={logoutModalTimer}>
  <!-- <div class="notification max-w-md text-center"> -->
  {#if !$basicInfoFilledStore}
    <p>
      {$t('candidateApp.logoutModal.itemsLeft', {
        basicInfoQuestionsLeft,
        opinionQuestionsLeft
      })}
    </p>
  {:else}
    <p>
      {$t('candidateApp.logoutModal.questionsLeft', { opinionQuestionsLeft })}
    </p>
  {/if}
  <p>
    {$t('candidateApp.logoutModal.confirmation', { timeLeft })}
  </p>
  <!-- </div> -->
  <div slot="actions" class="flex w-full flex-col items-center">
    <Button
      on:click={closeModal}
      text={$t('candidateApp.logoutModal.continueEnteringData')}
      variant="main" />
    <Button
      on:click={logout}
      text={$t('candidateApp.common.logOut')}
      class="w-full hover:bg-warning hover:text-warning-content"
      color="warning" />
  </div>
</TimedModal>
