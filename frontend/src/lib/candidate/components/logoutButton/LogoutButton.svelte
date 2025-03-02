<!--
@component
Allows user to log out. Displays modal notification if the user hasn't filled all the data.

### Dynamic component

Accesses `CandidateContext`.

### Properties

- `logoutModalTimer`:Time in seconds that the logout modal created by the button waits before automatically logging the user out. Defaults to 30
- `stayOnPage`: boolean deciding if pressing the button takes the user to the login page or not. Defaults to true
- Any valid properties of a `<Button>` component.

### Settings

- `entities.hideIfMissingAnswers.candidate`: Affects message shown.

### Usage
```tsx
<LogoutButton />
```
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { TimedModal } from '$lib/components/modal/timed';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { logDebugError } from '$lib/utils/logger';
  import type { LogoutButtonProps } from './LogoutButton.type';

  type $$props = LogoutButtonProps;

  export let stayOnPage: $$props['stayOnPage'] = false;
  export let logoutModalTimer: $$props['logoutModalTimer'] = 30;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const {
    answersLocked,
    appSettings,
    getRoute,
    logout,
    unansweredOpinionQuestions,
    unansweredRequiredInfoQuestions,
    t
  } = getCandidateContext();

  ////////////////////////////////////////////////////////////////////
  // Handle logout and the modal
  ////////////////////////////////////////////////////////////////////

  // exports from TimedModal
  let openModal: () => void;
  let closeModal: () => void;
  let timeLeft = logoutModalTimer;

  async function triggerLogout() {
    if (
      !$answersLocked &&
      ($unansweredOpinionQuestions?.length !== 0 || $unansweredRequiredInfoQuestions?.length !== 0)
    ) {
      openModal();
    } else {
      await logout();
    }
  }

  async function handleLogout() {
    await logout().catch((e) => {
      logDebugError(`Error logging out: ${e?.message}`);
    });
    closeModal();
    if (!stayOnPage) {
      await goto($getRoute('CandAppLogin'), { invalidateAll: true });
    }
  }
</script>

<Button on:click={triggerLogout} icon="logout" text={$t('common.logout')} color="warning" {...$$restProps} />

<TimedModal
  bind:timeLeft
  bind:openModal
  bind:closeModal
  onTimeout={handleLogout}
  title={$t('candidateApp.logoutModal.title')}
  timerDuration={logoutModalTimer}>
  <!-- <div class="notification max-w-md text-center"> -->
  {#if $unansweredOpinionQuestions && $unansweredRequiredInfoQuestions?.length === 0}
    <p>
      {$t('candidateApp.logoutModal.questionsLeft', {
        opinionQuestionsLeft: $unansweredOpinionQuestions.length ?? 0
      })}
    </p>
  {:else}
    <p>
      {$t('candidateApp.logoutModal.itemsLeft', {
        infoQuestionsLeft: $unansweredRequiredInfoQuestions?.length ?? 0,
        opinionQuestionsLeft: $unansweredOpinionQuestions?.length ?? 0
      })}
    </p>
    {#if $unansweredRequiredInfoQuestions?.length !== 0 || ($appSettings.entities?.hideIfMissingAnswers?.candidate && $unansweredOpinionQuestions?.length !== 0)}
      <p>{$t('candidateApp.common.willBeHiddenIfMissing')}</p>
    {/if}
  {/if}
  <p>
    {$t('candidateApp.logoutModal.ingress', { timeLeft })}
  </p>
  <!-- </div> -->
  <div slot="actions" class="flex w-full flex-col items-center">
    <Button on:click={closeModal} text={$t('candidateApp.logoutModal.continue')} variant="main" />
    <Button
      on:click={handleLogout}
      text={$t('common.logout')}
      class="w-full hover:bg-warning hover:text-warning-content"
      color="warning" />
  </div>
</TimedModal>
