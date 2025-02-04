<!--@component

# Candidate app register page

- Shows a form in which to insert a registration key and continue to password selection.
- Checks on load if the key is in a search param and automatically redirects to password selection if the key is valid.

## Params

- `registrationKey`: The registration key
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { LogoutButton } from '$lib/candidate/components/logoutButton';
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

  const { appCustomization, checkRegistrationKey, darkMode, getRoute, t, userData } = getCandidateContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Handle checking registration key
  ////////////////////////////////////////////////////////////////////

  let status: ActionStatus = 'idle';

  // Get key from search params
  let registrationKey = $page.url.searchParams.get('registrationKey');
  if (registrationKey) checkKeyAndContinue(registrationKey);

  /**
   * Check the registration key and continue to password selection if valid. Otherwise, show an error message.
   */
  async function checkKeyAndContinue(registrationKey: string): Promise<void> {
    status = 'loading';
    const result = await checkRegistrationKey({ registrationKey }).catch((e) => {
      logDebugError(`Error checking registration key: ${e?.message}`);
      return undefined;
    });
    if (result?.type !== 'success') {
      status = 'error';
      return;
    }
    const { firstName, email } = result;
    await goto(
      $getRoute({
        route: 'CandAppSetPassword',
        registrationKey,
        username: firstName,
        email
      })
    );
    status = 'success';
  }

  function handleSubmit() {
    if (registrationKey) checkKeyAndContinue(registrationKey);
  }

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    imageSrc: $darkMode
      ? ($appCustomization.candPoster?.urlDark ?? $appCustomization.candPoster?.url ?? '/images/hero-candidate.png')
      : ($appCustomization.candPoster?.url ?? '/images/hero-candidate.png')
  });
</script>

<MainContent title={$t('candidateApp.register.title')}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('dynamic.candidateAppName')}</PreHeading>
  </HeadingGroup>
  <form class="flex flex-col flex-nowrap items-center" on:submit|preventDefault={handleSubmit}>
    {#if $userData}
      <p class="text-center text-warning">{$t('candidateApp.register.loggedInWarning')}</p>
      <div class="center pb-10">
        <LogoutButton buttonVariant="main" stayOnPage={true} />
      </div>
    {:else}
      <p class="max-w-md text-center">
        {$t('candidateApp.register.enterCode')}
      </p>
      <input
        type="text"
        name="registration-code"
        id="registration-code"
        class="input mb-md w-full max-w-md"
        placeholder={$t('candidateApp.register.codePlaceholder')}
        bind:value={registrationKey}
        aria-label={$t('candidateApp.register.code')}
        required />
      {#if status === 'error'}
        <ErrorMessage inline message={$t('candidateApp.register.wrongRegistrationCode')} class="mb-lg mt-md" />
      {/if}
      <Button
        type="submit"
        disabled={status === 'loading'}
        text={$t('candidateApp.register.register')}
        variant="main" />
    {/if}
    <Button href={$getRoute('CandAppHelp')} text={$t('candidateApp.common.contactSupport')} />
    <Button href={$getRoute('Home')} text={$t('candidateApp.common.voterApp')} />
  </form>
</MainContent>
