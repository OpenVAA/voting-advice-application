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

  let canSubmit = false;
  let currentPassword = '';
  let isNewPasswordValid: boolean;
  let password = '';
  let reset: () => void;
  let status: ActionStatus = 'idle';
  let submitLabel: string;
  let validationError: string | undefined;

  $: canSubmit = status !== 'loading' && isNewPasswordValid && !!password;
  $: submitLabel = validationError || $t('candidateApp.settings.password.update');

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
    reset();
  }

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-200' } });
  const subheadingClass = 'text-lg mt-lg mb-md mx-md';
</script>

<MainContent title={$t('candidateApp.settings.title')}>
  <div class="text-center">
    <p>{$t('candidateApp.settings.ingress')}</p>
  </div>

  <!-- Immutable data -->

  <section class="mt-lg">
    <Input
      type="text"
      label={$t('common.email')}
      info={$t('candidateApp.settings.emailDescription')}
      value={$userData?.user.email}
      onShadedBg
      locked />
  </section>

  <!-- Editable data -->

  <section class="self-stretch">
    <!-- Stashed language selector -->

    <!-- <div class="mt-16 w-full">
      <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
        <div class="flex items-center justify-between bg-base-100 px-4">
          <label for="language" class={labelClass}>
            {$t('candidateApp.settings.language')}
          </label>
          <div class="w-6/12 text-right text-secondary">
            <select
              id="language"
              class="select select-sm w-6/12 text-primary"
              on:change={handleLanguageSelect}
              bind:value={appLanguageCode}>
              {#each $allLanguages ?? [] as option}
                <option
                  value={option.attributes.localisationCode}
                  selected={option.attributes.localisationCode === appLanguageCode}>
                  {$t(assertTranslationKey(`xxx.languages.${option.attributes.name}`))}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>
      <p class={disclaimerClass}>
        {$t('candidateApp.settings.languageDescription')}
      </p>
    </div>

    {#if languageErrorMessage}
      <p class="mb-0 mt-16 text-center text-error">
        {languageErrorMessage}
      </p>
    {/if}

    -->

    <h2 class={subheadingClass}>{$t('candidateApp.settings.password.update')}</h2>

    <div class="flex flex-col gap-md">
      <!-- <p class="mx-md my-0">{$t('candidateApp.settings.password.currentDescription')}</p> -->

      <div class="w-full">
        <label for="currentPassword" class="mx-md my-2 px-0">
          {$t('candidateApp.settings.password.current')}
        </label>
        <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
          <PasswordField
            id="currentPassword"
            bind:password={currentPassword}
            externalLabel={true}
            autocomplete="current-password" />
        </div>
      </div>

      <div class="flex-nowarp flex flex-col items-center">
        <PasswordSetter bind:valid={isNewPasswordValid} bind:errorMessage={validationError} bind:password bind:reset />

        {#if status === 'error'}
          <ErrorMessage inline message={$t('candidateApp.settings.error.changePassword')} class="mb-lg mt-md" />
        {:else if status === 'success'}
          <SuccessMessage inline message={$t('candidateApp.settings.password.updated')} class="mb-lg mt-md" />
        {/if}

        <Button on:click={handleSubmit} disabled={!canSubmit} variant="main" text={submitLabel} />

        <Button
          href={$getRoute('CandAppHelp')}
          text={$t('candidateApp.common.contactSupport')}
          disabled={status === 'success'} />
      </div>
    </div>
  </section>

  <!-- Submit button and error messages -->

  <svelte:fragment slot="primaryActions">
    <div class="grid w-full justify-items-center">
      <Button
        text={$t('common.return')}
        href={$getRoute('CandAppHome')}
        icon="previous"
        iconPos="left"
        variant="prominent" />
    </div>
  </svelte:fragment>
</MainContent>
