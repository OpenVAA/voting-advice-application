<!--@component

# Contestant app settings page

The signed-in user's own settings page: the account's address, which cannot be edited here, and the form that changes the password. It belongs to the user and not to an entity, so it sits at the app's root and is reached from every state: by a user with no entity, with one and with several alike. The protected layout's gates decide it as they decide every protected page. Return leads to the app's root.

### The address

- For an account whose address is proved, the address is shown in a locked field with the sentence that says what it is used for, and the change-password form is given it as its user name.
- For an account an identity provider made, whose typed address awaits the link mailed to it, the locked field holds that pending address with the sentence that it has not been confirmed yet and that until the link is opened the user signs in with Bank ID. Under it "Send again" mails the link once more, and "Use another email address" shows the address and its confirmation in place, with a button that saves them. A saved address replaces the pending one and is mailed a link of its own; the loads then rerun and the field shows it. An address another account holds is told at the address field; any other failure is told under the fields, and what was typed is kept. The change-password form is given no user name, so a password manager is not handed the pending address.
- For an account with no address, the locked field is empty.

### Accessibility

- "Send again" keeps focus when pressed. While unavailable it is `aria-disabled`, still a tab stop, and its label ends with the seconds left, which also describe it. A polite status region says when a new email has been asked for and when another can be asked for.
- "Use another email address" moves focus to the address field it shows.
- A failed save is announced as an alert.
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { onMount, tick } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { EmailEntry } from '$contestant/components/emailEntry';
  import { EmailSentResend } from '$contestant/components/emailSentPanel';
  import { PasswordSetter } from '$contestant/components/passwordSetter';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Input } from '$lib/components/input';
  import SuccessMessage from '$lib/components/successMessage/SuccessMessage.svelte';
  import {
    PendingAddressResend,
    postIdentityProviderRegistration
  } from '$lib/contestant/utils/pendingAddressResend.svelte';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getUUID } from '$lib/utils/components';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const contestantCtx = getContestantContext();
  const { getRoute, setPassword, t } = contestantCtx;
  const { pageStyles } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // Handle password change
  ////////////////////////////////////////////////////////////////////

  let isNewPasswordValid = $state(false);
  let password = $state('');
  let passwordSetterRef: { reset: () => void };
  let status = $state<ActionStatus>('idle');
  let validationError = $state<string | undefined>(undefined);

  let canSubmit = $derived(status !== 'loading' && isNewPasswordValid && !!password);
  let submitLabel = $derived(validationError || t('contestantApp.settings.password.update'));

  async function handleSubmit(): Promise<void> {
    if (!canSubmit) {
      log.debug('HandleSubmit called when canSubmit is false');
      return undefined;
    }
    status = 'loading';

    const result = await setPassword({ password }).catch((e) => {
      log.error(`Error with register: ${e?.message}`);
      return undefined;
    });

    if (result?.type !== 'success') {
      status = 'error';
      return;
    }

    status = 'success';
    // Clear fields on success
    passwordSetterRef?.reset();
  }

  ////////////////////////////////////////////////////////////////////
  // The address awaiting its link
  ////////////////////////////////////////////////////////////////////

  // user is a reactive accessor: read via contestantCtx.user in each tracking scope, never destructured.
  const addressPending = $derived(contestantCtx.user?.addressState === 'pending' && !!contestantCtx.user.pendingEmail);

  const resend = new PendingAddressResend();
  const resendStatus = $derived(
    resend.status === 'requested'
      ? t('contestantApp.emailSent.resendRequested')
      : resend.status === 'ready'
        ? t('contestantApp.emailSent.resendReady')
        : ''
  );

  const emailFormId = getUUID();
  const emailEntryId = getUUID();
  /** Whether the user chose to give another address in place of the pending one. */
  let changingEmail = $state(false);
  let emailEntry: EmailEntry | undefined = $state();
  let newEmail = $state('');
  let emailStatus = $state<'idle' | 'saving' | 'failed'>('idle');
  let mounted = $state(false);

  async function handleChangeEmail(): Promise<void> {
    changingEmail = true;
    await tick();
    document.getElementById(`${emailEntryId}-email`)?.focus();
  }

  async function handleSaveEmail(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (emailStatus === 'saving') return;
    emailStatus = 'idle';
    if (!emailEntry?.validate()) return;
    emailStatus = 'saving';
    const result = await postIdentityProviderRegistration({ intent: 'save', email: newEmail });
    if (result === 'saved') {
      try {
        await invalidateAll();
      } catch (error) {
        log.error('Failed to rerun the loads after the address was saved', { err: error });
      }
      changingEmail = false;
      newEmail = '';
      emailStatus = 'idle';
    } else if (result === 'in-use') {
      emailStatus = 'idle';
      await tick();
      emailEntry?.showEmailError(t('contestantApp.identityProvider.emailInUse'));
    } else {
      emailStatus = 'failed';
    }
  }

  onMount(() => {
    mounted = true;
    resend.start();
    return () => resend.stop();
  });

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-200' } });
  const subheadingClass = 'text-lg mt-lg mb-md mx-md';
</script>

<MainContent title={t('contestantApp.settings.title')}>
  <div class="text-center">
    <p>{t('contestantApp.settings.ingress')}</p>
  </div>

  <!-- Immutable data -->

  <section class="mt-lg">
    <Input
      type="text"
      label={t('common.email')}
      info={addressPending
        ? t('contestantApp.settings.emailPendingInfo')
        : t('contestantApp.settings.emailDescription')}
      value={addressPending ? contestantCtx.user?.pendingEmail : contestantCtx.user?.email}
      onShadedBg
      locked
      data-testid="settings-email" />

    {#if addressPending}
      <div class="mt-md flex flex-col items-center">
        <EmailSentResend
          secondsLeft={resend.secondsLeft}
          loading={resend.requesting}
          onresend={() => resend.resend()}
          resendTestId="settings-email-pending-resend"
          countdownTestId="settings-email-pending-countdown" />
        {#if changingEmail}
          <form
            id={emailFormId}
            method="POST"
            novalidate
            onsubmit={handleSaveEmail}
            class="gap-md mt-md flex w-full flex-col">
            <EmailEntry id={emailEntryId} bind:email={newEmail} bind:this={emailEntry} />
            <Button
              type="submit"
              variant="main"
              text={t('contestantApp.settings.saveEmail')}
              disabled={!mounted}
              loading={emailStatus === 'saving'}
              loadingText={t('common.saving')}
              data-testid="settings-email-save" />
          </form>
          {#if emailStatus === 'failed'}
            <ErrorMessage
              inline
              role="alert"
              class="my-md"
              message={t('contestantApp.identityProvider.saveFailed')}
              data-testid="settings-email-error" />
          {/if}
        {:else}
          <Button
            type="button"
            text={t('contestantApp.emailSent.changeAddress')}
            onclick={handleChangeEmail}
            data-testid="settings-email-pending-change" />
        {/if}
        <p class="sr-only" role="status" aria-live="polite" data-testid="settings-email-pending-status">
          {resendStatus}
        </p>
      </div>
    {/if}
  </section>

  <!-- Editable data -->

  <section class="self-stretch">
    <h2 class={subheadingClass}>{t('contestantApp.settings.password.update')}</h2>

    <div class="gap-md flex flex-col">
      <div class="flex-nowarp flex flex-col items-center" data-testid="settings-new-password">
        <!-- bind: keep — PasswordSetter.password is $bindable(''); bind:this is the component reference handleSubmit calls reset() on. Validity and the error message are derived inside the component and arrive through onValidityChange, so neither is bindable. -->
        <PasswordSetter
          bind:password
          bind:this={passwordSetterRef}
          username={contestantCtx.user?.addressState === 'proved' ? contestantCtx.user.email : undefined}
          onValidityChange={({ valid, errorMessage }) => {
            isNewPasswordValid = valid;
            validationError = errorMessage;
          }} />

        {#if status === 'error'}
          <ErrorMessage inline message={t('contestantApp.settings.error.changePassword')} class="mb-lg mt-md" />
        {:else if status === 'success'}
          <SuccessMessage inline message={t('contestantApp.settings.password.updated')} class="mb-lg mt-md" />
        {/if}

        <Button
          onclick={handleSubmit}
          disabled={!canSubmit}
          variant="main"
          text={submitLabel}
          data-testid="settings-update-password" />

        <Button
          href={getRoute.current('ContestantAppHelp')}
          text={t('contestantApp.common.contactSupport')}
          disabled={status === 'success'}
          data-testid="settings-contact-support" />
      </div>
    </div>
  </section>

  <!-- Submit button and error messages -->

  {#snippet primaryActions()}
    <div class="grid w-full justify-items-center">
      <Button
        text={t('common.return')}
        href={getRoute.current('ContestantAppHome')}
        icon="previous"
        iconPos="left"
        variant="prominent"
        data-testid="settings-return" />
    </div>
  {/snippet}
</MainContent>
