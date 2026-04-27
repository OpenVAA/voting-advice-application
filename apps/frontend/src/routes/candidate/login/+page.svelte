<!--@component

# Candidate app login page

- The `/candidate` routes redirect here if there is not auth token in the cookie and show a possible error defined by the `errorMessage` seach param
- Shows login form
- Shows the pre-registration button if enabled
- Uses 'frontpage' layout

## Params

- `redirectTo`: The path to redirect to after successful login
- `errorMessage`: The `CandidateLoginError` to show, if the user has been forcibly logged out after an error

## Settings

- `preRegistration.enabled`: Whether the pre-registration button is shown and the login details collapsed.
- `access.voterApp`: Whether a link to the voter app is shown.

-->

<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import { slide } from 'svelte/transition';
  import { applyAction, enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { getErrorTranslationKey } from '$candidate/utils/loginError';
  import { PasswordField } from '$lib/candidate/components/passwordField';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeadingGroup } from '$lib/components/headingGroup';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { Footer } from '$lib/dynamic-components/footer';
  import { DELAY } from '$lib/utils/timing';
  import MainContent from '../../MainContent.svelte';
  import type { CandidateLoginError } from '$candidate/utils/loginError';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const candCtx = getCandidateContext();
  const { answersLocked, appCustomization, appSettings, darkMode, getRoute, t } = candCtx;
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Handle form and error messages
  ////////////////////////////////////////////////////////////////////

  const errorParam = page.url.searchParams.get('errorMessage') as CandidateLoginError | null;
  const redirectTo = page.url.searchParams.get('redirectTo');

  let email = $state('');
  let emailInput = $state<HTMLInputElement | undefined>(undefined);
  let errorMessage = $state<string | undefined>(undefined);
  let passwordFieldRef: { focus: () => void };
  let password = $state('');
  let showPasswordSetMessage = $state(false);
  let status = $state<ActionStatus>('idle');

  if (errorParam) {
    const errorKey = getErrorTranslationKey(errorParam);
    if (errorKey) errorMessage = t(errorKey);
  }
  if (errorMessage) status = 'error';

  if (candCtx.newUserEmail != null) {
    email = candCtx.newUserEmail;
    showPasswordSetMessage = true;
    candCtx.newUserEmail = undefined;
  }

  let canSubmit = $derived(!!(status !== 'loading' && email && password));

  ///////////////////////////////////////////////////////////////////
  // Showing the login form and autofocusing inputs
  ////////////////////////////////////////////////////////////////////

  /** The `showLogin` flag is set by the button to show the login */
  let showLogin = $state(false);

  // If preregistration is possible, login details will be collapsed by default. They will be shown, however, if the email is defined, the show login button has been clicked or there was a login error
  /** Whether to show the login details */
  let isLoginShown = $derived(
    !!(email || showLogin || answersLocked || !$appSettings.preRegistration?.enabled || status === 'error')
  );

  $effect(() => {
    if (email) passwordFieldRef?.focus();
  });

  function handleShowLogin(event: { preventDefault: () => unknown }): void {
    event.preventDefault();
    showLogin = true;
    tick().then(() => emailInput?.focus());
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

<MainContent title={t('candidateApp.login.title')}>
  {#snippet heading()}
    <HeadingGroup>
      <h1>
        {showPasswordSetMessage ? t('candidateApp.setPassword.passwordSetSuccesfully') : t('dynamic.candidateAppName')}
      </h1>
    </HeadingGroup>
  {/snippet}

  <form
    class="flex w-full flex-col flex-nowrap items-center"
    method="POST"
    action="login"
    use:enhance={() => {
      status = 'loading';
      return async ({ result }) => {
        if (result.type === 'failure') {
          status = 'error';
          errorMessage =
            result.status === 400
              ? t('error.wrongEmailOrPassword')
              : result.status === 403
                ? t('error.403')
                : t('candidateApp.login.unknownError');
          return;
        }
        await applyAction(result);
        status = 'success';
      };
    }}>
    {#if isLoginShown}
      <div transition:slide={{ duration: DELAY.sm }} class="flex w-full flex-col items-center">
        {#if !showPasswordSetMessage}
          <p class="max-w-md text-center">
            {answersLocked ? t('candidateApp.login.answersLockedInfo') : t('candidateApp.login.enterEmailAndPassword')}
          </p>
        {/if}
        <label for="email" class="hidden">{t('common.email')}</label>
        <input hidden name="redirectTo" value={redirectTo} />
        <input
          type="email"
          name="email"
          id="email"
          data-testid="login-email"
          bind:this={emailInput}
          bind:value={email}
          class="input mb-md w-full max-w-md"
          placeholder={t('common.emailPlaceholder')}
          autocomplete="email"
          required />
        <div class="mb-md w-full max-w-md">
          <PasswordField autocomplete="current-password" id="password" bind:password bind:this={passwordFieldRef} />
        </div>
        {#if status === 'error'}
          <ErrorMessage inline message={errorMessage} class="mb-md" data-testid="login-errorMessage" />
        {/if}
        <Button
          type="submit"
          disabled={!canSubmit}
          loading={status === 'loading'}
          text={t('common.login')}
          variant="main"
          data-testid="login-submit" />
      </div>
    {:else}
      <div transition:slide={{ duration: DELAY.sm }} class="flex w-full flex-col items-center">
        <Button onclick={handleShowLogin} text={t('common.login')} variant="main" data-testid="login-show" />
      </div>
    {/if}

    {#if !answersLocked && $appSettings.preRegistration?.enabled}
      <div class="divider">{t('common.or')}</div>
      <Button
        href={$getRoute('CandAppPreregister')}
        text={t('candidateApp.preregister.identification.start.title')}
        class="transition-opacity {isLoginShown || status === 'loading' ? 'opacity-30' : ''}"
        variant="main"
        data-testid="login-preregister" />
    {/if}

    <div class="mt-lg">
      <Button
        href={$getRoute('CandAppRegister')}
        text={t('candidateApp.login.haveRegistrationCode')}
        data-testid="login-register-link" />
      <Button
        href={$getRoute('CandAppForgotPassword')}
        text={t('candidateApp.login.forgotPassword')}
        data-testid="login-forgot-password-link" />
      <Button href={$getRoute('CandAppHelp')} text={t('candidateApp.help.title')} data-testid="login-help-link" />
      {#if $appSettings.access.voterApp}
        <!-- We call invalidateAll when navigation to the Voter App to remove the Nominations we have added when loading User data -->
        <Button
          onclick={() => goto($getRoute('Home'), { invalidateAll: true })}
          text={t('candidateApp.common.voterApp')}
          data-testid="login-voter-app-link" />
      {/if}
    </div>
  </form>

  <Footer />
</MainContent>
