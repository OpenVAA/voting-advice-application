<!--@component

# Admin app login page

- The `/admin` routes redirect here if there is not auth token in the cookie and show a possible error defined by the `errorMessage` seach param
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
  import { getErrorTranslationKey, type LoginError } from '$lib/admin/utils/loginError';
  import { PasswordField } from '$lib/candidate/components/passwordField';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeadingGroup } from '$lib/components/headingGroup';
  import { getAdminContext } from '$lib/contexts/admin';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { Footer } from '$lib/dynamic-components/footer';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appCustomization, appSettings, darkMode, getRoute, t } = getAdminContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Handle form and error messages
  ////////////////////////////////////////////////////////////////////

  const errorParam = $page.url.searchParams.get('errorMessage') as LoginError | null;
  const redirectTo = $page.url.searchParams.get('redirectTo');

  let canSubmit: boolean;
  let email = '';
  let emailInput: HTMLInputElement | undefined;
  let errorMessage: string | undefined;
  let focusPassword: () => void | undefined;
  let password = '';
  let status: ActionStatus = 'idle';

  if (errorParam) {
    const errorKey = getErrorTranslationKey(errorParam);
    if (errorKey) errorMessage = $t(errorKey);
  }
  if (errorMessage) status = 'error';

  $: canSubmit = !!(status !== 'loading' && email && password);

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    imageSrc: $darkMode ? '/images/hero-admin.png' : '/images/hero-admin.png'
  });
</script>

<MainContent title={$t('adminApp.login.title')}>
  <HeadingGroup slot="heading">
    <h1 class="text-primary">{$t('adminApp.login.appTitle')}</h1>
    <h2 class="text-base-content">{$t('adminApp.login.appSubtitle')}</h2>
  </HeadingGroup>

  <p class="mt-md">{$t('adminApp.login.instructions')}</p>

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
              ? $t('error.wrongEmailOrPassword')
              : result.status === 403
                ? $t('error.403')
                : $t('error.general');
          return;
        }
        await applyAction(result);
        status = 'success';
      };
    }}>
    <div class="flex w-full flex-col items-center">
      <label for="email" class="hidden">{$t('common.email')}</label>
      <input hidden name="redirectTo" value={redirectTo} />
      <input
        type="email"
        name="email"
        id="email"
        bind:this={emailInput}
        bind:value={email}
        class="input mb-md w-full max-w-md"
        placeholder={$t('common.emailPlaceholder')}
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

    <div class="mt-lg">
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
