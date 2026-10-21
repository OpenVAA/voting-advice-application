<!--@component

# Contestant app forgot password page

Takes an email address and asks for a mail with which to set a new password.

- A press of the main button with an address that cannot be used sends nothing: the field says what to enter and takes focus.
- With a usable address the page asks for a password-recovery link with the trimmed address, and opens the "email sent" screen when the request has settled, whatever it settled as. Nothing about the address is looked up, and nothing of the request's answer is read: the page shows the same to every visitor, whether or not the address has an account.
- The form is declared as a post although no server action answers it, so that a submit the page's script did not catch could not write an address into the address bar. The main button needs the page's script, so it is natively disabled until the page has mounted.
- The page is open to a signed-in user too.

## Settings

- `contestantApp.entityTypes`: The entity types the project serves, which decide the app's name above the heading.

-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { EmailField } from '$contestant/components/emailField';
  import { getContestantAppName } from '$contestant/utils/contestantAppName';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getUUID } from '$lib/utils/components';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Stable references are destructured. `appSettings` is a reactive accessor, read as `contestantCtx.appSettings` inside its tracking scope: see CLAUDE.md "Context Destructuring Rule".
  const contestantCtx = getContestantContext();
  const { getRoute, sendEntryLink, t } = contestantCtx;
  const contestantAppName = $derived(getContestantAppName({ appSettings: contestantCtx.appSettings, t }));
  const { pageStyles } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // The form
  ////////////////////////////////////////////////////////////////////

  const formId = getUUID();

  let emailField: EmailField | undefined = $state();
  let email = $state('');
  let emailError = $state<string>();
  let mounted = $state(false);
  let requesting = $state(false);

  onMount(() => {
    mounted = true;
  });

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (requesting) return;
    const address = email.trim();
    // Emptiness is asked first: the control reports an empty field as invalid too, and the two have different messages.
    if (!address || !emailField?.checkValidity()) {
      emailError = address ? t('components.input.error.invalidEmail') : t('contestantApp.login.emailRequired');
      emailField?.focus();
      return;
    }
    requesting = true;
    await sendEntryLink({ origin: 'forgotPassword', email: address });
    await goto(getRoute.current('ContestantAppEmailSent'));
    requesting = false;
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
</script>

<MainContent title={t('contestantApp.resetPassword.title')} data-testid="contestant-forgot-password">
  {#snippet heading()}
    <HeadingGroup>
      <PreHeading>{contestantAppName}</PreHeading>
      <h1 tabindex="-1">{t('contestantApp.resetPassword.title')}</h1>
    </HeadingGroup>
  {/snippet}

  <p class="max-w-md text-center">{t('contestantApp.resetPassword.ingress')}</p>

  <form id={formId} method="POST" novalidate onsubmit={handleSubmit} class="gap-md flex w-full max-w-md flex-col">
    <EmailField
      bind:this={emailField}
      bind:value={email}
      bind:error={emailError}
      name="email"
      autocomplete="email"
      data-testid="forgot-password-email"
      errorTestId="forgot-password-email-error" />
  </form>

  {#snippet primaryActions()}
    <Button
      type="submit"
      form={formId}
      variant="main"
      text={t('contestantApp.resetPassword.sendLink')}
      disabled={!mounted}
      loading={requesting}
      data-testid="forgot-password-submit" />
    <Button
      href={getRoute.current('ContestantAppSignIn')}
      text={t('common.return')}
      data-testid="forgot-password-return" />
  {/snippet}
</MainContent>
