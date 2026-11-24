<!--
@component Logs the user out, with the app's own sign-out passed in. Both apps' Log out is this button.

Before logging out it opens a modal when the app passes a `warning`, which says what is left undone, or when the page holds unsaved changes; otherwise the user is logged out at once. The Contestant App passes a warning while a counted task of the entity being edited is incomplete: the modal then says how many questions are left and lets the user go on entering data. A navigation closes the modal, so it never counts down on a page it was not opened on. While the modal is open its count is also kept in two cookies whose deadline the browser keeps, so a tab closed during the count is signed out at the browser's next request after its end; every close of the modal, and the start of a sign-out, removes them. With unsaved changes on the page the modal opens whatever is left, says they will be lost, and its count ends in a logout that discards them; Continue, its close button and Escape keep them. While the sign-out the modal's Log out or its count's end started runs, the close button and Escape do nothing, and the modal stays until the sign-out settles. A link followed while a sign-out it started runs asks nothing and waits: after a sign-out that worked the user is on the login page, and after one that failed the link is followed.

The app's `logout` navigates to its login itself, and the count's end hands it the reason `loggedOutAutomatically`. A sign-out that fails is logged and the page stays. A press while one runs does nothing.

### Dynamic component

Accesses the component context for its translations and the app context for its tracking, and nothing of the Contestant App's or the Admin App's context: the app's sign-out and what is left undone come in as props.

### Properties

- `logout`: The app's own sign-out, which navigates to the app's login after a sign-out that worked. It rejects when the sign-out failed.
- `warning`: What is left undone: the unanswered opinion and required info questions and whether the entity is hidden while opinion questions are unanswered. When it is set the modal opens before logging out.
- `logoutModalTimer`: The duration in seconds a logout modal will wait before automatically logging the user out. Default: `30`
- Any valid properties of a `Button` component

### Tracking events

- `logout_warned`: Sent when the modal is answered, with `proceeded` true when its Log out or the count's end starts the logout and false when Continue, its close button or Escape keeps the user in. A navigation that closes the modal sends nothing.

### Accessibility

With unsaved changes on the page the modal's dialog is named by the sentence saying they will be lost, while its visible title stays Log out, so a reader that speaks a dialog's name and not its description on entry says it; otherwise the dialog is named by its title. It is described by what else it says is at stake and by the sentence with its count at the count's full length, from a hidden copy that leaves out the sentence the name already says, so the description stays the same while the visible number runs. Focus goes to Continue when the modal opens.

### Usage

```tsx
<LogoutButton logout={contestantCtx.logout} warning={contestantLogoutWarning(contestantCtx)} />
<LogoutButton logout={adminCtx.logout} />
```
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { beforeNavigate, onNavigate } from '$app/navigation';
  import { clearLogoutDeadline, writeLogoutDeadline } from '$lib/auth/logoutDeadline';
  import { Button } from '$lib/components/button';
  import { TimedModal } from '$lib/components/modal/timed';
  import {
    hasActiveNavigationGuard,
    holdNavigation,
    holdNavigationWhile,
    keepGuardedEdits
  } from '$lib/components/preventNavigation/navigationGuards';
  import { getAppContext } from '$lib/contexts/app';
  import { getComponentContext } from '$lib/contexts/component';
  import { getUUID } from '$lib/utils/components';
  import type { LogoutButtonProps } from './LogoutButton.type';

  let { logout, warning, logoutModalTimer = 30, ...restProps }: LogoutButtonProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();
  const { track } = getAppContext();

  ////////////////////////////////////////////////////////////////////
  // Handle logout and the modal
  ////////////////////////////////////////////////////////////////////

  // reference to TimedModal
  let timedModalRef: TimedModal | undefined = $state();
  // `timeLeft` is bound by TimedModal (countdown ticks); seed from the prop's initial value. Reading the prop inside the initializer is intentional: we want the initial seed, not a reactive dependency.
  // svelte-ignore state_referenced_locally
  let timeLeft = $state(logoutModalTimer);
  let modalOpen = $state(false);
  // Whether a logout is running, from the press or the count's end until it settles.
  let leaving = $state(false);
  // Whether the close under way is the navigation handler's, which is no answer from the user.
  let closingForNavigation = false;

  // The header's button and a page's can be mounted together, so a fixed id would point one dialog at the other's text.
  const descriptionId = getUUID();

  /** Whether the page holds unsaved changes the open modal must speak of. Read live, so a guard that comes or goes behind the modal changes what it says. */
  const unsavedOnPage = $derived(modalOpen && hasActiveNavigationGuard());
  /** Whether the app says something is left undone, which the modal counts. */
  const countedTaskLeft = $derived(warning !== undefined);
  // The title that says data is missing is false over anything else.
  const title = $derived(countedTaskLeft && !unsavedOnPage ? t('contestantApp.logoutModal.title') : t('common.logout'));
  /** The dialog's accessible name: over unsaved changes the sentence saying they will be lost, which a dialog's description would not carry to every reader, and otherwise its title. */
  const dialogName = $derived(unsavedOnPage ? t('common.logoutUnsavedChanges') : title);

  // A navigation asked for while a sign-out runs waits for it. Each instance registers a function of its own: the framework keeps these callbacks in a set, so a function two instances shared would be removed for both when one is destroyed, such as the home's own Log out on a navigation away from the home.
  beforeNavigate((navigation) => holdNavigation(navigation));

  // Closing a modal that was never open would remove its `hidden` class for good, because the transition that puts the class back never runs. This runs before the new page is written, so the guard is not read across the route change.
  onNavigate(() => {
    if (!modalOpen) return;
    closingForNavigation = true;
    timedModalRef?.closeModal();
    closingForNavigation = false;
  });

  async function triggerLogout() {
    if (leaving) return;
    if (hasActiveNavigationGuard() || countedTaskLeft) timedModalRef?.openModal();
    else await leave();
  }

  /**
   * Log out, once however often it is asked for while it runs, logging a failure rather than leaving it unhandled.
   * @param reason - Why the session ends, for the login screen to say: the count's end gives `loggedOutAutomatically`, and a press gives none.
   */
  async function leave(reason?: 'loggedOutAutomatically') {
    if (leaving) return;
    leaving = true;
    if (modalOpen) track('logout_warned', { proceeded: true });
    clearLogoutDeadline();
    // The page's navigations are held until the sign-out settles.
    await holdNavigationWhile(() => (reason ? logout({ reason }) : logout())).catch((e) => {
      log.error(`Error logging out: ${e?.message}`);
    });
    if (modalOpen) timedModalRef?.closeModal();
    leaving = false;
  }

  // The count's end, kept where a closed tab cannot lose it.
  function handleOpen() {
    modalOpen = true;
    writeLogoutDeadline(logoutModalTimer);
  }

  // Continue, the close button and Escape all arrive here, and each is a choice to stay. The modal's Log out and the count's end close it with `leaving` up.
  function handleClose() {
    modalOpen = false;
    clearLogoutDeadline();
    if (leaving || closingForNavigation) return;
    track('logout_warned', { proceeded: false });
    keepGuardedEdits();
  }
</script>

<Button
  disabled={!timedModalRef}
  loading={leaving}
  onclick={triggerLogout}
  icon="logout"
  text={t('common.logout')}
  color="warning"
  {...restProps} />

<!-- Declared outside TimedModal, where a snippet would become one of its props. No wrapper holds the visible copy in the modal's body: the paragraphs' margins depend on their being siblings. The description leaves out the sentence on unsaved changes, which names the dialog. -->
{#snippet whatIsAtStake(inDescription: boolean)}
  {#if unsavedOnPage && !inDescription}
    <p>{t('common.logoutUnsavedChanges')}</p>
  {/if}
  {#if warning}
    {#if warning.infoQuestionsLeft === 0}
      <p>
        {t('contestantApp.logoutModal.questionsLeft', {
          opinionQuestionsLeft: warning.opinionQuestionsLeft
        })}
      </p>
    {:else}
      <p>
        {t('contestantApp.logoutModal.itemsLeft', {
          infoQuestionsLeft: warning.infoQuestionsLeft,
          opinionQuestionsLeft: warning.opinionQuestionsLeft
        })}
      </p>
      {#if warning.infoQuestionsLeft !== 0 || (warning.hiddenIfMissing && warning.opinionQuestionsLeft !== 0)}
        <p>{t('contestantApp.common.willBeHiddenIfMissing')}</p>
      {/if}
    {/if}
  {/if}
{/snippet}

<!-- bind: keep — timedModalRef is $state(); single ref read in event handlers. bind:timeLeft against TimedModal.timeLeft = $bindable(...) -->
<TimedModal
  bind:this={timedModalRef}
  bind:timeLeft
  onOpen={handleOpen}
  onClose={handleClose}
  onTimeout={() => leave('loggedOutAutomatically')}
  holdOpen={leaving}
  {title}
  timerDuration={logoutModalTimer}
  aria-label={dialogName}
  aria-describedby={descriptionId}>
  {@render whatIsAtStake(false)}
  <p>
    {t('contestantApp.logoutModal.ingress', { timeLeft })}
  </p>
  <!-- The dialog's description holds the count's full length and not the ticking number, so it stays the same while the count runs. -->
  <div id={descriptionId} hidden>
    {@render whatIsAtStake(true)}
    <p>{t('contestantApp.logoutModal.ingress', { timeLeft: logoutModalTimer })}</p>
  </div>
  {#snippet actions()}
    <div class="flex w-full flex-col items-center">
      <Button
        onclick={() => timedModalRef?.closeModal()}
        disabled={leaving}
        text={t('contestantApp.logoutModal.continue')}
        variant="main" />
      <Button
        onclick={() => leave()}
        loading={leaving}
        text={t('common.logout')}
        class="hover:bg-warning hover:text-warning-content w-full"
        color="warning" />
    </div>
  {/snippet}
</TimedModal>
