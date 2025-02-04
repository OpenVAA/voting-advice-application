<!--@component

# Candidate app reset password page

Shows a form with which to set a new password when it has been reset.

## Query params

- `code`: The reset code
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

  const { getRoute, resetPassword, t } = getCandidateContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Handle form
  ////////////////////////////////////////////////////////////////////

  // If the reset code is not provided, redirect to home page
  const code = $page.url.searchParams.get('code');
  if (!code) goto($getRoute('CandAppHome'));

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

    const result = await resetPassword({ code: code!, password }).catch((e) => {
      logDebugError(`Error with resetPassword: ${e?.message}`);
      return undefined;
    });

    if (result?.type !== 'success') {
      status = 'error';
      return;
    }

    status = 'success';
    await goto($getRoute('CandAppHome'));
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
      <ErrorMessage inline message={$t('candidateApp.resetPassword.failed')} class="mb-lg mt-md" />
    {/if}
    <Button on:click={handleSubmit} disabled={!canSubmit} variant="main" text={submitLabel} />
    <Button href={$getRoute('CandAppHelp')} text={$t('candidateApp.common.contactSupport')} />
  </div>
</MainContent>
