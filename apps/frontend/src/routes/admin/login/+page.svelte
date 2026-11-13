<!--@component

# Admin app login page

- The `/admin` routes redirect here if there is not auth token in the cookie and show a possible error defined by the `errorMessage` seach param
- The message under the password field says why the visitor was sent here, for the reasons `$lib/admin/utils/loginError` knows: the session was not there or the user's data could not be read, the user may not use the Admin App, a logout count ran out with no one to cancel it, or the user logged out in another tab or window. The reason is read from the page's load, which answers the automatic logout when the request hook has just ended the session at a count's end, else from `errorMessage`: the gate that sends that request here names `loginFailed` on the address bar, which says less. Any other value shows nothing, and no text from the address bar is rendered. The message is an alert
- The heading takes the focus the root layout moves after a navigation, and while a message is shown it names the message as its description, so a screen reader that lands on the heading is given the sentence with it
- Shows login form
- Under the form, "Forgot Password?" and "I have not set a password yet" each lead to the forgot-password page, carrying the typed address when there is one. A recovery mail asked for there is one whose link lands in the Admin App
- The form posts to the login route by its full path, so a sign-in reaches the route's action wherever the page stands, also at another route's address after Back
- Uses 'frontpage' layout

## Data

- `signedOutReason`: The reason the page's load answers, shown before the one `errorMessage` names.

## Params

- `redirectTo`: The path to redirect to after successful login
- `errorMessage`: The `LoginError` (`$lib/admin/utils/loginError`) to show, if the user has been logged out without making the sign-out on this page

-->

<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { MainContent } from '$layouts/main';
  import { getErrorTranslationKey } from '$lib/admin/utils/loginError';
  import { PasswordField } from '$lib/candidate/components/passwordField';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeadingGroup } from '$lib/components/headingGroup';
  import { getAdminContext } from '$lib/contexts/admin';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { Footer } from '$lib/dynamic-components/footer';
  import type { LoginError } from '$lib/admin/utils/loginError';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // `darkMode` / `getRoute` are stable rune-native `{ readonly current }` handles from AdminContext (inherited from AppContext); read `.current` directly.
  // `appSettings` is a reactive accessor — read via `ctx.appSettings`, never destructure (the alias below tracks it).
  const ctx = getAdminContext();
  const { darkMode, getRoute, t } = ctx;
  const appSettings = $derived(ctx.appSettings);
  const { pageStyles, topBarSettings } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // Handle form and error messages
  ////////////////////////////////////////////////////////////////////

  const errorParam = page.url.searchParams.get('errorMessage') as LoginError | null;
  const redirectTo = page.url.searchParams.get('redirectTo');

  let email = $state('');
  let emailInput = $state<HTMLInputElement | undefined>(undefined);
  let errorMessage = $state<string | undefined>(undefined);
  let password = $state('');
  let status = $state<ActionStatus>('idle');

  if (errorParam) {
    const errorKey = getErrorTranslationKey(errorParam);
    if (errorKey) errorMessage = t(errorKey);
  }
  // One-shot init-only translation of URL ?error= → status; subsequent errorMessage updates flow through form-action handlers.
  // svelte-ignore state_referenced_locally
  if (errorMessage) status = 'error';

  let canSubmit = $derived(!!(status !== 'loading' && email && password));

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
  topBarSettings.use({
    imageSrc: darkMode.current ? '/images/hero-admin.png' : '/images/hero-admin.png'
  });
</script>

<MainContent title={t('adminApp.login.title')}>
  {#snippet heading()}
    <HeadingGroup>
      <h1 class="text-primary">{t('adminApp.login.appTitle')}</h1>
      <h2 class="text-base-content">{t('adminApp.login.appSubtitle')}</h2>
    </HeadingGroup>
  {/snippet}

  <p class="mt-md">{t('adminApp.login.instructions')}</p>

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
              ? t('error.wrongEmailOrPassword')
              : result.status === 403
                ? t('error.403')
                : t('error.general');
          return;
        }
        await applyAction(result);
        status = 'success';
      };
    }}>
    <div class="flex w-full flex-col items-center">
      <label for="email" class="hidden">{t('common.email')}</label>
      <input hidden name="redirectTo" value={redirectTo} />
      <input
        type="email"
        name="email"
        id="email"
        bind:this={emailInput}
        bind:value={email}
        class="input mb-md w-full max-w-md"
        placeholder={t('common.emailPlaceholder')}
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
        text={t('common.login')}
        variant="main" />
    </div>

    <div class="mt-lg">
      {#if appSettings.access.voterApp}
        <!-- We call invalidateAll when navigation to the Voter App to remove the Nominations we have added when loading User data -->
        <Button
          onclick={() => goto(getRoute.current('Home'), { invalidateAll: true })}
          text={t('candidateApp.common.voterApp')} />
      {/if}
    </div>
  </form>

  <Footer />
</MainContent>
