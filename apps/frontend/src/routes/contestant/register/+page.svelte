<!--@component

# Contestant app registration page

Lists the ways the project lets a visitor register, and leads each where it must. A decorative hero emoji stands above the heading.

- The modes listed are the ones the application settings offer, in a fixed order: the identity provider, the email address and the registration code. With several, each is a radio whose panel opens when it is chosen, and nothing is chosen on arrival. With exactly one, its panel is shown directly. The page is never rendered with none: its server load leads to the login page then.
- An address whose `mode` parameter names a listed mode, as the identity provider's error screen's Try again does, opens that mode's panel when the page mounts. The parameter is read in the page, never in a load; a mode that is not listed chooses nothing.
- The identity provider's panel is a form whose one fact is the entity type registered, among the types the provider's mode is allowed for. With one type, a sentence names it and nothing is asked. With two, a sentence says both can be registered and a group of bordered radios asks which, with nothing chosen on arrival: Continue with none chosen sends nothing, says to choose one and moves focus to the first type. The type chosen is kept while the page is shown, when another mode is chosen and the provider's is chosen back. A line says where Continue leads. Continue posts the type to the authorize endpoint, under the page's locale, which the provider is asked to show its screens in, and, on its answer, the browser leaves for the provider; the type travels in the request's body and in an httpOnly cookie the endpoint sets, never in an address. Continue stays in its loading form until the page is left. A refusal of the type leads to the identity provider's error screen with `mode_not_allowed`, and any other failure with `registration_failed`; the page shows no provider error of its own. A page restored from the browser's page cache, by Back from the provider, ends the loading form.
- The email panel takes an address. Continue asks for a sign-in link to it and opens the "email sent" screen when the request has settled, whatever it settled as. Nothing of the request's answer is read.
- The code panel takes a registration code. Continue checks it: a code nobody has claimed leads to the screen that asks for an address, and a claimed code to the screen that signs its holder in. The code is held in the entry flow for that screen, and is in no address. Every other answer of the check, and a check that failed, is shown as one sentence at the field, with the code left as it was typed, so that the page says nothing of why a code was not confirmed.
- Continue is always available. A press with no mode chosen sends nothing, says to choose one and moves focus to the first radio. A press with the open panel's field empty or unusable sends nothing, says what to enter at the field and moves focus there.
- Each panel is a form of its own, and the radios are in no form, so the open form holds at most one field. Each form is declared as a post although no server action answers it, so that a submit the page's script did not catch could not write an address or a code into the address bar. Continue needs the page's script, so it is natively disabled until the page has mounted.
- What was typed in a panel is kept while the page is shown, when another mode is chosen and the first is chosen back.
- A browser that has once confirmed an address for this application, as its server load answers, is shown a notice above the modes: it looks as if the user is already registered, with links to the login screen and to the forgot-password screen. Its Dismiss posts to the page's `dismissRegistered` action, which removes the cookie that brings the notice; once the action has succeeded the notice is gone without a reload, and focus moves to the page's heading.

## Settings

- `contestantApp.registrationModes`, `contestantApp.entityTypes` and `access.answersLocked`: Together they decide which modes are listed, and which entity types the identity provider's panel registers.
- `contestantApp.entityTypes`: The entity types the project serves also decide the app's name above the heading.

-->

<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { applyAction, enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { EmailField } from '$contestant/components/emailField';
  import { RegistrationCodeField } from '$contestant/components/registrationCodeField';
  import { RegistrationModeSelector } from '$contestant/components/registrationModeSelector';
  import { getContestantAppName } from '$contestant/utils/contestantAppName';
  import { OIDC_ERROR } from '$contestant/utils/oidcError';
  import { identityProviderEntityTypes, listedRegistrationModes } from '$contestant/utils/registrationOffer';
  import { MainContent } from '$layouts/main';
  import { API_ROOT } from '$lib/api/base/universalApiRoutes';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Radio } from '$lib/components/input';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { localizeHref } from '$lib/paraglide/runtime';
  import { getUUID } from '$lib/utils/components';
  import { leaveFor } from '$lib/utils/leaveFor';
  import type { RegistrationMode, ServedEntityType } from '@openvaa/app-shared';
  import type { SubmitFunction } from '@sveltejs/kit';
  import type { TranslationKey } from '$types';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Stable references are destructured. `appSettings` is a reactive accessor, read as `contestantCtx.appSettings` inside each tracking scope: see CLAUDE.md "Context Destructuring Rule".
  const contestantCtx = getContestantContext();
  const { checkInvitationCode, getRoute, holdEntryCode, sendEntryLink, t } = contestantCtx;
  const contestantAppName = $derived(getContestantAppName({ appSettings: contestantCtx.appSettings, t }));
  const { pageStyles } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // The notice for a browser that has confirmed an address
  ////////////////////////////////////////////////////////////////////

  const registeredNoticeTitleId = getUUID();
  let titleHeading: HTMLHeadingElement | undefined = $state();
  /** Whether the notice was dismissed while the page is shown. */
  let registeredDismissed = $state(false);
  const showsRegisteredNotice = $derived(data.registered && !registeredDismissed);

  /**
   * The Dismiss of the notice: once the action has succeeded the notice is gone and focus is on the page's heading, as the notice took the focused control with it. Any other result is handed to the page.
   */
  function handleDismissRegistered(): ReturnType<SubmitFunction> {
    return async ({ result }) => {
      if (result.type !== 'success') {
        await applyAction(result);
        return;
      }
      registeredDismissed = true;
      await tick();
      titleHeading?.focus();
    };
  }

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
  const providerFormId = getUUID();

  /** The endpoint that starts the identity provider's flow. It is posted to under the page's locale, which it asks the provider to show its screens in. */
  const AUTHORIZE_ENDPOINT = `${API_ROOT}/oidc/authorize`;

  /** The entity types the provider's panel registers, in the order they are offered. Not empty while the provider's mode is listed. */
  const providerEntityTypes = $derived(identityProviderEntityTypes(contestantCtx.appSettings));

  /** The panel's sentence for each set of types it can register. */
  const PROVIDER_INTRO: Record<ServedEntityType | 'both', TranslationKey> = {
    candidate: 'contestantApp.register.identityProvider.intro.candidate',
    organization: 'contestantApp.register.identityProvider.intro.organization',
    both: 'contestantApp.register.identityProvider.intro.both'
  };

  /** The text of each type's option. */
  const TYPE_OPTION: Record<ServedEntityType, TranslationKey> = {
    candidate: 'contestantApp.register.identityProvider.types.candidate',
    organization: 'contestantApp.register.identityProvider.types.organization'
  };

  const providerIntro = $derived(t(PROVIDER_INTRO[providerEntityTypes.length === 1 ? providerEntityTypes[0] : 'both']));

  /** Whether the panel asks which type: only when it registers more than one. */
  const asksType = $derived(providerEntityTypes.length > 1);

  const typeErrorId = getUUID();
  let typeGroup: HTMLFieldSetElement | undefined = $state();
  /** The type chosen among several. Held here and not in the radios, which are removed with their panel. */
  let selectedType = $state<ServedEntityType>();
  let typeError = $state<string>();

  /** The type Continue sends: the one registered, else the chosen one while it is offered. */
  const providerEntityType = $derived.by(() => {
    if (!asksType) return providerEntityTypes[0];
    return selectedType && providerEntityTypes.includes(selectedType) ? selectedType : undefined;
  });

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
  /** Whether the identity provider's flow has been started and the page is being left. */
  let leaving = $state(false);

  /** How a panel's text is aligned: centred where the one panel stands alone on the page, and starting where the option's text starts inside an option's block. */
  const alignClass = $derived(listed.length === 1 ? 'text-center' : 'text-start');
  /** How a panel's sentence is set. */
  const sentenceClass = $derived(listed.length === 1 ? 'text-center' : 'text-start');

  /** The id of the open panel's form, which Continue submits. */
  const openFormId = $derived(
    mode === 'identity_provider'
      ? providerFormId
      : mode === 'email'
        ? emailFormId
        : mode === 'code'
          ? codeFormId
          : undefined
  );

  onMount(() => {
    mounted = true;
    const asked = page.url.searchParams.get('mode');
    const named = listed.find((listedMode) => listedMode === asked);
    if (listed.length > 1 && named) selected = named;
  });

  /**
   * Continue while no form is open, which is while no mode is chosen: it says to choose one.
   */
  function handleContinue(): void {
    if (requesting || checking || leaving) return;
    modesError = t('contestantApp.register.modes.required');
    selector?.focusFirst();
  }

  /**
   * Start the identity provider's flow for the panel's type. With several types and none chosen it sends nothing, says to choose one and moves focus to the first type. On the endpoint's answer the browser leaves for the provider, and the loading form is kept until it has. A refusal of the type and every other failure lead to the identity provider's error screen.
   */
  async function handleProviderSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (requesting || checking || leaving) return;
    const entityType = providerEntityType;
    if (asksType && !entityType) {
      typeError = t('contestantApp.register.identityProvider.types.required');
      typeGroup?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus();
      return;
    }
    leaving = true;
    const response = await fetch(localizeHref(AUTHORIZE_ENDPOINT), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entityType ? { entityType } : {})
    }).catch(() => undefined);
    const authorizeUrl = response?.ok
      ? await response
          .json()
          .then((body: { authorizeUrl?: unknown }) => body?.authorizeUrl)
          .catch(() => undefined)
      : undefined;
    if (typeof authorizeUrl === 'string' && authorizeUrl) {
      leaveFor(authorizeUrl);
      return;
    }
    const error = response?.status === 403 ? OIDC_ERROR.modeNotAllowed : OIDC_ERROR.registrationFailed;
    await goto(getRoute.current({ route: 'ContestantAppIdentityProviderError', error }));
  }

  /**
   * End the loading form when the page is shown again from the browser's page cache, as Back from the provider can do.
   */
  function handlePageShow(event: PageTransitionEvent): void {
    if (event.persisted) leaving = false;
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

<svelte:window onpageshow={handlePageShow} />

<MainContent
  title={t('contestantApp.register.title')}
  data-testid="contestant-register"
  data-modes={listed.join(' ')}
  data-mode-selected={mode ?? ''}
  data-register-state={checking ? 'checking' : 'idle'}>
  {#snippet hero()}
    <figure role="presentation">
      <HeroEmoji emoji={t('contestantApp.register.heroEmoji')} />
    </figure>
  {/snippet}

  {#snippet heading()}
    <HeadingGroup>
      <PreHeading>{contestantAppName}</PreHeading>
      <h1 tabindex="-1" bind:this={titleHeading}>{t('contestantApp.register.title')}</h1>
    </HeadingGroup>
  {/snippet}

  {#if showsRegisteredNotice}
    <section
      aria-labelledby={registeredNoticeTitleId}
      class="bg-base-100 gap-md p-lg flex w-full flex-col rounded-lg"
      data-testid="contestant-register-registered-notice">
      <h2 id={registeredNoticeTitleId}>{t('contestantApp.register.registeredNotice.title')}</h2>
      <p>{t('contestantApp.register.registeredNotice.content')}</p>
      <div class="gap-sm flex flex-col items-center">
        <Button
          href={getRoute.current('ContestantAppLogin')}
          variant="main"
          text={t('common.login')}
          data-testid="contestant-register-registered-notice-login" />
        <Button
          href={getRoute.current('ContestantAppForgotPassword')}
          text={t('contestantApp.login.forgotPassword')}
          data-testid="contestant-register-registered-notice-forgot-password" />
        <form method="POST" action="?/dismissRegistered" use:enhance={handleDismissRegistered}>
          <Button type="submit" text={t('common.close')} data-testid="contestant-register-registered-notice-dismiss" />
        </form>
      </div>
    </section>
  {/if}

  <RegistrationModeSelector modes={listed} bind:selected bind:error={modesError} bind:this={selector}>
    {#snippet panel(panelMode)}
      {#if panelMode === 'identity_provider'}
        <form
          id={providerFormId}
          method="POST"
          novalidate
          onsubmit={handleProviderSubmit}
          class="gap-md flex w-full flex-col"
          data-testid="register-identity-provider-form"
          data-entity-types={providerEntityTypes.join(' ')}>
          <p class={sentenceClass}>{providerIntro}</p>
          {#if asksType}
            <fieldset
              bind:this={typeGroup}
              class="gap-md flex w-full min-w-0 flex-col"
              aria-describedby={typeError ? typeErrorId : undefined}
              data-testid="register-entity-types">
              <legend class="mb-sm {alignClass} font-bold">
                {t('contestantApp.register.identityProvider.types.legend')}
              </legend>
              {#each providerEntityTypes as entityType (entityType)}
                <Radio
                  bind:group={selectedType}
                  name="entityType"
                  value={entityType}
                  label={t(TYPE_OPTION[entityType])}
                  data-testid="register-entity-type-input"
                  data-entity-type={entityType}
                  onchange={() => (typeError = undefined)} />
              {/each}
              {#if typeError}
                <ErrorMessage
                  inline
                  message={typeError}
                  id={typeErrorId}
                  role="alert"
                  data-testid="register-entity-types-error" />
              {/if}
            </fieldset>
          {/if}
          <p class="small-info {sentenceClass}">{t('contestantApp.register.identityProvider.redirectInfo')}</p>
        </form>
      {:else if panelMode === 'email'}
        <form
          id={emailFormId}
          method="POST"
          novalidate
          onsubmit={handleEmailSubmit}
          class="gap-md flex w-full flex-col">
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
        <form id={codeFormId} method="POST" novalidate onsubmit={handleCodeSubmit} class="gap-md flex w-full flex-col">
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
        loading={requesting || checking || leaving}
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
