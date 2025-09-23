<!--@component

# Candidate app register page

- Shows a form in which to insert a registration key and continue to password selection.
- Checks on load if the key is in a search param and automatically redirects to password selection if the key is valid.

## Params

- `registrationKey`: The registration key
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { LogoutButton } from '$lib/candidate/components/logoutButton';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { logDebugError } from '$lib/utils/logger';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, checkRegistrationKey, getRoute, t, userData } = getCandidateContext();

  ////////////////////////////////////////////////////////////////////
  // Handle checking registration key
  ////////////////////////////////////////////////////////////////////

  let canSubmit: boolean;
  let changedAfterCheck = false;
  let status: ActionStatus = 'idle';

  // Get key from search params
  let registrationKey = $page.url.searchParams.get('registrationKey');
  if (registrationKey) checkKeyAndContinue(registrationKey);

  $: canSubmit = status !== 'loading' && registrationKey !== '' && (status !== 'error' || changedAfterCheck);
  $: {
    // Mark the input field as changed so we re-enable the submit button without hiding the error message
    changedAfterCheck = true;
    registrationKey;
  }

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
      changedAfterCheck = false;
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
</script>

<MainContent
  title={$appSettings.preRegistration?.enabled
    ? $t('candidateApp.register.titleWithPreregistration')
    : $t('candidateApp.register.title')}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-primary text-2xl font-bold">{$t('dynamic.candidateAppName')}</PreHeading>
  </HeadingGroup>
  <form class="flex flex-col flex-nowrap items-center">
    {#if $userData}
      <p class="text-warning text-center">{$t('candidateApp.register.loggedInWarning')}</p>
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
        <div class="gap-lg bg-base-200 p-lg flex w-full flex-col rounded-lg">
          <h3 class="text-center">
            {$t('candidateApp.register.didYouAlreadyRegister')}
          </h3>
          <Button href={$getRoute('CandAppLogin')} text={$t('candidateApp.register.goToLoginLabel')} variant="main" />
        </div>
      {/if}
    {/if}
  </form>
  <svelte:fragment slot="primaryActions">
    <Button disabled={!canSubmit} text={$t('candidateApp.register.register')} variant="main" on:click={handleSubmit} />
    <Button href={$getRoute('CandAppLogin')} text={$t('candidateApp.register.didYouAlreadyRegister')} />
    <Button href={$getRoute('CandAppHelp')} text={$t('candidateApp.help.title')} />
  </svelte:fragment>
</MainContent>
