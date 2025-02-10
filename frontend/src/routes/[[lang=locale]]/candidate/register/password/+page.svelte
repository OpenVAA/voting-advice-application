<!--@component

# Candidate app initial password setting page

- Shows a form in which to insert 
- Checks on load if the key is in a search param and automatically redirects to password selection if the key is valid.

## Params

- `registrationKey`: The registration key
- `username`: The name with which to greet the user
- `email`: The email of the user
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
  import MainContent from '../../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { getRoute, newUserEmail, register, t, userData } = getCandidateContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Check that user is not logged and all params are provided
  ////////////////////////////////////////////////////////////////////

  const registrationKey = $page.url.searchParams.get('registrationKey') || '';
  const username = $page.url.searchParams.get('username') || '';
  const email = $page.url.searchParams.get('email') || '';

  if (registrationKey === '' || email === '') {
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

    const result = await register({ registrationKey, password }).catch((e) => {
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

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
</script>

<MainContent title={$t('candidateApp.register.title')}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('dynamic.candidateAppName')}</PreHeading>
    <h1 class="my-24 text-2xl font-normal">
      {$t('candidateApp.common.greeting', { username })}
    </h1>
  </HeadingGroup>
  <div class="flex-nowarp flex flex-col items-center">
    <PasswordSetter bind:valid={isPasswordValid} bind:errorMessage={validationError} bind:password />
    {#if status === 'error'}
      <ErrorMessage inline message={$t('candidateApp.setPassword.registrationError')} class="mb-lg mt-md" />
    {/if}
    <Button on:click={handleSubmit} disabled={!canSubmit} variant="main" text={submitLabel} />
    <Button href={$getRoute('CandAppHelp')} text={$t('candidateApp.common.contactSupport')} />
  </div>
</MainContent>
