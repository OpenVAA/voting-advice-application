<!--@component

# Contestant app login page

The Contestant App's entry screen. It offers the ways into the app and holds no fields of its own.

- "Sign in with email" leads to the sign-in screen. "Register" leads to the registration screen, and is rendered only when the settings list at least one registration mode. Both are links, so the screen is whole and works before the page's script has loaded.
- The `/contestant` routes redirect here when there is no session, with the path that was asked for as `redirectTo`. The first entry carries that value on to the sign-in screen, whose server action validates it where it is consumed. This page does not navigate by it, show it or validate it, and "Register" carries nothing.
- A notice under the title says why a visitor was sent here, for the reasons `$contestant/utils/loginError` knows: the user was signed out because their account's information could not be read, or a mailed link could not be used. Any other value of `errorMessage` shows nothing, and no text from the address bar is rendered.
- While answers are locked the sentence that says so is shown, and nothing lists a registration mode, so there is no "Register".
- Uses the shaded frame with the contestant poster in the top bar.

## Params

- `redirectTo`: The path to lead to after a sign-in, passed on to the sign-in screen unread.
- `errorMessage`: The `ContestantLoginError` to show the notice of.

## Settings

- `contestantApp.registrationModes`: Whether "Register" is offered, as `listedRegistrationModes` reads them.
- `contestantApp.entityTypes`: The entity types the project serves, which decide the app's name in the heading and which rows of the registration modes count.
- `access.answersLocked`: Whether the locked sentence is shown. While it is, no registration mode is listed.
- `access.voterApp`: Whether a link to the voter app is shown.

-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { getContestantAppName } from '$contestant/utils/contestantAppName';
  import { getErrorTranslationKey } from '$contestant/utils/loginError';
  import { listedRegistrationModes } from '$contestant/utils/registrationOffer';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeadingGroup } from '$lib/components/headingGroup';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { Footer } from '$lib/dynamic-components/footer';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Stable references are destructured. The settings and the answers lock are reactive accessors, read as `contestantCtx.X` inside each tracking scope: see CLAUDE.md "Context Destructuring Rule".
  const contestantCtx = getContestantContext();
  const { appCustomization, darkMode, getRoute, t } = contestantCtx;
  const contestantAppName = $derived(getContestantAppName({ appSettings: contestantCtx.appSettings, t }));
  const registerOffered = $derived(listedRegistrationModes(contestantCtx.appSettings).length > 0);
  const { pageStyles, topBarSettings } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // The notice and the entries
  ////////////////////////////////////////////////////////////////////

  /** Why the visitor was sent here, and the sentence for it. Unset for no reason and for a value that is not one of the known reasons. */
  const notice = $derived.by(() => {
    const reason = page.url.searchParams.get('errorMessage');
    const key = getErrorTranslationKey(reason);
    return key ? { reason, message: t(key) } : undefined;
  });

  /** The sign-in screen's address, with the address bar's `redirectTo` passed on as it is when there is one. */
  const signInRoute = $derived.by(() => {
    const redirectTo = page.url.searchParams.get('redirectTo');
    return getRoute.current(redirectTo ? { route: 'ContestantAppSignIn', redirectTo } : 'ContestantAppSignIn');
  });

  ////////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
  topBarSettings.use({
    imageSrc: darkMode.current
      ? (appCustomization.current.contestantPoster?.urlDark ??
        appCustomization.current.contestantPoster?.url ??
        '/images/hero-contestant.png')
      : (appCustomization.current.contestantPoster?.url ?? '/images/hero-contestant.png')
  });
</script>

<MainContent
  title={contestantAppName}
  data-testid="contestant-login"
  data-register-offered={String(registerOffered)}
  data-answers-locked={String(contestantCtx.answersLocked)}>
  {#snippet heading()}
    <HeadingGroup>
      <h1 tabindex="-1">{contestantAppName}</h1>
    </HeadingGroup>
  {/snippet}

  {#if notice}
    <ErrorMessage
      inline
      role="alert"
      class="my-md"
      message={notice.message}
      data-testid="login-notice"
      data-reason={notice.reason} />
  {/if}

  {#if contestantCtx.answersLocked}
    <p class="max-w-md text-center" data-testid="login-answers-locked-info">
      {t('contestantApp.login.answersLockedInfo')}
    </p>
  {/if}

  {#snippet primaryActions()}
    <Button
      variant="main"
      href={signInRoute}
      text={t('contestantApp.login.signInWithEmail')}
      data-testid="login-sign-in-link" />
    {#if registerOffered}
      <div class="divider">{t('common.or')}</div>
      <Button
        variant="main"
        href={getRoute.current('ContestantAppRegister')}
        text={t('contestantApp.register.register')}
        data-testid="login-register-link" />
    {/if}
    <div class="mt-lg flex w-full flex-col items-center">
      <Button
        href={getRoute.current('ContestantAppHelp')}
        text={t('contestantApp.help.title')}
        data-testid="login-help-link" />
      {#if contestantCtx.appSettings.access.voterApp}
        <!-- We call invalidateAll when navigation to the Voter App to remove the Nominations we have added when loading User data -->
        <Button
          onclick={() => goto(getRoute.current('Home'), { invalidateAll: true })}
          text={t('contestantApp.common.voterApp')}
          data-testid="login-voter-app-link" />
      {/if}
    </div>
    <Footer />
  {/snippet}
</MainContent>
