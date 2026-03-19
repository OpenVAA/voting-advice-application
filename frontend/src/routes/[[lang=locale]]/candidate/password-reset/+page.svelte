<!--@component

# Candidate app reset password page

Shows a form to set a new password after clicking a password reset email link.
The auth callback route establishes a recovery session before redirecting here.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
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

  const { getRoute, setPassword, t } = getCandidateContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Handle form
  ////////////////////////////////////////////////////////////////////

  // Check for active session (recovery session established by auth callback)
  // If no session, the hooks route guard will redirect to login
  const hasSession = !!$page.data.session;
  if (!hasSession) goto($getRoute('CandAppLogin'));

  let canSubmit: boolean;
  let isPasswordValid: boolean;
  let password = '';
  let status: ActionStatus = 'idle';
  let submitLabel: string;
  let validationError: string | undefined;

  $: canSubmit = status !== 'loading' && isPasswordValid;
  $: submitLabel = validationError || $t('candidateApp.setPassword.setPassword');

  async function handleSubmit() {
    if (!canSubmit) {
      logDebugError('HandleSubmit called when canSubmit is false');
      return undefined;
    }

    status = 'loading';

    const result = await setPassword({ password }).catch((e) => {
      logDebugError(`Error with setPassword: ${e?.message}`);
      return undefined;
    });

    if (result?.type !== 'success') {
      status = 'error';
      return;
    }

    status = 'success';
    await goto($getRoute('CandAppLogin'));
  }

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
</script>

<MainContent title={$t('candidateApp.resetPassword.createNewPassword')}>
  <HeadingGroup slot="heading">
    <PreHeading>{$t('dynamic.candidateAppName')}</PreHeading>
    <h1>{$t('candidateApp.resetPassword.createNewPassword')}</h1>
  </HeadingGroup>
  <div class="flex-nowarp flex flex-col items-center">
    <PasswordSetter bind:valid={isPasswordValid} bind:errorMessage={validationError} bind:password />
    {#if status === 'error'}
      <ErrorMessage inline message={$t('candidateApp.resetPassword.failed')} class="mb-lg mt-md" data-testid="password-reset-error" />
    {/if}
    <Button on:click={handleSubmit} disabled={!canSubmit} variant="main" text={submitLabel} data-testid="password-reset-submit" />
    <Button href={$getRoute('CandAppHelp')} text={$t('candidateApp.common.contactSupport')} data-testid="password-reset-help-link" />
  </div>
</MainContent>
