<!--
@component Ask a signed-in user whose account has no password to choose one: why, the address of the account, the password form, a button for saving the password and another for logging out. Saving stores the password and reruns the page's loads, so the next gate or the page the user asked for replaces this view. A failed save is reported and the form stays, with what was typed.

The view cannot be put aside: it offers no way to continue without a password, and only a rerun load that reads a stored password removes it. Logging out is always available and asks nothing.

Each app renders it through a wrapper of its own that reads that app's context and passes in the address, the app's `setPassword` and its sign-out. Its Log out is the shared `LogoutButton`.

### Dynamic component

Accesses the component context for its translations, and nothing of any app's context: the app's functions and the address come in as props.

### Properties

- `email`: The address of the signed-in account. When it is empty or absent, the label and the address are left out together.
- `setPassword`: The app's own store of a new password for the signed-in account.
- `logout`: The app's own sign-out, as the shared `LogoutButton` takes it. A rejection is logged and the view stays.
- `redirectTo`: Where the Log out leaves to after a sign-out that worked, for an app whose `logout` does not navigate.
- `onSaved`: Called once a password has been saved, before the page's loads are rerun.
- `testId`: The test id of the view's root.

### Accessibility

- The title is the page's first-level heading and can take focus, so the layout can move focus to it when this view replaces another.
- The address is a `<dd>` under its label, so it is announced with the label. It is never hyphenated or translated, and it wraps at any character rather than overflowing.
- The main button stands outside the form and submits it, so Enter in a field does the same as a press. It is unavailable until the view's script runs, and from a press until the next view is shown.
- A failed save is announced as an alert, and focus stays on the control that had it.

### Usage

```tsx
<SetPasswordGate
  email={ctx.user?.email}
  setPassword={setPassword}
  {logout}
  onSaved={clearEntryFlow}
  testId="contestant-set-password-gate" />
```
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { onMount, tick } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { MainContent } from '$layouts/main';
  import { AccountAddress } from '$lib/components/accountAddress';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { PasswordSetter } from '$lib/components/passwordSetter';
  import { getComponentContext } from '$lib/contexts/component';
  import { LogoutButton } from '$lib/dynamic-components/logoutButton';
  import { getUUID } from '$lib/utils/components';
  import type { SetPasswordGateProps } from './SetPasswordGate.type';

  let { email, setPassword, logout, redirectTo, onSaved, testId }: SetPasswordGateProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Save the password or log out
  ////////////////////////////////////////////////////////////////////

  const formId = getUUID();

  let setter: PasswordSetter | undefined = $state();
  let password = $state('');
  let status = $state<'idle' | 'saving' | 'failed'>('idle');
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
    onSaved?.();
    // Awaited so that the main button keeps its saving state until the page has its new data. Only the rerun load, reading the stored password, removes this view.
    try {
      await invalidateAll();
    } catch (error) {
      log.error('Failed to rerun the loads after the password was saved', { err: error });
    }
    status = 'idle';
  }
</script>

<MainContent title={t('contestantApp.setPassword.title')} data-testid={testId} data-set-password-state={status}>
  <p class="text-center">{t('contestantApp.setPassword.why')}</p>

  {#if email}
    <AccountAddress
      label={t('contestantApp.nothingToEdit.signedInAs')}
      address={email}
      data-testid="set-password-email" />
  {/if}

  <PasswordSetter id={formId} username={email} bind:password bind:this={setter} onsubmit={handleSubmit} />

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
    <LogoutButton {logout} {redirectTo} icon={undefined} data-testid="set-password-logout" />
  {/snippet}
</MainContent>
