<!--
@component Ask a signed-in user whose account has no password to choose one: why, the address of the account, the password form, a button for saving the password and another for logging out. Saving stores the password and reruns the page's loads, so the next gate or the page the user asked for replaces this view. A failed save is reported and the form stays, with what was typed.

The view cannot be put aside: it offers no way to continue without a password, and only a rerun load that reads a stored password removes it. Logging out is always available and asks nothing.

### Dynamic component

Accesses `ContestantContext`. The address is read from the context's `user`; when the user has no address, the label and the address are left out together.

### Properties

None.

### Accessibility

- The title is the page's first-level heading and can take focus, so the layout can move focus to it when this view replaces another.
- The address is a `<dd>` under its label, so it is announced with the label. It is never hyphenated or translated, and it wraps at any character rather than overflowing.
- The main button stands outside the form and submits it, so Enter in a field does the same as a press. It is unavailable until the view's script runs, and from a press until the next view is shown.
- A failed save is announced as an alert, and focus stays on the control that had it.

### Usage

```tsx
<SetPasswordGate />
```
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { onMount, tick } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { PasswordSetter } from '$contestant/components/passwordSetter';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { getContestantContext } from '$lib/contexts/contestant/contestantContext.svelte';
  import { getUUID } from '$lib/utils/components';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // user is a reactive accessor: read via contestantCtx.user in the markup, never destructured.
  const contestantCtx = getContestantContext();
  const { clearEntryFlow, logout, setPassword, t } = contestantCtx;

  ////////////////////////////////////////////////////////////////////
  // Save the password or log out
  ////////////////////////////////////////////////////////////////////

  const formId = getUUID();

  let setter: PasswordSetter | undefined = $state();
  let password = $state('');
  let status = $state<'idle' | 'saving' | 'failed'>('idle');
  let loggingOut = $state(false);
  let mounted = $state(false);

  onMount(() => {
    mounted = true;
  });

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (status === 'saving') return;
    status = 'idle';
    if (!setter?.validate()) return;
    // The main button is natively disabled while the save runs, and a browser may drop the focus of a button that becomes disabled.
    const focused = document.activeElement;
    status = 'saving';
    try {
      const result = await setPassword({ password });
      if (result?.type !== 'success') throw new Error('The password was not saved.');
    } catch (error) {
      log.error('Failed to save the password', { err: error });
      status = 'failed';
      await tick();
      if (focused instanceof HTMLElement && document.activeElement === document.body) focused.focus();
      return;
    }
    clearEntryFlow();
    // Awaited so that the main button keeps its saving state until the page has its new data. Only the rerun load, reading the stored password, removes this view.
    try {
      await invalidateAll();
    } catch (error) {
      log.error('Failed to rerun the loads after the password was saved', { err: error });
    }
    status = 'idle';
  }

  async function handleLogout(): Promise<void> {
    loggingOut = true;
    try {
      await logout();
    } catch (e) {
      log.error(`Error logging out: ${(e as Error)?.message ?? '-'}`);
    } finally {
      loggingOut = false;
    }
  }
</script>

<MainContent
  title={t('contestantApp.setPassword.title')}
  data-testid="contestant-set-password-gate"
  data-set-password-state={status}>
  <p class="text-center">{t('contestantApp.setPassword.why')}</p>

  {#if contestantCtx.user?.email}
    <dl class="my-lg text-center">
      <dt class="small-label">{t('contestantApp.nothingToEdit.signedInAs')}</dt>
      <dd class="font-bold [overflow-wrap:anywhere] hyphens-none" translate="no" data-testid="set-password-email">
        {contestantCtx.user.email}
      </dd>
    </dl>
  {/if}

  <PasswordSetter
    id={formId}
    username={contestantCtx.user?.email}
    bind:password
    bind:this={setter}
    onsubmit={handleSubmit} />

  {#if status === 'failed'}
    <ErrorMessage
      inline
      role="alert"
      class="my-md"
      message={t('contestantApp.setPassword.error')}
      data-testid="set-password-error" />
  {/if}

  {#snippet primaryActions()}
    <Button
      type="submit"
      form={formId}
      variant="main"
      text={t('contestantApp.setPassword.setPassword')}
      disabled={!mounted}
      loading={status === 'saving'}
      loadingText={t('common.saving')}
      data-testid="set-password-submit" />
    <Button
      color="warning"
      text={t('common.logout')}
      loading={loggingOut}
      onclick={handleLogout}
      data-testid="set-password-logout" />
  {/snippet}
</MainContent>
