<!--
@component Allows user to log out. Before logging out, the button asks the tasks of the entity being edited whether anything is left that the user can do now: when the profile or the questions task is incomplete with unanswered questions to count, a modal says how many are left and lets the user go on entering data. The user is logged out at once when no entity is loaded, e.g. on a page whose URL names none, when answers are locked, when nothing is left, and when what is left is not the user's to do here or has nothing to count: a missing nomination, a task that is blocked, a profile that lacks only its name.

### Dynamic component

Accesses `ContestantContext`.

### Properties

- `logoutModalTimer`: The duration in seconds a logout modal will wait before automatically logging the user out. Default: `30`
- Any valid properties of a `Button` component

### Settings

- `entities.hideIfMissingAnswers`: Affects message shown. The key read is that of the selected entity's type.

### Usage

```tsx
<LogoutButton />
```
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { Button } from '$lib/components/button';
  import { TimedModal } from '$lib/components/modal/timed';
  import { isHiddenIfMissingAnswers } from '$lib/contestant/utils/hideIfMissingAnswers';
  import { getContestantContext } from '$lib/contexts/contestant';
  import type { LogoutButtonProps } from './LogoutButton.type';

  let { logoutModalTimer = 30, ...restProps }: LogoutButtonProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Read reactive context getters via contestantCtx.X so updates after data load propagate; destructuring one would capture the mount-time snapshot (CLAUDE.md Context Destructuring Rule).
  const contestantCtx = getContestantContext();
  const { logout, t, userData } = contestantCtx;
  // appSettings is a reactive accessor — read via contestantCtx.X, never destructure.
  const appSettings = $derived(contestantCtx.appSettings);
  /** Whether the entity being edited is hidden from voters while it has unanswered opinion questions. */
  const hiddenIfMissingAnswers = $derived(
    isHiddenIfMissingAnswers({ entityType: contestantCtx.selectedEntity?.type, appSettings })
  );

  ////////////////////////////////////////////////////////////////////
  // Handle logout and the modal
  ////////////////////////////////////////////////////////////////////

  // reference to TimedModal
  let timedModalRef: TimedModal | undefined = $state();
  // `timeLeft` is bound by TimedModal (countdown ticks); seed from the prop's initial value. Reading the prop inside the initializer is intentional: we want the initial seed, not a reactive dependency.
  // svelte-ignore state_referenced_locally
  let timeLeft = $state(logoutModalTimer);

  async function triggerLogout() {
    // Data can be missing only from an entity that is loaded: without one, the unanswered lists the modal counts hold every question. The modal's sentences count unanswered questions, so only a task that carries such a count asks.
    if (
      userData.savedEntityData &&
      !contestantCtx.answersLocked &&
      contestantCtx.tasks.some(
        (task) =>
          (task.id === 'profile' || task.id === 'questions') && task.status === 'incomplete' && (task.count ?? 0) > 0
      )
    ) {
      timedModalRef?.openModal();
    } else {
      await logout();
    }
  }

  async function handleLogout() {
    await logout().catch((e) => {
      log.error(`Error logging out: ${e?.message}`);
    });
    timedModalRef?.closeModal();
  }
</script>

<Button
  disabled={!timedModalRef}
  onclick={triggerLogout}
  icon="logout"
  text={t('common.logout')}
  color="warning"
  {...restProps} />

<!-- bind: keep — timedModalRef is $state(); single ref read in event handlers. bind:timeLeft against TimedModal.timeLeft = $bindable(...) -->
<TimedModal
  bind:this={timedModalRef}
  bind:timeLeft
  onTimeout={handleLogout}
  title={t('contestantApp.logoutModal.title')}
  timerDuration={logoutModalTimer}>
  {#if contestantCtx.unansweredOpinionQuestions && contestantCtx.unansweredRequiredInfoQuestions?.length === 0}
    <p>
      {t('contestantApp.logoutModal.questionsLeft', {
        opinionQuestionsLeft: contestantCtx.unansweredOpinionQuestions.length ?? 0
      })}
    </p>
  {:else}
    <p>
      {t('contestantApp.logoutModal.itemsLeft', {
        infoQuestionsLeft: contestantCtx.unansweredRequiredInfoQuestions?.length ?? 0,
        opinionQuestionsLeft: contestantCtx.unansweredOpinionQuestions?.length ?? 0
      })}
    </p>
    {#if contestantCtx.unansweredRequiredInfoQuestions?.length !== 0 || (hiddenIfMissingAnswers && contestantCtx.unansweredOpinionQuestions?.length !== 0)}
      <p>{t('contestantApp.common.willBeHiddenIfMissing')}</p>
    {/if}
  {/if}
  <p>
    {t('contestantApp.logoutModal.ingress', { timeLeft })}
  </p>
  {#snippet actions()}
    <div class="flex w-full flex-col items-center">
      <Button
        onclick={() => timedModalRef?.closeModal()}
        text={t('contestantApp.logoutModal.continue')}
        variant="main" />
      <Button
        onclick={handleLogout}
        text={t('common.logout')}
        class="hover:bg-warning hover:text-warning-content w-full"
        color="warning" />
    </div>
  {/snippet}
</TimedModal>
