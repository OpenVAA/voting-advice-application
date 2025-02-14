<!--@component

# Candidate app login page

- The `/candidate` routes redirect here if there is not auth token in the cookie and show a possible error defined by the `errorMessage` seach param
- Shows login form
- Uses 'frontpage' layout

## Params

- `redirectTo`: The path to redirect to after successful login
- `errorMessage`: The `CandidateLoginError` to show, if the user has been forcibly logged out after an error
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { applyAction, enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { getErrorTranslationKey } from '$candidate/utils/loginError';
  import { PasswordField } from '$lib/candidate/components/passwordField';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeadingGroup } from '$lib/components/headingGroup';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { Footer } from '$lib/dynamic-components/footer';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appCustomization, appSettings, darkMode, getRoute, newUserEmail, t } = getCandidateContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Handle form and error messages
  ////////////////////////////////////////////////////////////////////

  const errorParam = $page.url.searchParams.get('errorMessage');
  const redirectTo = $page.url.searchParams.get('redirectTo');

  let canSubmit: boolean;
  let email = '';
  let errorMessage: string | undefined;
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
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    imageSrc: $darkMode
      ? ($appCustomization.candPoster?.urlDark ?? $appCustomization.candPoster?.url ?? '/images/hero-candidate.png')
      : ($appCustomization.candPoster?.url ?? '/images/hero-candidate.png')
  });
</script>

<MainContent title={$t('candidateApp.login.title')}>
  <HeadingGroup slot="heading">
    <h1>
      {showPasswordSetMessage ? $t('candidateApp.setPassword.passwordSetSuccesfully') : $t('dynamic.candidateAppName')}
    </h1>
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
    {#if !showPasswordSetMessage}
      <p class="max-w-md text-center">
        {$t('candidateApp.login.enterEmailAndPassword')}
      </p>
    {/if}
    <label for="email" class="hidden">{$t('candidateApp.common.email')}</label>
    <input hidden name="redirectTo" value={redirectTo} />
    <input
      type="email"
      name="email"
      id="email"
      bind:value={email}
      class="input mb-md w-full max-w-md"
      placeholder={$t('candidateApp.common.emailPlaceholder')}
      autocomplete="email"
      required />
    <div class="mb-md w-full max-w-md">
      <PasswordField autocomplete="current-password" id="password" bind:password />
    </div>
    {#if status === 'error'}
      <ErrorMessage inline message={errorMessage} class="mb-md" />
    {/if}

    <Button 
      type="submit" 
      disabled={!canSubmit} 
      text={$t('common.login')} 
      variant="main" />

    {#if $appSettings.preRegistration?.enabled}
      <div class="divider">{$t('common.or')}</div>
      <Button 
        href={$getRoute('CandAppPreregister')} 
        text={$t('candidateApp.preregister.identification.start.title')} 
        variant="main" />
    {/if}

    <div class="mt-lg">
      <Button href={$getRoute('CandAppForgotPassword')} text={$t('candidateApp.login.forgotPassword')} />
      <Button href={$getRoute('CandAppHelp')} text={$t('candidateApp.help.title')} />
      <!-- We call invalidateAll when navigation to the Voter App to remove the Nominations we have added when loading User data -->
      <Button
        on:click={() => goto($getRoute('Home'), { invalidateAll: true })}
        text={$t('candidateApp.common.voterApp')} />
    </div>
  </form>

  <Footer />
</MainContent>
