<svelte:options runes />

<!--@component

# Candidate app settings page

Shows the candidate's user settings.

### Settings

- `entities.hideIfMissingAnswers.candidate`: Affects message shown.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { PasswordSetter } from '$candidate/components/passwordSetter';
  import { PasswordField } from '$lib/candidate/components/passwordField';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Input } from '$lib/components/input';
  import SuccessMessage from '$lib/components/successMessage/SuccessMessage.svelte';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { logDebugError } from '$lib/utils/logger';
  import MainContent from '../../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { getRoute, setPassword, t, userData } = getCandidateContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Handle password change
  ////////////////////////////////////////////////////////////////////

  let currentPassword = $state('');
  let isNewPasswordValid = $state(false);
  let password = $state('');
  let passwordSetterRef: { reset: () => void };
  let status = $state<ActionStatus>('idle');
  let validationError = $state<string | undefined>(undefined);

  let canSubmit = $derived(status !== 'loading' && isNewPasswordValid && !!password);
  let submitLabel = $derived(validationError || t('candidateApp.settings.password.update'));

  async function handleSubmit(): Promise<void> {
    if (!canSubmit) {
      logDebugError('HandleSubmit called when canSubmit is false');
      return undefined;
    }
    status = 'loading';

    const result = await setPassword({ currentPassword, password }).catch((e) => {
      logDebugError(`Error with register: ${e?.message}`);
      return undefined;
    });

    if (result?.type !== 'success') {
      status = 'error';
      return;
    }

    status = 'success';
    // Clear fields on success
    currentPassword = '';
    passwordSetterRef?.reset();
  }

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-200' } });
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
      value={$userData?.user.email}
      onShadedBg
      locked
      data-testid="settings-email" />
  </section>

  <!-- Editable data -->

  <section class="self-stretch">

    <h2 class={subheadingClass}>{t('candidateApp.settings.password.update')}</h2>

    <div class="gap-md flex flex-col">
      <!-- <p class="mx-md my-0">{t('candidateApp.settings.password.currentDescription')}</p> -->

      <div class="w-full" data-testid="settings-current-password">
        <label for="currentPassword" class="mx-md my-2 px-0">
          {t('candidateApp.settings.password.current')}
        </label>
        <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
          <PasswordField
            id="currentPassword"
            bind:password={currentPassword}
            externalLabel={true}
            autocomplete="current-password" />
        </div>
      </div>

      <div class="flex-nowarp flex flex-col items-center" data-testid="settings-new-password">
        <PasswordSetter
          bind:valid={isNewPasswordValid}
          bind:errorMessage={validationError}
          bind:password
          bind:this={passwordSetterRef}
          confirmPasswordTestId="settings-confirm-password" />

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
          href={$getRoute('CandAppHelp')}
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
        href={$getRoute('CandAppHome')}
        icon="previous"
        iconPos="left"
        variant="prominent"
        data-testid="settings-return" />
    </div>
  {/snippet}
</MainContent>
