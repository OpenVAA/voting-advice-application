<script lang="ts">
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { TimedModal } from '$lib/components/modal/timed';
  import { t } from '$lib/i18n';
  import { logout as logoutRequest } from '$lib/legacy-api/candidate';
  import { settings } from '$lib/legacy-stores';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import type { CandidateContext } from '$lib/utils/legacy-candidateContext';
  import type { LogoutButtonProps } from './LogoutButton.type';

  type $$props = LogoutButtonProps;

  export let stayOnPage: $$props['stayOnPage'] = false;
  export let logoutModalTimer: $$props['logoutModalTimer'] = 30;

  // exports from TimedModal
  let openModal: () => void;
  let closeModal: () => void;
  let timeLeft = logoutModalTimer;

  const { answersLocked, unansweredOpinionQuestions, unansweredRequiredInfoQuestions } =
    getContext<CandidateContext>('candidate');

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

  async function logout() {
    await logoutRequest();
    closeModal();
    if (!stayOnPage) {
      await goto($getRoute(ROUTE.CandAppLogin), { invalidateAll: true });
    }
  }
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

<Button on:click={triggerLogout} icon="logout" text={$t('common.logout')} color="warning" {...$$restProps} />

<TimedModal
  bind:timeLeft
  bind:openModal
  bind:closeModal
  on:timeout={logout}
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
    {#if $unansweredRequiredInfoQuestions?.length !== 0 || ($settings.entities?.hideIfMissingAnswers?.candidate && $unansweredOpinionQuestions?.length !== 0)}
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
      on:click={logout}
      text={$t('common.logout')}
      class="w-full hover:bg-warning hover:text-warning-content"
      color="warning" />
  </div>
</TimedModal>
