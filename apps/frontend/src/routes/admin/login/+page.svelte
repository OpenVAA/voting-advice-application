<!--@component

# Admin app login page

- The `/admin` routes redirect here if there is not auth token in the cookie and show a possible error defined by the `errorMessage` seach param
- A refused sign-in shows one sentence chosen by the status of the refusal. The same sentence is shown from the `form` prop when the page is rendered after a post its script did not make, before any reason the page was opened for
- The message under the password field says why the visitor was sent here, for the reasons `$lib/admin/utils/loginError` knows: the session was not there or the user's data could not be read, the user may not use the Admin App, a logout count ran out with no one to cancel it, or the user logged out in another tab or window. The reason is read from the page's load, which answers the automatic logout when the request hook has just ended the session at a count's end, else from `errorMessage`: the gate that sends that request here names `loginFailed` on the address bar, which says less. Any other value shows nothing, and no text from the address bar is rendered. The message is an alert
- The heading takes the focus the root layout moves after a navigation, and while a message is shown it names the message as its description, so a screen reader that lands on the heading is given the sentence with it
- Shows login form
- Under the form, "Forgot Password?" and "I have not set a password yet" each lead to the forgot-password page, carrying the typed address when there is one. A recovery mail asked for there is one whose link lands in the Admin App
- The form posts to the login route by its full path, so a sign-in reaches the route's action wherever the page stands, also at another route's address after Back
- Uses 'frontpage' layout

## Data

- `signedOutReason`: The reason the page's load answers, shown before the one `errorMessage` names.
- `form.status`: The status of a refused sign-in, which the action's failure repeats as its data.

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
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeadingGroup } from '$lib/components/headingGroup';
  import { Input } from '$lib/components/input';
  import { getAdminContext } from '$lib/contexts/admin';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { Footer } from '$lib/dynamic-components/footer';
  import type { LoginError } from '$lib/admin/utils/loginError';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

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

  const redirectTo = page.url.searchParams.get('redirectTo');

  /** The id of the message, which the heading names as its description while it is shown. */
  const messageId = $props.id();

  /**
   * The sentence for a refused sign-in.
   * @param refusal - The status of the refusal.
   */
  function failureSentence(refusal: number): string {
    if (refusal === 400) return t('error.wrongEmailOrPassword');
    if (refusal === 403) return t('error.403');
    return t('error.general');
  }

  /** The message key of why the page was opened, the load's reason before the address bar's, read once: later messages come from the form's handler. */
  // svelte-ignore state_referenced_locally
  const reasonKey =
    getErrorTranslationKey(data.signedOutReason ?? null) ??
    getErrorTranslationKey(page.url.searchParams.get('errorMessage') as LoginError | null);

  /** The message the page opens with, read once: the refusal of the post the page was rendered from, else why the page was opened. */
  // svelte-ignore state_referenced_locally
  const initialMessage = form?.status ? failureSentence(form.status) : reasonKey ? t(reasonKey) : undefined;

  let email = $state('');
  let errorMessage = $state<string | undefined>(initialMessage);
  let password = $state('');
  let status = $state<ActionStatus>(initialMessage ? 'error' : 'idle');

  let canSubmit = $derived(!!(status !== 'loading' && email && password));

  /** The forgot-password page, with the typed address when there is one. */
  const forgotPasswordHref = $derived.by(() => {
    const address = email.trim();
    return getRoute.current(address ? { route: 'AdminAppForgotPassword', email: address } : 'AdminAppForgotPassword');
  });

  /**
   * The email kind of `Input` takes an entry in when it is committed, so every keystroke is written here: it is what enables the sign-in while the address is typed.
   */
  function handleEmailInput({ currentTarget }: { currentTarget: EventTarget & HTMLElement }): void {
    if (currentTarget instanceof HTMLInputElement) email = currentTarget.value;
  }

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
      <h1 class="text-primary" tabindex="-1" aria-describedby={status === 'error' ? messageId : undefined}>
        {t('adminApp.login.appTitle')}
      </h1>
      <h2 class="text-base-content">{t('adminApp.login.appSubtitle')}</h2>
    </HeadingGroup>
  {/snippet}

  <p class="mt-md">{t('adminApp.login.instructions')}</p>

  <form
    class="flex w-full flex-col flex-nowrap items-center"
    method="POST"
    action={getRoute.current('AdminAppLogin')}
    use:enhance={() => {
      status = 'loading';
      return async ({ update, result }) => {
        if (result.type === 'failure') {
          await update();
          status = 'error';
          errorMessage = failureSentence(result.status);
          return;
        }
        // One navigation, so a sign-in writes one history entry.
        await applyAction(result);
        status = 'success';
      };
    }}>
    <div class="flex w-full flex-col items-center">
      <input hidden name="redirectTo" value={redirectTo} />
      <div class="mb-md w-full max-w-md">
        <Input
          bind:value={email}
          type="email"
          validate={false}
          id="email"
          label={t('common.email')}
          name="email"
          autocomplete="email"
          inputmode="email"
          autocapitalize="none"
          spellcheck="false"
          aria-required="true"
          onShadedBg
          oninput={handleEmailInput} />
      </div>
      <div class="mb-md w-full max-w-md">
        <Input
          bind:value={password}
          type="password"
          id="password"
          label={t('common.password')}
          name="password"
          autocomplete="current-password"
          aria-required="true"
          data-testid="password-field"
          onShadedBg />
      </div>
      {#if status === 'error'}
        <ErrorMessage id={messageId} inline role="alert" message={errorMessage} class="mb-md" />
      {/if}
      <Button
        type="submit"
        disabled={!canSubmit}
        loading={status === 'loading'}
        text={t('common.login')}
        variant="main" />
      <div class="mt-md flex flex-col items-center">
        <Button
          href={forgotPasswordHref}
          text={t('contestantApp.login.forgotPassword')}
          data-testid="admin-login-forgot-password" />
        <Button
          href={forgotPasswordHref}
          text={t('contestantApp.login.noPasswordYet')}
          data-testid="admin-login-no-password-yet" />
      </div>
    </div>

    <div class="mt-lg">
      {#if appSettings.access.voterApp}
        <!-- We call invalidateAll when navigation to the Voter App to remove the Nominations we have added when loading User data -->
        <Button
          onclick={() => goto(getRoute.current('Home'), { invalidateAll: true })}
          text={t('contestantApp.common.voterApp')} />
      {/if}
    </div>
  </form>

  <Footer />
</MainContent>
