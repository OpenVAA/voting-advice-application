<!--@component

# Contestant app code sign-in page

Signs in a user who entered a registration code that somebody has claimed, with that code and a password, and leads a user who has not set a password, or does not remember it, to the forgot-password page.

- The page shows its screen only while the entry flow holds a registration code that was checked and found used. Otherwise, as after a reload or a visit by address, it renders nothing and leads to the registration page in place of this history entry.
- The sign-in is a form posted to this route's server action. The held code travels in a hidden field of that form, so it is in the post's body and never in an address.
- The page asks for no email address and shows none: the address the code was claimed with is never sent to the browser.
- A press with the password missing sends nothing: the field says what to enter and takes focus. A second submit while a sign-in runs sends nothing either.
- A refused sign-in shows one sentence chosen by the status of the refusal, and focus stays where it was. A wrong password, an account with no password and a spent attempt budget are refused alike and share one sentence, which points at the links below. The same sentence is shown from the `form` prop when the page is rendered after a post its script did not make.
- A sign-in follows the action's redirect, and the entry flow is cleared when that navigation has ended. Clearing it first would lead this page to the registration page while the redirect is being followed.
- The form holds the link to the forgot-password page and, when the settings allow the email or the identity-provider registration mode for a served entity type, the link for a user who has not set a password, which leads to the same page. The screen holds no address, so neither link carries one, and the page asks for nothing itself.

## Settings

- `contestantApp.entityTypes`: The entity types the project serves, which decide the app's name above the heading.
- `contestantApp.registrationModes`: Whether the link for a user who has not set a password is rendered.

-->

<script lang="ts">
  import { tick } from 'svelte';
  import { applyAction, enhance } from '$app/forms';
  import { goto } from '$app/navigation';
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

  // Stable references are destructured. `entryFlow` and `appSettings` are reactive accessors, read as `contestantCtx.X` inside each tracking scope: see CLAUDE.md "Context Destructuring Rule".
  const contestantCtx = getContestantContext();
  const { clearEntryFlow, getRoute, t } = contestantCtx;
  const contestantAppName = $derived(getContestantAppName({ appSettings: contestantCtx.appSettings, t }));
  const linkOffered = $derived(signInLinkOffered(contestantCtx.appSettings));
  const { pageStyles } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // The held code
  ////////////////////////////////////////////////////////////////////

  /** The registration code the sign-in is made with: the held one, while it is one that was found used. */
  const usedCode = $derived.by(() => {
    const held = contestantCtx.entryFlow?.code;
    return held?.status === 'used' ? held.code : undefined;
  });

  $effect(() => {
    if (!usedCode) void goto(getRoute.current('ContestantAppRegister'), { replaceState: true });
  });

  ////////////////////////////////////////////////////////////////////
  // The sign-in form
  ////////////////////////////////////////////////////////////////////

  /** What became of a sign-in: none made, one in flight, or one refused with a status. */
  type SignInOutcome = { state: 'idle' } | { state: 'submitting' } | { state: 'failed'; status: number };

  const formId = getUUID();

  let passwordSignIn: PasswordSignIn | undefined = $state();
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
   * The sentence for a refused sign-in. A wrong password, an account with no password and a spent attempt budget are all refused with 400, and share one sentence.
   * @param status - The status of the refusal.
   */
  function failureSentence(status: number): string {
    if (status === 400) return t('contestantApp.register.signIn.failed');
    if (status === 403) return t('contestantApp.login.noProfile');
    return t('contestantApp.login.unknownError');
  }

  /**
   * Called with a submit of the form before it is posted. Cancels a post made while a sign-in runs or with the password missing, and otherwise answers with the handler of the post's result.
   */
  function handleSignIn({ formData, cancel }: Parameters<SubmitFunction>[0]): ReturnType<SubmitFunction> {
    if (outcome.state === 'submitting') {
      cancel();
      return;
    }
    if (!formData.get('password')) {
      cancel();
      passwordError = t('contestantApp.login.passwordRequired');
      passwordSignIn?.focus();
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
      await applyAction(result);
      // Only now: this page leaves for the registration page as soon as the held code goes.
      if (result.type !== 'error') clearEntryFlow();
      scriptedOutcome = { state: 'idle' };
    };
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
</script>

{#if usedCode}
  <MainContent
    title={t('contestantApp.register.signIn.title')}
    data-testid="contestant-register-sign-in"
    data-sign-in-state={outcome.state}>
    {#snippet heading()}
      <HeadingGroup>
        <PreHeading>{contestantAppName}</PreHeading>
        <h1 tabindex="-1">{t('contestantApp.register.signIn.title')}</h1>
      </HeadingGroup>
    {/snippet}

    <p class="text-center">{t('contestantApp.register.signIn.ingress')}</p>

    <form id={formId} method="POST" novalidate use:enhance={handleSignIn} class="gap-md flex w-full flex-col">
      <input type="hidden" name="code" value={usedCode} />
      <PasswordSignIn
        bind:this={passwordSignIn}
        bind:error={passwordError}
        noPasswordYetOffered={linkOffered}
        {failure}
        {failureStatus}
        errorTestId="register-sign-in-password-error"
        failureTestId="register-sign-in-error"
        forgotPasswordTestId="register-sign-in-forgot-password-link"
        noPasswordYetTestId="register-sign-in-no-password-yet-link" />
    </form>

    {#snippet primaryActions()}
      <Button
        type="submit"
        form={formId}
        variant="main"
        text={t('common.login')}
        loading={outcome.state === 'submitting'}
        data-testid="register-sign-in-submit" />
      <Button
        href={getRoute.current('ContestantAppRegister')}
        text={t('common.return')}
        data-testid="register-sign-in-return" />
    {/snippet}
  </MainContent>
{/if}
