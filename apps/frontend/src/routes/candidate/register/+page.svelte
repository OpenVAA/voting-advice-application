<!--@component

# Candidate app register page

- Shows a form in which to insert a registration key and continue to password selection.
- Checks on load if the key is in a search param and automatically redirects to password selection if the key is valid.

## Params

- `registrationKey`: The registration key
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
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

  let changedAfterCheck = $state(false);
  let status = $state<ActionStatus>('idle');

  // Get key from search params
  let registrationKey = $state(page.url.searchParams.get('registrationKey') ?? '');
  if (registrationKey) checkKeyAndContinue(registrationKey);

  let canSubmit = $derived(status !== 'loading' && registrationKey !== '' && (status !== 'error' || changedAfterCheck));

  $effect(() => {
    // Track registrationKey changes to re-enable submit after error
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    registrationKey;
    changedAfterCheck = true;
  });

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
    ? t('candidateApp.register.titleWithPreregistration')
    : t('candidateApp.register.title')}>
  {#snippet heading()}
    <HeadingGroup>
      <PreHeading class="text-primary text-2xl font-bold">{t('dynamic.candidateAppName')}</PreHeading>
    </HeadingGroup>
  {/snippet}
  <form class="flex flex-col flex-nowrap items-center">
    {#if userData.current}
      <p class="text-warning text-center">{t('candidateApp.register.loggedInWarning')}</p>
      <div class="center pb-10">
        <LogoutButton variant="main" />
      </div>
    {:else}
      <p class="max-w-md text-center">
        {t('candidateApp.register.enterCode')}
      </p>
      <input
        type="text"
        name="registration-code"
        id="registration-code"
        class="input mb-md w-full max-w-md"
        placeholder={t('candidateApp.register.codePlaceholder')}
        bind:value={registrationKey}
        aria-label={t('candidateApp.register.code')}
        data-testid="register-code"
        required />
      {#if status === 'error'}
        <ErrorMessage
          inline
          message={t('candidateApp.register.wrongRegistrationCode')}
          class="mb-lg mt-md"
          data-testid="register-error" />
        <div class="gap-lg bg-base-200 p-lg flex w-full flex-col rounded-lg">
          <h3 class="text-center">
            {t('candidateApp.register.didYouAlreadyRegister')}
          </h3>
          <Button
            href={$getRoute('CandAppLogin')}
            text={t('candidateApp.register.goToLoginLabel')}
            variant="main"
            data-testid="register-go-to-login" />
        </div>
      {/if}
    {/if}
  </form>
  {#snippet primaryActions()}
    <Button
      disabled={!canSubmit}
      text={t('candidateApp.register.register')}
      variant="main"
      onclick={handleSubmit}
      data-testid="register-submit" />
    <Button
      href={$getRoute('CandAppLogin')}
      text={t('candidateApp.register.didYouAlreadyRegister')}
      data-testid="register-login-link" />
    <Button href={$getRoute('CandAppHelp')} text={t('candidateApp.help.title')} data-testid="register-help-link" />
  {/snippet}
</MainContent>
