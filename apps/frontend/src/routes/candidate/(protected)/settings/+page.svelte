<!--@component

# Candidate app settings page

Shows the candidate's user settings.

### Settings

- `entities.hideIfMissingAnswers.candidate`: Affects message shown.
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { PasswordSetter } from '$candidate/components/passwordSetter';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Input } from '$lib/components/input';
  import SuccessMessage from '$lib/components/successMessage/SuccessMessage.svelte';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { getRoute, setPassword, t, userData } = getCandidateContext();
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
  let submitLabel = $derived(validationError || t('candidateApp.settings.password.update'));

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

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-200' } });
  const subheadingClass = 'text-lg mt-lg mb-md mx-md';
</script>

<MainContent title={t('candidateApp.settings.title')}>
  <div class="text-center">
    <p>{t('candidateApp.settings.ingress')}</p>
  </div>

  <!-- Immutable data -->

  <section class="mt-lg">
    <Input
      type="text"
      label={t('common.email')}
      info={t('candidateApp.settings.emailDescription')}
      value={userData.current?.user.email}
      onShadedBg
      locked
      data-testid="settings-email" />
  </section>

  <!-- Editable data -->

  <section class="self-stretch">
    <h2 class={subheadingClass}>{t('candidateApp.settings.password.update')}</h2>

    <div class="gap-md flex flex-col">
      <div class="flex-nowarp flex flex-col items-center" data-testid="settings-new-password">
        <!-- bind: keep — PasswordSetter.password is $bindable(''); bind:this is the component reference handleSubmit calls reset() on. Validity and the error message are derived inside the component and arrive through onValidityChange, so neither is bindable. -->
        <PasswordSetter
          bind:password
          bind:this={passwordSetterRef}
          onValidityChange={({ valid, errorMessage }) => {
            isNewPasswordValid = valid;
            validationError = errorMessage;
          }} />

        {#if status === 'error'}
          <ErrorMessage inline message={t('candidateApp.settings.error.changePassword')} class="mb-lg mt-md" />
        {:else if status === 'success'}
          <SuccessMessage inline message={t('candidateApp.settings.password.updated')} class="mb-lg mt-md" />
        {/if}

        <Button
          onclick={handleSubmit}
          disabled={!canSubmit}
          variant="main"
          text={submitLabel}
          data-testid="settings-update-password" />

        <Button
          href={getRoute.current('CandAppHelp')}
          text={t('candidateApp.common.contactSupport')}
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
        href={getRoute.current('CandAppHome')}
        icon="previous"
        iconPos="left"
        variant="prominent"
        data-testid="settings-return" />
    </div>
  {/snippet}
</MainContent>
