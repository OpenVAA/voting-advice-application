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
  import { onDestroy, onMount, tick } from 'svelte';
  import { slide } from 'svelte/transition';
  import { applyAction, enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { getErrorTranslationKey } from '$candidate/utils/loginError';
  import { PasswordField } from '$lib/candidate/components/passwordField';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { Footer } from '$lib/dynamic-components/footer';
  import { DELAY } from '$lib/utils/timing';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { answersLocked, appSettings, darkMode, getRoute, locale, newUserEmail, t } = getCandidateContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Handle form and error messages
  ////////////////////////////////////////////////////////////////////

  const errorParam = $page.url.searchParams.get('errorMessage');
  const redirectTo = $page.url.searchParams.get('redirectTo');

  let canSubmit: boolean;
  let email = '';
  let emailInput: HTMLInputElement | undefined;
  let errorMessage: string | undefined;
  let focusPassword: () => void | undefined;
  let password = '';
  let showPasswordSetMessage = false;
  let status: ActionStatus = 'idle';

  if (errorParam) {
    const errorKey = getErrorTranslationKey(errorParam);
    if (errorKey) errorMessage = $t(errorKey);
  }
  if (errorMessage) status = 'error';

  if ($newUserEmail != null) {
    email = $newUserEmail;
    showPasswordSetMessage = true;
    $newUserEmail = undefined;
  }

  $: canSubmit = !!(status !== 'loading' && email && password);

  ///////////////////////////////////////////////////////////////////
  // Showing the login form and autofocusing inputs
  ////////////////////////////////////////////////////////////////////

  /** Whether to show the login details */
  let isLoginShown: boolean;
  /** The `showLogin` flag is set by the button to show the login */
  let showLogin = false;

  // If preregistration is possible, login details will be collapsed by default. They will be shown, however, if the email is defined, the show login button has been clicked or there was a login error
  $: isLoginShown = !!(
    email ||
    showLogin ||
    $answersLocked ||
    !$appSettings.preRegistration?.enabled ||
    status === 'error'
  );

  onMount(() => {
    if (email) focusPassword();
  });

  function handleShowLogin(event: { preventDefault: () => unknown }): void {
    event.preventDefault();
    showLogin = true;
    tick().then(() => emailInput?.focus());
  }

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: undefined } });
  // topBarSettings.push({
  //   imageSrc: $darkMode
  //     ? ($appCustomization.candPoster?.urlDark ?? $appCustomization.candPoster?.url ?? '/images/hero-candidate.png')
  //     : ($appCustomization.candPoster?.url ?? '/images/hero-candidate.png')
  // });
</script>

<MainContent
  title={$t('candidateApp.login.title')}
  class="!sm:px-lg !px-0 !pb-0"
  contentClass="!max-w-3xl p-lg sm:p-xl rounded-t-lg bg-base-300 grow">
  <HeadingGroup slot="heading" class="mt-lg w-full p-lg">
    <PreHeading class="flex flex-col items-center"
      ><img
        src="/images/nuorten-vaalikone-logo-{$locale ?? 'fi'}-{$darkMode ? 'white' : 'black'}.svg"
        alt={$t('dynamic.appName')}
        class="w-[26rem]" /></PreHeading>
    <h1>{$t('dynamic.candidateAppName')}</h1>
  </HeadingGroup>

  <form
    class="flex w-full flex-col flex-nowrap items-center"
    method="POST"
    action="login"
    use:enhance={() => {
      status = 'loading';
      return async ({ update, result }) => {
        await update();
        if (result.type === 'failure') {
          status = 'error';
          errorMessage =
            result.status === 400
              ? $t('candidateApp.login.wrongEmailOrPassword')
              : $t('candidateApp.login.unknownError');
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
            {$answersLocked
              ? $t('candidateApp.login.answersLockedInfo')
              : $t('candidateApp.login.enterEmailAndPassword')}
          </p>
        {:else}
          <p class="max-w-md text-center text-lg font-bold">
            {$t('candidateApp.setPassword.passwordSetSuccesfully')}
          </p>
        {/if}
        <label for="email" class="hidden">{$t('candidateApp.common.email')}</label>
        <input hidden name="redirectTo" value={redirectTo} />
        <input
          type="email"
          name="email"
          id="email"
          bind:this={emailInput}
          bind:value={email}
          class="input mb-md w-full max-w-md"
          placeholder={$t('candidateApp.common.emailPlaceholder')}
          autocomplete="email"
          required />
        <div class="mb-md w-full max-w-md">
          <PasswordField autocomplete="current-password" id="password" bind:password bind:focus={focusPassword} />
        </div>
        {#if status === 'error'}
          <ErrorMessage inline message={errorMessage} class="mb-md" />
        {/if}
        <Button
          type="submit"
          disabled={!canSubmit}
          loading={status === 'loading'}
          text={$t('common.login')}
          variant="main" />
      </div>
    {:else}
      <div transition:slide={{ duration: DELAY.sm }} class="flex w-full flex-col items-center">
        <Button on:click={handleShowLogin} text={$t('common.login')} variant="main" />
      </div>
    {/if}

    {#if !$answersLocked && $appSettings.preRegistration?.enabled}
      <div class="divider">{$t('common.or')}</div>
      <Button
        href={$getRoute('CandAppPreregister')}
        text={$t('candidateApp.preregister.identification.start.title')}
        class="transition-opacity {isLoginShown || status === 'loading' ? 'opacity-30' : ''}"
        variant="main" />
    {/if}

    <div class="mt-lg">
      <Button href={$getRoute('CandAppForgotPassword')} text={$t('candidateApp.login.forgotPassword')} />
      <Button href={$getRoute('CandAppHelp')} text={$t('candidateApp.help.title')} />
      {#if $appSettings.access.voterApp}
        <!-- We call invalidateAll when navigation to the Voter App to remove the Nominations we have added when loading User data -->
        <Button
          on:click={() => goto($getRoute('Home'), { invalidateAll: true })}
          text={$t('candidateApp.common.voterApp')} />
      {/if}
    </div>
  </form>

  <Footer />
</MainContent>

<style lang="postcss">
  :global(body) {
    @apply bg-[url('https://nuortenvaalikone.s3.eu-north-1.amazonaws.com/frontpage-bg-sm.jpg')] bg-cover bg-fixed bg-center sm:bg-[url('https://nuortenvaalikone.s3.eu-north-1.amazonaws.com/frontpage-bg-md.jpg')] lg:bg-[url('https://nuortenvaalikone.s3.eu-north-1.amazonaws.com/frontpage-bg-lg.jpg')] dark:bg-[url('https://nuortenvaalikone.s3.eu-north-1.amazonaws.com/frontpage-bg-sm-dark.jpg')] dark:sm:bg-[url('https://nuortenvaalikone.s3.eu-north-1.amazonaws.com/frontpage-bg-md-dark.jpg')] dark:lg:bg-[url('https://nuortenvaalikone.s3.eu-north-1.amazonaws.com/frontpage-bg-lg-dark.jpg')];
  }

  :global(.vaa-frontpage-logos > svg, .vaa-frontpage-logos > img) {
    @apply inline-block max-h-[2rem] max-w-[8rem];
  }
</style>
