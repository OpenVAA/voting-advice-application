<!--
@component
Allows user to log out. Displays modal notification if the user hasn't filled all the data.

### Dynamic component

Accesses `CandidateContext`.

### Properties

- `logoutModalTimer`: The duration in seconds a logout modal will wait before automatically logging the user out. Default: `30`
- `stayOnPage`: Whether pressing the button takes the user to the login page or not. Default: `false`
- Any valid properties of a `Button` component

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

  let { stayOnPage = false, logoutModalTimer = 30, ...restProps }: LogoutButtonProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Phase 61-03 follow-up: read reactive context getters via candCtx.X so
  // updates after data load propagate (the same destructure-snapshot bug class
  // that 61-03 fixed for candidate-questions).
  const candCtx = getCandidateContext();
  const { appSettings, getRoute, logout, t } = candCtx;

  ////////////////////////////////////////////////////////////////////
  // Handle logout and the modal
  ////////////////////////////////////////////////////////////////////

  // reference to TimedModal
  let timedModalRef: TimedModal;
  let timeLeft = logoutModalTimer;

  async function triggerLogout() {
    if (!candCtx.answersLocked && (candCtx.unansweredOpinionQuestions?.length !== 0 || candCtx.unansweredRequiredInfoQuestions?.length !== 0)) {
      timedModalRef?.openModal();
    } else {
      await logout();
    }
  }

  async function handleLogout() {
    await logout().catch((e) => {
      logDebugError(`Error logging out: ${e?.message}`);
    });
    timedModalRef?.closeModal();
    if (!stayOnPage) {
      await goto($getRoute('CandAppLogin'), { invalidateAll: true });
    }
  }
</script>

<Button onclick={triggerLogout} icon="logout" text={t('common.logout')} color="warning" {...restProps} />

<TimedModal
  bind:this={timedModalRef}
  bind:timeLeft
  onTimeout={handleLogout}
  title={t('candidateApp.logoutModal.title')}
  timerDuration={logoutModalTimer}>
  <!-- <div class="notification max-w-md text-center"> -->
  {#if candCtx.unansweredOpinionQuestions && candCtx.unansweredRequiredInfoQuestions?.length === 0}
    <p>
      {t('candidateApp.logoutModal.questionsLeft', {
        opinionQuestionsLeft: candCtx.unansweredOpinionQuestions.length ?? 0
      })}
    </p>
  {:else}
    <p>
      {t('candidateApp.logoutModal.itemsLeft', {
        infoQuestionsLeft: candCtx.unansweredRequiredInfoQuestions?.length ?? 0,
        opinionQuestionsLeft: candCtx.unansweredOpinionQuestions?.length ?? 0
      })}
    </p>
    {#if candCtx.unansweredRequiredInfoQuestions?.length !== 0 || ($appSettings.entities?.hideIfMissingAnswers?.candidate && candCtx.unansweredOpinionQuestions?.length !== 0)}
      <p>{t('candidateApp.common.willBeHiddenIfMissing')}</p>
    {/if}
  {/if}
  <p>
    {t('candidateApp.logoutModal.ingress', { timeLeft })}
  </p>
  <!-- </div> -->
  {#snippet actions()}
    <div class="flex w-full flex-col items-center">
      <Button
        onclick={() => timedModalRef?.closeModal()}
        text={t('candidateApp.logoutModal.continue')}
        variant="main" />
      <Button
        onclick={handleLogout}
        text={t('common.logout')}
        class="hover:bg-warning hover:text-warning-content w-full"
        color="warning" />
    </div>
  {/snippet}
</TimedModal>
