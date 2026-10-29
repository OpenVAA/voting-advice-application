<!--@component

# Contestant app sign-in page

Signs a user in with an email address and a password, and leads a user who has no password yet, or does not remember it, to the forgot-password page.

- The sign-in is a form posted to this route's server action, so it works before the page's script has loaded. The submit button is among the page's actions and tied to the form by the form's id.
- A press with the address or the password missing sends nothing: the field says what to enter, and the first such field takes focus. What is missing is read from the posted form, so a value the browser filled in is read as the browser posts it.
- A refused sign-in shows one sentence chosen by the status of the refusal, and focus stays where it was. The same sentence is shown from the `form` prop when the page is rendered after a post its script did not make.
- The form holds the link to the forgot-password page and, when the settings allow the email or the identity-provider registration mode for a served entity type, whatever the answers lock says, the link for a user who has not set a password, which leads to the same page. Both carry the address typed so far, so that the page's field holds it, and neither needs one. The page asks for nothing itself.

## Params

- `redirectTo`: The path to redirect to after a sign-in. It is passed on to the server action in a hidden field and validated there.

## Settings

- `contestantApp.registrationModes`: Whether the link for a user who has not set a password is rendered.
- `contestantApp.entityTypes`: The entity types the project serves, which decide the app's name above the heading and which rows of the registration modes count.
- `access.answersLocked`: Whether the sentence above the form says that answers are locked.

-->

<script lang="ts">
  import { tick } from 'svelte';
  import { applyAction, enhance } from '$app/forms';
  import { page } from '$app/state';
  import { EmailField } from '$contestant/components/emailField';
  import { PasswordSignIn } from '$contestant/components/passwordSignIn';
  import { getContestantAppName } from '$contestant/utils/contestantAppName';
  import { signInLinkOffered } from '$contestant/utils/registrationOffer';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getUUID } from '$lib/utils/components';
  import type { SubmitFunction } from '@sveltejs/kit';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Stable references are destructured. `appSettings` and `answersLocked` are reactive accessors, read as `contestantCtx.X` inside each tracking scope: see CLAUDE.md "Context Destructuring Rule".
  const contestantCtx = getContestantContext();
  const { clearEntryFlow, getRoute, t } = contestantCtx;
  const contestantAppName = $derived(getContestantAppName({ appSettings: contestantCtx.appSettings, t }));
  const linkOffered = $derived(signInLinkOffered(contestantCtx.appSettings));
  const { pageStyles } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // The sign-in form
  ////////////////////////////////////////////////////////////////////

  /** What became of a sign-in: none made, one in flight, or one refused with a status. */
  type SignInOutcome = { state: 'idle' } | { state: 'submitting' } | { state: 'failed'; status: number };

  const formId = getUUID();
  const redirectTo = page.url.searchParams.get('redirectTo');

  let emailField: EmailField | undefined = $state();
  let email = $state('');
  let passwordSignIn: PasswordSignIn | undefined = $state();
  let emailError = $state<string>();
  let passwordError = $state<string>();

  /** The outcome of the last sign-in this page's script made. Unset until it makes one. */
  let scriptedOutcome = $state<SignInOutcome>();
  /** The outcome shown: the script's own, else the refusal of the post the page was rendered from. */
  const outcome = $derived<SignInOutcome>(
    scriptedOutcome ?? (form?.status ? { state: 'failed', status: form.status } : { state: 'idle' })
  );
  const failureStatus = $derived(outcome.state === 'failed' ? outcome.status : undefined);
  const failure = $derived(failureStatus === undefined ? undefined : failureSentence(failureStatus));

  /**
   * The sentence for a refused sign-in. A wrong address, a wrong password and an account with no password are all refused with 400, and share one sentence.
   * @param status - The status of the refusal.
   */
  function failureSentence(status: number): string {
    if (status === 400) return t('error.wrongEmailOrPassword');
    if (status === 403) return t('contestantApp.login.noProfile');
    return t('contestantApp.login.unknownError');
  }

  /** The address in the email field, read from the form as the browser would post it. */
  function postedAddress(formData: FormData): string {
    return String(formData.get('email') ?? '').trim();
  }

  /**
   * Called with a submit of the form before it is posted. Cancels a post with something missing, and otherwise answers with the handler of the post's result.
   */
  function handleSignIn({ formData, cancel }: Parameters<SubmitFunction>[0]): ReturnType<SubmitFunction> {
    const addressMissing = !postedAddress(formData);
    const passwordMissing = !formData.get('password');
    if (addressMissing || passwordMissing) {
      cancel();
      if (addressMissing) emailError = t('contestantApp.login.emailRequired');
      if (passwordMissing) passwordError = t('contestantApp.login.passwordRequired');
      if (addressMissing) emailField?.focus();
      else passwordSignIn?.focus();
      return;
    }
    // The submit button is natively disabled while the sign-in runs, and a browser may drop the focus of a button that becomes disabled.
    const focused = document.activeElement;
    scriptedOutcome = { state: 'submitting' };
    return async ({ result }) => {
      if (result.type === 'failure') {
        scriptedOutcome = { state: 'failed', status: result.status };
        await tick();
        if (focused instanceof HTMLElement && document.activeElement === document.body) focused.focus();
        return;
      }
      if (result.type !== 'error') clearEntryFlow();
      await applyAction(result);
      scriptedOutcome = { state: 'idle' };
    };
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
</script>

<MainContent title={t('contestantApp.login.title')} data-testid="contestant-sign-in" data-sign-in-state={outcome.state}>
  {#snippet heading()}
    <HeadingGroup>
      <PreHeading>{contestantAppName}</PreHeading>
      <h1 tabindex="-1">{t('contestantApp.login.title')}</h1>
    </HeadingGroup>
  {/snippet}

  {#if contestantCtx.answersLocked}
    <p class="text-center" data-testid="login-answers-locked-info">
      {t('contestantApp.login.answersLockedInfo')}
    </p>
  {:else}
    <p class="text-center">{t('contestantApp.login.enterEmailAndPassword')}</p>
  {/if}

  <form id={formId} method="POST" novalidate use:enhance={handleSignIn} class="gap-md flex w-full flex-col">
    <input type="hidden" name="redirectTo" value={redirectTo} />
    <EmailField
      bind:this={emailField}
      bind:value={email}
      bind:error={emailError}
      name="email"
      autocomplete="username"
      data-testid="login-email"
      errorTestId="login-email-error" />
    <PasswordSignIn
      bind:this={passwordSignIn}
      bind:error={passwordError}
      {email}
      noPasswordYetOffered={linkOffered}
      {failure}
      {failureStatus}
      errorTestId="login-password-error"
      failureTestId="login-errorMessage"
      forgotPasswordTestId="login-forgot-password-link"
      noPasswordYetTestId="login-no-password-yet-link" />
  </form>

  {#snippet primaryActions()}
    <Button
      type="submit"
      form={formId}
      variant="main"
      text={t('common.login')}
      loading={outcome.state === 'submitting'}
      data-testid="login-submit" />
    <Button href={getRoute.current('ContestantAppLogin')} text={t('common.return')} data-testid="login-return" />
  {/snippet}
</MainContent>
