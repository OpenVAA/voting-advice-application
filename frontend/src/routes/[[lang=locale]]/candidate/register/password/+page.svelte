<!--@component

# Candidate app initial password setting page

- Shows a form for setting the initial password after arriving via an invite link.

## Params

- `username`: The name with which to greet the user
- `email`: The email of the user
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PasswordSetter } from '$lib/candidate/components/passwordSetter';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeadingGroup } from '$lib/components/headingGroup';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { logDebugError } from '$lib/utils/logger';
  import MainContent from '../../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { getRoute, newUserEmail, register, t, userData } = getCandidateContext();

  ////////////////////////////////////////////////////////////////////
  // Check that user is not logged and all params are provided
  ////////////////////////////////////////////////////////////////////

  const username = $page.url.searchParams.get('username') || '';
  const email = $page.url.searchParams.get('email') || '';

  if (email === '') {
    goto($getRoute('CandAppRegister'));
  }

  // Redirect if logged in, that page will prompt the user to logout
  if ($userData) goto($getRoute('CandAppRegister'));

  ////////////////////////////////////////////////////////////////////
  // Handle password change
  ////////////////////////////////////////////////////////////////////

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

    const result = await register({ password }).catch((e) => {
      logDebugError(`Error with register: ${e?.message}`);
      return undefined;
    });

    if (result?.type !== 'success') {
      status = 'error';
      return;
    }

    $newUserEmail = email;
    status = 'success';
    await goto($getRoute('CandAppLogin'));
  }
</script>

<MainContent title={$t('candidateApp.register.title')}>
  <HeadingGroup slot="heading">
    <h1>{$t('candidateApp.common.greeting', { username })}</h1>
  </HeadingGroup>
  <div class="flex-nowarp flex flex-col items-center">
    <PasswordSetter bind:valid={isPasswordValid} bind:errorMessage={validationError} bind:password passwordTestId="register-password" confirmPasswordTestId="register-confirm-password" />
    {#if status === 'error'}
      <ErrorMessage inline message={$t('candidateApp.setPassword.registrationError')} class="mb-lg mt-md" data-testid="register-password-error" />
    {/if}
  </div>

  <svelte:fragment slot="primaryActions">
    <Button on:click={handleSubmit} disabled={!canSubmit} variant="main" text={submitLabel} data-testid="register-password-submit" />
    <Button href={$getRoute('CandAppHelp')} text={$t('candidateApp.common.contactSupport')} data-testid="register-password-help-link" />
  </svelte:fragment>
</MainContent>
