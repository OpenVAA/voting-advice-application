<!--
@component Ask a signed-in user whose account an identity provider made for what the account still lacks: an email address to sign in with next time and, for a party the identity registered, the party's name. A returning user is told that they have already registered; one whose address awaits its link sees that address, with a button for sending the link again and another for giving another address; one whose address is proved is reminded to sign in with it next time. A button for continuing and another for logging out end every variant.

What is shown follows from the user-level data, the answers lock and the arrival marker of the page's data, and nothing else:

- With no address, the email form, under the title "Complete your registration", or "You have already registered" when the marker says the identity was found. When the address the user gave earlier is now another account's, a notice of that leads the form.
- With an unnamed party, while answers are not locked, the party's name and abbreviation, before the address when one is asked for and alone otherwise.
- With an address awaiting its link and nothing else to ask, that address, "Send again" and "Use another email address", which replaces the address by the email form in place.
- With a proved address and nothing else to ask, that address.

Continue with a form sends nothing while a field is in error: it says what is wrong at each field and moves focus to the first, the name before the address. Otherwise it saves the names and records the address, which is mailed a link to confirm it, and reruns the page's loads, so the next gate or the page the user asked for replaces this view without waiting for the link. An address another account holds is told at the address field; any other failure is told under the form, and what was typed is kept. Continue with nothing to ask clears the arrival notice and reruns the loads.

"Send again" mails the link once more. It is available on arrival, and after a press unavailable until a count of `RESEND_WAIT_SECONDS` from the request's settlement has ended.

The view cannot be put aside: only a rerun load that reads an address or a name removes it. Logging out is always available and asks nothing.

### Dynamic component

Accesses `ContestantContext`: `user`, `answersLocked`, `logout` and `t`. Reads `arrival` from the page's data. Posts to `UNIVERSAL_API_ROUTES.identityProviderRegistration`.

### Properties

None.

### Accessibility

- The title is the page's first-level heading and can take focus, so the layout can move focus to it when this view replaces another.
- Every control is labelled. The name's required locale is named in its description, and its error is an alert that describes the control. The address fields' messages are those of `EmailEntry`.
- An address is a `<dd>` under its label, so it is announced with the label. It is never hyphenated or translated, and it wraps at any character rather than overflowing.
- The main button stands outside the form and submits it, so Enter in a field does the same as a press. It is unavailable until the view's script runs, and from a press until the next view is shown. A failed save is announced as an alert, and focus stays on the button.
- "Send again" keeps focus when pressed. While unavailable it is `aria-disabled`, still a tab stop, and its label ends with the seconds left, which also describe it. A polite status region says when a new email has been asked for and when another can be asked for.

### Usage

```tsx
<IdentityProviderGate />
```
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { onMount, tick } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { EmailEntry } from '$contestant/components/emailEntry';
  import { EmailSentResend } from '$contestant/components/emailSentPanel';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Input } from '$lib/components/input';
  import { hasDefaultLocaleName } from '$lib/contestant/utils/identityProviderAccount';
  import { requiredNameLocale } from '$lib/contestant/utils/nameRule';
  import {
    PendingAddressResend,
    postIdentityProviderRegistration
  } from '$lib/contestant/utils/pendingAddressResend.svelte';
  import { getContestantContext } from '$lib/contexts/contestant/contestantContext.svelte';
  import { assertTranslationKey } from '$lib/i18n/utils';
  import { getUUID } from '$lib/utils/components';
  import { isBlankText } from '$lib/utils/localizedText';
  import type { LocalizedString } from '@openvaa/app-shared';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // user and answersLocked are reactive accessors: read via contestantCtx.X in each tracking scope, never destructured.
  const contestantCtx = getContestantContext();
  const { logout, t } = contestantCtx;

  ////////////////////////////////////////////////////////////////////
  // What the view asks for
  ////////////////////////////////////////////////////////////////////

  /** The arrival marker as the gated load returns it: `created` for an identity just registered, `existing` for one found. */
  const arrival = $derived.by((): 'created' | 'existing' | null => {
    const value: unknown = page.data.arrival;
    return value === 'created' || value === 'existing' ? value : null;
  });

  const addressState = $derived(contestantCtx.user?.addressState ?? 'none');
  const returning = $derived(arrival === 'existing');

  /** Whether the user chose to give another address in place of the one awaiting its link. */
  let switched = $state(false);

  const asksName = $derived(!!contestantCtx.user?.ownOrganizationUnnamed && !contestantCtx.answersLocked);
  const asksEmail = $derived(addressState === 'none' || (addressState === 'pending' && switched));
  const hasForm = $derived(asksName || asksEmail);
  /** The address the view shows with its label, when there is nothing to ask for. */
  const shownAddress = $derived.by((): { label: string; address: string } | undefined => {
    if (hasForm) return undefined;
    const user = contestantCtx.user;
    if (addressState === 'pending' && user?.pendingEmail)
      return { label: t('contestantApp.identityProvider.awaitingConfirmation'), address: user.pendingEmail };
    if (addressState === 'proved' && user?.email)
      return { label: t('contestantApp.identityProvider.signInEmail'), address: user.email };
    return undefined;
  });
  const waitsForLink = $derived(!hasForm && addressState === 'pending');

  const asks = $derived([asksName ? 'name' : '', asksEmail ? 'email' : ''].filter(Boolean).join(' '));

  const title = $derived(
    returning
      ? t('contestantApp.identityProvider.title.alreadyRegistered')
      : t('contestantApp.identityProvider.title.complete')
  );

  const lead = $derived.by(() => {
    if (addressState === 'none' && contestantCtx.user?.pendingEmailTaken)
      return t('contestantApp.identityProvider.emailTakenNotice');
    if (asksName && addressState !== 'none') return t('contestantApp.identityProvider.nameIntro');
    if (addressState === 'pending') return t('contestantApp.identityProvider.alreadyRegistered.pending');
    if (addressState === 'proved') return t('contestantApp.identityProvider.alreadyRegistered.proved');
    return returning
      ? t('contestantApp.identityProvider.alreadyRegistered.none')
      : t('contestantApp.identityProvider.identified');
  });

  ////////////////////////////////////////////////////////////////////
  // The form
  ////////////////////////////////////////////////////////////////////

  const formId = getUUID();
  const entryId = getUUID();
  const nameId = getUUID();
  const nameNoteId = `${nameId}-note`;
  const nameErrorId = `${nameId}-required`;

  /** The locale the party's name must have text in. */
  const defaultLocale = requiredNameLocale();

  let entry: EmailEntry | undefined = $state();
  let email = $state('');
  let name = $state<LocalizedString>({});
  let shortName = $state<LocalizedString>({});
  let nameError = $state<string>();

  let status = $state<'idle' | 'saving' | 'failed'>('idle');
  let loggingOut = $state(false);
  let mounted = $state(false);

  /** A name's entries that hold text, or `undefined` when none does. */
  function filledEntries(value: LocalizedString): LocalizedString | undefined {
    const filled = Object.fromEntries(Object.entries(value).filter(([, text]) => !isBlankText(text)));
    return Object.keys(filled).length ? filled : undefined;
  }

  function handleNameChange(value: unknown): void {
    name = { ...(value as LocalizedString) };
    if (nameError && hasDefaultLocaleName(name, defaultLocale)) nameError = undefined;
  }

  function handleShortNameChange(value: unknown): void {
    shortName = { ...(value as LocalizedString) };
  }

  /** Rerun the page's loads. Awaited so that the main button keeps its saving state until the page has its new data; only the rerun load removes this view. */
  async function rerun(): Promise<void> {
    try {
      await invalidateAll();
    } catch (error) {
      log.error('Failed to rerun the loads after the identity-provider registration was saved', { err: error });
    }
  }

  /** Mark the request failed and give focus back to the element that had it, when the saving state took it away. */
  async function fail(focused: Element | null): Promise<void> {
    status = 'failed';
    await tick();
    if (focused instanceof HTMLElement && document.activeElement === document.body) focused.focus();
  }

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (status === 'saving') return;
    status = 'idle';

    const nameMissing = asksName && !hasDefaultLocaleName(name, defaultLocale);
    nameError = nameMissing
      ? t('contestantApp.identityProvider.nameRequired', {
          language: t(assertTranslationKey(`lang.${defaultLocale}`))
        })
      : undefined;
    // `validate` shows the address fields' messages and focuses the first of them; the name's control, which comes first, takes focus after it.
    const emailValid = asksEmail ? (entry?.validate() ?? false) : true;
    if (nameMissing) {
      await tick();
      document.getElementById(`${nameId}-${defaultLocale}`)?.focus();
    }
    if (nameMissing || !emailValid) return;

    // The main button is natively disabled while the save runs, and a browser may drop the focus of a button that becomes disabled.
    const focused = document.activeElement;
    status = 'saving';
    const body: Record<string, unknown> = { intent: 'save' };
    if (asksName) {
      body.name = filledEntries(name);
      const short = filledEntries(shortName);
      if (short) body.shortName = short;
    }
    if (asksEmail) body.email = email;

    const result = await postIdentityProviderRegistration(body);
    if (result === 'saved') {
      await rerun();
      status = 'idle';
    } else if (result === 'in-use') {
      status = 'idle';
      await tick();
      entry?.showEmailError(t('contestantApp.identityProvider.emailInUse'));
    } else {
      await fail(focused);
    }
  }

  async function handleContinue(): Promise<void> {
    if (status === 'saving') return;
    const focused = document.activeElement;
    status = 'saving';
    if ((await postIdentityProviderRegistration({ intent: 'acknowledge' })) === 'acknowledged') {
      await rerun();
      status = 'idle';
    } else {
      await fail(focused);
    }
  }

  async function handleChangeAddress(): Promise<void> {
    switched = true;
    await tick();
    document.getElementById(`${entryId}-email`)?.focus();
  }

  async function handleLogout(): Promise<void> {
    loggingOut = true;
    try {
      await logout();
    } catch (e) {
      log.error(`Error logging out: ${(e as Error)?.message ?? '-'}`);
    } finally {
      loggingOut = false;
    }
  }

  ////////////////////////////////////////////////////////////////////
  // Send again
  ////////////////////////////////////////////////////////////////////

  /** The request for the link and the count of `RESEND_WAIT_SECONDS` that runs from its settlement. */
  const resend = new PendingAddressResend();

  const resendStatus = $derived(
    resend.status === 'requested'
      ? t('contestantApp.emailSent.resendRequested')
      : resend.status === 'ready'
        ? t('contestantApp.emailSent.resendReady')
        : ''
  );

  onMount(() => {
    mounted = true;
    resend.start();
    return () => resend.stop();
  });
</script>

{#snippet createdHero()}
  <figure role="presentation">
    <HeroEmoji emoji={t('contestantApp.identityProvider.heroEmoji')} />
  </figure>
{/snippet}

<MainContent
  {title}
  hero={arrival === 'created' ? createdHero : undefined}
  data-testid="contestant-identity-provider-gate"
  data-variant={returning ? 'returning' : 'new'}
  data-address-state={addressState}
  data-asks={asks}
  data-gate-state={status}>
  <p class="text-center" data-testid="identity-provider-gate-lead">{lead}</p>

  {#if shownAddress}
    <dl class="my-lg text-center">
      <dt class="small-label">{shownAddress.label}</dt>
      <dd
        class="font-bold [overflow-wrap:anywhere] hyphens-none"
        translate="no"
        data-testid="identity-provider-gate-address">
        {shownAddress.address}
      </dd>
    </dl>
  {/if}

  {#if hasForm}
    <form id={formId} method="POST" novalidate onsubmit={handleSubmit} class="gap-md flex w-full flex-col">
      {#if asksName}
        <p class="text-center" id={nameNoteId}>
          {t('dynamic.contestantAppBasicInfo.identity.name.editable.organization')}
        </p>
        <Input
          type="text-multilingual"
          id={nameId}
          label={t('common.name')}
          multilingualInfo=""
          required
          requiredLocale={defaultLocale}
          aria-describedby={nameError ? `${nameNoteId} ${nameErrorId}` : nameNoteId}
          containerProps={{ 'data-testid': 'identity-provider-gate-name' }}
          onChange={handleNameChange} />
        {#if nameError}
          <ErrorMessage
            inline
            id={nameErrorId}
            role="alert"
            message={nameError}
            data-testid="identity-provider-gate-name-error" />
        {/if}
        <Input
          type="text-multilingual"
          label={t('common.shortName')}
          info={t('contestantApp.basicInfo.shortNameInfo')}
          multilingualInfo=""
          aria-describedby={nameNoteId}
          containerProps={{ 'data-testid': 'identity-provider-gate-short-name' }}
          onChange={handleShortNameChange} />
      {/if}
      {#if asksEmail}
        <p class="text-center">{t('contestantApp.identityProvider.emailIntro')}</p>
        <EmailEntry id={entryId} bind:email bind:this={entry} />
      {/if}
    </form>
  {/if}

  {#if waitsForLink}
    <div class="flex w-full flex-col items-center">
      <EmailSentResend
        secondsLeft={resend.secondsLeft}
        loading={resend.requesting}
        onresend={() => resend.resend()}
        resendTestId="identity-provider-gate-resend"
        countdownTestId="identity-provider-gate-countdown" />
      <Button
        type="button"
        text={t('contestantApp.emailSent.changeAddress')}
        onclick={handleChangeAddress}
        data-testid="identity-provider-gate-change-address" />
    </div>
  {/if}

  {#if addressState === 'pending'}
    <p class="sr-only" role="status" aria-live="polite" data-testid="identity-provider-gate-status">
      {resendStatus}
    </p>
  {/if}

  {#if status === 'failed'}
    <ErrorMessage
      inline
      role="alert"
      class="my-md"
      message={t('contestantApp.identityProvider.saveFailed')}
      data-testid="identity-provider-gate-error" />
  {/if}

  {#snippet primaryActions()}
    {#if hasForm}
      <Button
        type="submit"
        form={formId}
        variant="main"
        text={t('common.continue')}
        disabled={!mounted}
        loading={status === 'saving'}
        loadingText={t('common.saving')}
        data-testid="identity-provider-gate-submit" />
    {:else}
      <Button
        type="button"
        variant="main"
        text={t('common.continue')}
        disabled={!mounted}
        loading={status === 'saving'}
        onclick={handleContinue}
        data-testid="identity-provider-gate-submit" />
    {/if}
    <Button
      color="warning"
      text={t('common.logout')}
      loading={loggingOut}
      onclick={handleLogout}
      data-testid="identity-provider-gate-logout" />
  {/snippet}
</MainContent>
