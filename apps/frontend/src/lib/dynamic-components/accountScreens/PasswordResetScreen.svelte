<!--
@component The password-reset screen both apps render: it lets a signed-in user set a new password. A mailed password-recovery link lands its user on the page of the app the link was asked for in.

- It asks for no current password. Whether it is shown at all is the page's server load's decision.
- The address of the account is shown as text and handed to the password form, where a password manager reads it beside the new password.
- The main button stands outside the form and submits it, so Enter in a field does the same as a press. It can always be pressed once the screen's script has loaded: a press with a password the form does not accept saves nothing, and the field says why.
- A saved password leaves the user signed in and leads to the app's home, with the loads rerun. A failed save is reported as an alert, and the form stays with what was typed.
- Beside the main button, the app's support link: the Contestant App's Help page, an email in any other app.

### Properties

- `appName`: The name of the app, shown above the heading.
- `email`: The address of the signed-in account.
- `setPassword`: The app's own store of a new password for the signed-in account.
- `homeHref`: The address of the app's home.
- `testId`: The test id of the screen's root.

### Usage

```tsx
<PasswordResetScreen
  appName={contestantAppName}
  email={data.email}
  {setPassword}
  homeHref={getRoute.current('ContestantAppHome')}
  testId="contestant-password-reset" />
```
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { PasswordSetter } from '$lib/components/passwordSetter';
  import { getComponentContext } from '$lib/contexts/component';
  import { ContactSupport } from '$lib/dynamic-components/contactSupport';
  import { getUUID } from '$lib/utils/components';
  import type { PasswordResetScreenProps } from './PasswordResetScreen.type';

  let { appName, email, setPassword, homeHref, testId }: PasswordResetScreenProps = $props();

  const { t } = getComponentContext();

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
    // Awaited so that the main button keeps its saving state until the next page is shown. The session is the one the password was saved on, and the loads of the page it leads to are run again over it.
    try {
      await goto(homeHref, { invalidateAll: true });
    } catch (error) {
      log.error("Failed to leave for the app's home after the password was saved", { err: error });
    }
    status = 'idle';
  }
</script>

<MainContent title={t('contestantApp.resetPassword.createNewPassword')} data-testid={testId}>
  {#snippet heading()}
    <HeadingGroup>
      <PreHeading>{appName}</PreHeading>
      <h1 tabindex="-1">{t('contestantApp.resetPassword.createNewPassword')}</h1>
    </HeadingGroup>
  {/snippet}

  {#if email}
    <dl class="my-lg text-center">
      <dt class="small-label">{t('contestantApp.nothingToEdit.signedInAs')}</dt>
      <dd class="font-bold [overflow-wrap:anywhere] hyphens-none" translate="no" data-testid="password-reset-email">
        {email}
      </dd>
    </dl>
  {/if}

  <PasswordSetter id={formId} username={email} bind:password bind:this={setter} onShadedBg onsubmit={handleSubmit} />

  {#if status === 'failed'}
    <ErrorMessage
      inline
      role="alert"
      class="my-md"
      message={t('contestantApp.setPassword.error')}
      data-testid="password-reset-error" />
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
    <ContactSupport variant="normal" />
  {/snippet}
</MainContent>
