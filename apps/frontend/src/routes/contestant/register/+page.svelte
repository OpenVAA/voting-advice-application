<!--@component

# Contestant app registration page

Lists the ways the project lets a visitor register, and leads each where it must.

- The modes listed are the ones the application settings offer, in a fixed order: the identity provider, the email address and the registration code. With several, each is a radio whose panel opens when it is chosen, and nothing is chosen on arrival. With exactly one, its panel is shown directly. The page is never rendered with none: its server load leads to the login page then.
- The identity provider's panel holds the introduction of the pre-registration start, and Continue opens that start.
- The email panel takes an address. Continue asks for a sign-in link to it and opens the "email sent" screen when the request has settled, whatever it settled as. Nothing of the request's answer is read.
- The code panel takes a registration code. Continue checks it: a code nobody has claimed leads to the screen that asks for an address, and a claimed code to the screen that signs its holder in. The code is held in the entry flow for that screen, and is in no address. Every other answer of the check, and a check that failed, is shown as one sentence at the field, with the code left as it was typed, so that the page says nothing of why a code was not confirmed.
- Continue is always available. A press with no mode chosen sends nothing, says to choose one and moves focus to the first radio. A press with the open panel's field empty or unusable sends nothing, says what to enter at the field and moves focus there.
- Each panel that has a field is a form of its own, and the radios are in no form, so the open form holds one field. Each form is declared as a post although no server action answers it, so that a submit the page's script did not catch could not write an address or a code into the address bar. Continue needs the page's script, so it is natively disabled until the page has mounted.
- What was typed in a panel is kept while the page is shown, when another mode is chosen and the first is chosen back.

## Settings

- `contestantApp.registrationModes`, `contestantApp.entityTypes` and `access.answersLocked`: Together they decide which modes are listed.
- `contestantApp.entityTypes`: The entity types the project serves also decide the app's name above the heading.

-->

<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { EmailField } from '$contestant/components/emailField';
  import { RegistrationCodeField } from '$contestant/components/registrationCodeField';
  import { RegistrationModeSelector } from '$contestant/components/registrationModeSelector';
  import { getContestantAppName } from '$contestant/utils/contestantAppName';
  import { listedRegistrationModes } from '$contestant/utils/registrationOffer';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getUUID } from '$lib/utils/components';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import type { RegistrationMode } from '@openvaa/app-shared';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Stable references are destructured. `appSettings` is a reactive accessor, read as `contestantCtx.appSettings` inside each tracking scope: see CLAUDE.md "Context Destructuring Rule".
  const contestantCtx = getContestantContext();
  const { checkInvitationCode, getRoute, holdEntryCode, sendEntryLink, t } = contestantCtx;
  const contestantAppName = $derived(getContestantAppName({ appSettings: contestantCtx.appSettings, t }));
  const { pageStyles } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // The modes
  ////////////////////////////////////////////////////////////////////

  /** The modes the project offers, in the order they are shown. */
  const listed = $derived(listedRegistrationModes(contestantCtx.appSettings));

  let selector: RegistrationModeSelector | undefined = $state();
  /** The mode chosen among several. The selector never writes it for a single mode. */
  let selected = $state<RegistrationMode>();
  let modesError = $state<string>();

  /** The mode whose panel is shown: the one listed mode, else the chosen one while it is listed. */
  const mode = $derived.by(() => {
    if (listed.length === 1) return listed[0];
    return selected && listed.includes(selected) ? selected : undefined;
  });

  ////////////////////////////////////////////////////////////////////
  // The panels' forms
  ////////////////////////////////////////////////////////////////////

  const emailFormId = getUUID();
  const codeFormId = getUUID();

  let emailField: EmailField | undefined = $state();
  let codeField: RegistrationCodeField | undefined = $state();
  // What was typed is held here and not in the fields, which are removed with their panel.
  let email = $state('');
  let code = $state('');
  let emailError = $state<string>();
  let codeError = $state<string>();
  /** Why the code field is in error: nothing was typed, or the code typed was not confirmed. */
  let codeErrorReason = $state<'required' | 'unconfirmed'>();

  let mounted = $state(false);
  /** Whether a link request is in flight. */
  let requesting = $state(false);
  /** Whether a code is being checked. */
  let checking = $state(false);

  /** How a panel's sentence is set: centred where the one panel stands alone on the page, and starting where the option's text starts inside an option's block. */
  const sentenceClass = $derived(listed.length === 1 ? 'max-w-md text-center' : 'text-start');

  /** The id of the open panel's form, which Continue submits. The identity provider's panel has no form. */
  const openFormId = $derived(mode === 'email' ? emailFormId : mode === 'code' ? codeFormId : undefined);

  onMount(() => {
    mounted = true;
  });

  /**
   * Continue while no form is open: with no mode chosen it says to choose one, and for the identity provider it opens the pre-registration start.
   */
  function handleContinue(): void {
    if (requesting || checking) return;
    if (!mode) {
      modesError = t('contestantApp.register.modes.required');
      selector?.focusFirst();
      return;
    }
    if (mode === 'identity_provider') void goto(getRoute.current('ContestantAppPreregister'));
  }

  async function handleEmailSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (requesting || checking) return;
    const address = email.trim();
    // Emptiness is asked first: the control reports an empty field as invalid too, and the two have different messages.
    if (!address || !emailField?.checkValidity()) {
      emailError = address ? t('components.input.error.invalidEmail') : t('contestantApp.login.emailRequired');
      emailField?.focus();
      return;
    }
    requesting = true;
    await sendEntryLink({ origin: 'register', email: address });
    await goto(getRoute.current('ContestantAppEmailSent'));
    requesting = false;
  }

  async function handleCodeSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (requesting || checking) return;
    const typed = code.trim();
    if (!typed) {
      codeErrorReason = 'required';
      codeError = t('contestantApp.register.codeRequired');
      codeField?.focus();
      return;
    }
    checking = true;
    // A check that failed is read as a code that was not confirmed.
    const status = await checkInvitationCode({ code: typed }).catch(() => undefined);
    if (status === 'valid' || status === 'used') {
      // The code is held before the navigation: the screen it leads to renders only over a held code.
      holdEntryCode({ code: typed, status });
      await goto(getRoute.current(status === 'valid' ? 'ContestantAppRegisterEmail' : 'ContestantAppRegisterSignIn'));
      checking = false;
      return;
    }
    checking = false;
    codeErrorReason = 'unconfirmed';
    codeError = t('contestantApp.register.codeUnconfirmed');
    // The main button was natively disabled during the check, so focus is placed once the field is editable again.
    await tick();
    codeField?.focus();
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
</script>

<MainContent
  title={t('contestantApp.register.title')}
  data-testid="contestant-register"
  data-modes={listed.join(' ')}
  data-mode-selected={mode ?? ''}
  data-register-state={checking ? 'checking' : 'idle'}>
  {#snippet heading()}
    <HeadingGroup>
      <PreHeading>{contestantAppName}</PreHeading>
      <h1 tabindex="-1">{t('contestantApp.register.title')}</h1>
    </HeadingGroup>
  {/snippet}

  <RegistrationModeSelector modes={listed} bind:selected bind:error={modesError} bind:this={selector}>
    {#snippet panel(panelMode)}
      {#if panelMode === 'identity_provider'}
        <div class={sentenceClass}>
          {@html sanitizeHtml(t('contestantApp.preregister.identification.start.content'))}
        </div>
      {:else if panelMode === 'email'}
        <form
          id={emailFormId}
          method="POST"
          novalidate
          onsubmit={handleEmailSubmit}
          class="gap-md flex w-full max-w-md flex-col">
          <p class={sentenceClass}>{t('contestantApp.register.emailInfo')}</p>
          <EmailField
            bind:this={emailField}
            bind:value={email}
            bind:error={emailError}
            autocomplete="email"
            data-testid="register-email"
            errorTestId="register-email-error" />
        </form>
      {:else}
        <form
          id={codeFormId}
          method="POST"
          novalidate
          onsubmit={handleCodeSubmit}
          class="gap-md flex w-full max-w-md flex-col">
          <p class={sentenceClass}>{t('contestantApp.register.enterCode')}</p>
          <RegistrationCodeField
            bind:this={codeField}
            bind:value={code}
            bind:error={codeError}
            errorReason={codeErrorReason}
            data-testid="register-code"
            errorTestId="register-code-error" />
        </form>
      {/if}
    {/snippet}
  </RegistrationModeSelector>

  {#snippet primaryActions()}
    {#if openFormId}
      <Button
        type="submit"
        form={openFormId}
        variant="main"
        text={t('common.continue')}
        disabled={!mounted}
        loading={requesting || checking}
        data-testid="register-submit" />
    {:else}
      <Button
        type="button"
        variant="main"
        text={t('common.continue')}
        disabled={!mounted}
        onclick={handleContinue}
        data-testid="register-submit" />
    {/if}
    <Button
      href={getRoute.current('ContestantAppSignIn')}
      text={t('contestantApp.register.didYouAlreadyRegister')}
      data-testid="register-login-link" />
    <Button href={getRoute.current('ContestantAppLogin')} text={t('common.return')} data-testid="register-return" />
  {/snippet}
</MainContent>
