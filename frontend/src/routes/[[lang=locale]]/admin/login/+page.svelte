<!--@component

# Admin app login page

- The `/admin` routes redirect here if there is no auth token in the cookie
- Shows login form for admin users

## Params

- `redirectTo`: The path to redirect to after successful login
- `errorMessage`: The error to show, if the user has been forcibly logged out after an error

-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { applyAction, enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { PasswordField } from '$lib/candidate/components/passwordField';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getAppContext } from '$lib/contexts/app';
  import { Footer } from '$lib/dynamic-components/footer';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getAppContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Handle form and error messages
  ////////////////////////////////////////////////////////////////////

  const errorParam = $page.url.searchParams.get('errorMessage');
  const redirectTo = $page.url.searchParams.get('redirectTo');

  let canSubmit: boolean;
  let email = '';
  let errorMessage: string | undefined;
  let password = '';
  let status: ActionStatus = 'idle';

  if (errorParam) {
    // Map error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      invalid: $t('adminApp.login.errors.invalidCredentials'),
      unauthorized: $t('adminApp.login.errors.unauthorized'),
      session_expired: $t('adminApp.login.errors.sessionExpired')
    };

    errorMessage = errorMessages[errorParam] || $t('adminApp.login.errors.unknown');
  }
  if (errorMessage) status = 'error';

  $: canSubmit = !!(status !== 'loading' && email && password);

  ///////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
</script>

<MainContent title={$t('adminApp.login.title')}>
  <div class="flex w-full flex-col items-center">
    <div class="mb-lg text-center">
      <h1 class="text-primary">{$t('adminApp.login.appTitle')}</h1>
      <h2 class="text-base-content">{$t('adminApp.login.appSubtitle')}</h2>
      <p class="mt-md">{$t('adminApp.login.instructions')}</p>
    </div>

    <form
      class="flex w-full flex-col flex-nowrap items-center"
      method="POST"
      action="login"
      use:enhance={() => {
        status = 'loading';
        return async ({ update, result }) => {
          await update();
          if (result.type === 'error') {
            status = 'error';
            errorMessage =
              result.status === 400
                ? $t('adminApp.login.errors.invalidCredentials')
                : $t('adminApp.login.errors.genericError');
            return;
          }
          await applyAction(result);
          status = 'success';
        };
      }}>
      <div class="flex w-full flex-col items-center">
        <label for="email" class="hidden">{$t('adminApp.login.email')}</label>
        <input hidden name="redirectTo" value={redirectTo} />
        <input
          type="email"
          name="email"
          id="email"
          bind:value={email}
          class="input mb-md w-full max-w-md"
          placeholder={$t('adminApp.login.email')}
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
          loading={status === 'loading'}
          text={$t('adminApp.login.button')}
          variant="main"
          class="w-full max-w-md" />
      </div>

      <div class="mt-lg">
        <Button href="/admin/forgot-password" text={$t('adminApp.login.forgotPassword')} variant="normal" />
      </div>
    </form>

    <Footer class="mt-auto pt-lg" />
  </div>
</MainContent>
