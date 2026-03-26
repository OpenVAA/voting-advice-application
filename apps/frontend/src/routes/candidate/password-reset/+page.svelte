<!--@component

# Candidate app reset password page

Shows a form with which to set a new password when it has been reset.

## Query params

- `code`: The reset code
-->

<svelte:options runes />

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { PasswordSetter } from '$lib/candidate/components/passwordSetter';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { logDebugError } from '$lib/utils/logger';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { getRoute, isAuthenticated, resetPassword, setPassword, t } = getCandidateContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Handle form
  ////////////////////////////////////////////////////////////////////

  const code = page.url.searchParams.get('code');
  // Session-based flow: user arrived via auth callback with verifyOtp (recovery type)
  const isSessionFlow = $isAuthenticated && !code;

  // Redirect to login only if neither code nor session is available
  if (!code && !isSessionFlow) goto($getRoute('CandAppLogin'));

  let isPasswordValid = $state(false);
  let password = $state('');
  let status = $state<ActionStatus>('idle');
  let validationError = $state<string | undefined>(undefined);

  let canSubmit = $derived(status !== 'loading' && isPasswordValid);
  let submitLabel = $derived(validationError || t('candidateApp.setPassword.setPassword'));

  async function handleSubmit() {
    if (!canSubmit) {
      logDebugError('HandleSubmit called when canSubmit is false');
      return undefined;
    }

    status = 'loading';

    if (isSessionFlow) {
      // Session-based flow: user already has a session from verifyOtp, just set the password
      const result = await setPassword({ password }).catch((e) => {
        logDebugError(`Error with setPassword: ${e?.message}`);
        return undefined;
      });

      if (result?.type !== 'success') {
        status = 'error';
        return;
      }

      status = 'success';
      // User is already authenticated — navigate to candidate home via full page load
      // to ensure session cookies are sent to the server-side loader.
      window.location.href = $getRoute('CandAppHome');
    } else {
      // Code-based flow: use resetPassword with the code
      const result = await resetPassword({ code: code!, password }).catch((e) => {
        logDebugError(`Error with resetPassword: ${e?.message}`);
        return undefined;
      });

      if (result?.type !== 'success') {
        status = 'error';
        return;
      }

      status = 'success';
      await goto($getRoute('CandAppLogin'));
    }
  }

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
</script>

<MainContent title={t('candidateApp.resetPassword.createNewPassword')}>
  {#snippet heading()}
    <HeadingGroup>
      <PreHeading>{t('dynamic.candidateAppName')}</PreHeading>
      <h1>{t('candidateApp.resetPassword.createNewPassword')}</h1>
    </HeadingGroup>
  {/snippet}
  <div class="flex-nowarp flex flex-col items-center">
    <PasswordSetter bind:valid={isPasswordValid} bind:errorMessage={validationError} bind:password />
    {#if status === 'error'}
      <ErrorMessage
        inline
        message={t('candidateApp.resetPassword.failed')}
        class="mb-lg mt-md"
        data-testid="password-reset-error" />
    {/if}
    <Button
      onclick={handleSubmit}
      disabled={!canSubmit}
      variant="main"
      text={submitLabel}
      data-testid="password-reset-submit" />
    <Button
      href={$getRoute('CandAppHelp')}
      text={t('candidateApp.common.contactSupport')}
      data-testid="password-reset-help-link" />
  </div>
</MainContent>
