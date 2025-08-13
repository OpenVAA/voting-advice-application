<!--@component

# Candidate app forgot password page

Shows a form with which to request a password reset email.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { SuccessMessage } from '$lib/components/successMessage';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { logDebugError } from '$lib/utils/logger';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { getRoute, requestForgotPasswordEmail, t } = getCandidateContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Handle form
  ////////////////////////////////////////////////////////////////////

  let email = '';
  let status: ActionStatus = 'idle';

  async function handleSubmit() {
    status = 'loading';
    // Request email to be sent in the backend
    const result = await requestForgotPasswordEmail({ email }).catch((e) => {
      logDebugError(`Error requesting password reset email: ${e?.message}`);
      return undefined;
    });
    if (result?.type !== 'success') {
      status = 'error';
      return;
    }
    status = 'success';
    // Clear the input field after successful submission
    email = '';
  }

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
</script>

<MainContent title={$t('candidateApp.resetPassword.title')}>
  <HeadingGroup slot="heading">
    <PreHeading>{$t('dynamic.candidateAppName')}</PreHeading>
    <h1>{$t('candidateApp.resetPassword.title')}</h1>
  </HeadingGroup>

  <!-- If email hasn't been sent yet, show form where user can input their email address. -->
  <form on:submit|preventDefault={handleSubmit} class="flex flex-col items-center">
    <p class="text-center">
      {$t('candidateApp.resetPassword.ingress')}
    </p>

    <input
      type="email"
      name="email"
      id="email"
      aria-label={$t('common.emailPlaceholder')}
      class="input mb-md w-full max-w-md"
      placeholder={$t('common.emailPlaceholder')}
      bind:value={email}
      required />

    {#if status === 'error'}
      <ErrorMessage inline message={$t('candidateApp.resetPassword.error')} class="mb-lg mt-md" />
    {:else if status === 'success'}
      <SuccessMessage inline message={$t('candidateApp.resetPassword.emailSentText')} class="mb-lg mt-md" />
    {/if}

    {#if status === 'success'}
      <Button href={$getRoute('CandAppLogin')} variant="main" text={$t('common.home')} />
    {:else}
      <Button
        type="submit"
        loading={status === 'loading'}
        variant="main"
        class="btn btn-primary mb-md w-full max-w-md"
        text={$t('candidateApp.resetPassword.sendLink')} />
      <Button href={$getRoute('CandAppLogin')} text={$t('common.return')} />
    {/if}
  </form>
</MainContent>
