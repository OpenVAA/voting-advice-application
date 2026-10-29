<!--@component

# Contestant app reset password page

Lets a signed-in user set a new password. A mailed password-recovery link lands its user here.

- The page's server load decides whether it is shown: a visitor with no session is redirected to the login page before any of it is rendered. It is shown to every signed-in user, however they arrived, and asks for no current password.
- The address of the account is shown as text and handed to the password form, where a password manager reads it beside the new password. It comes from the page's server load, so it is in the server's markup.
- The main button stands outside the form and submits it, so Enter in a field does the same as a press. It can always be pressed once the page's script has loaded: a press with a password the form does not accept saves nothing, and the field says why.
- A saved password leaves the user signed in and leads to the app root, with the loads rerun. A failed save is reported as an alert, and the form stays with what was typed.

## Data

- `email`: The address of the signed-in user, from the page's server load. When the account has none, the label and the address are left out together.

## Settings

- `contestantApp.entityTypes`: The entity types the project serves, which decide the app's name above the heading.

-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { ContactSupport } from '$contestant/components/contactSupport';
  import { PasswordSetter } from '$contestant/components/passwordSetter';
  import { getContestantAppName } from '$contestant/utils/contestantAppName';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getUUID } from '$lib/utils/components';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Stable references are destructured. `appSettings` is a reactive accessor, read as `contestantCtx.appSettings` inside its tracking scope: see CLAUDE.md "Context Destructuring Rule".
  const contestantCtx = getContestantContext();
  const { getRoute, setPassword, t } = contestantCtx;
  const contestantAppName = $derived(getContestantAppName({ appSettings: contestantCtx.appSettings, t }));
  const { pageStyles } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // Save the password
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
    // Awaited so that the main button keeps its saving state until the next page is shown. The session is the one the password was saved on, and the loads of the page it leads to are run again over it.
    try {
      await goto(getRoute.current('ContestantAppHome'), { invalidateAll: true });
    } catch (error) {
      log.error('Failed to leave for the app root after the password was saved', { err: error });
    }
    status = 'idle';
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
</script>

<MainContent title={t('contestantApp.resetPassword.createNewPassword')} data-testid="contestant-password-reset">
  {#snippet heading()}
    <HeadingGroup>
      <PreHeading>{contestantAppName}</PreHeading>
      <h1 tabindex="-1">{t('contestantApp.resetPassword.createNewPassword')}</h1>
    </HeadingGroup>
  {/snippet}

  {#if data.email}
    <dl class="my-lg text-center">
      <dt class="small-label">{t('contestantApp.nothingToEdit.signedInAs')}</dt>
      <dd class="font-bold [overflow-wrap:anywhere] hyphens-none" translate="no" data-testid="password-reset-email">
        {data.email}
      </dd>
    </dl>
  {/if}

  <PasswordSetter id={formId} username={data.email} bind:password bind:this={setter} onsubmit={handleSubmit} />

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
