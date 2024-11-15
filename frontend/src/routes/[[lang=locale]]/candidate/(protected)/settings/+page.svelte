<script lang="ts">
  import { validatePassword } from '@openvaa/app-shared';
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { PasswordValidator } from '$candidate/components/passwordValidator';
  import { changePassword, getLanguages, updateAppLanguage } from '$lib/legacy-api/candidate';
  import { PasswordField } from '$lib/candidate/components/passwordField';
  import { Button } from '$lib/components/button';
  import { Icon } from '$lib/components/icon';
  import { t } from '$lib/i18n';
  import { assertTranslationKey } from '$lib/i18n/utils/assertTranslationKey';
  import { BasicPage } from '$lib/templates/basicPage';
  import { getRoute } from '$lib/utils/legacy-navigation';
  import type { StrapiLanguageData } from '$lib/legacy-api/dataProvider/strapi';
  import type { Language } from '$lib/types/candidateAttributes';
  import type { CandidateContext } from '$lib/utils/legacy-candidateContext';

  const { user, loadUserData } = getContext<CandidateContext>('candidate');

  // TODO: consider refactoring this as this uses same classes as profile/+page.svelte?
  const labelClass = 'w-6/12 label-sm label mx-6 my-2 text-secondary';
  const disclaimerClass = 'mx-6 my-0 p-0 text-sm text-secondary';
  const headerClass = 'uppercase mx-6 my-0 p-0 text-m text-secondary';
  const inputClass = 'input-ghost input input-sm w-full pr-2 text-right disabled:border-none disabled:bg-base-100';

  let currentPassword = '';
  let password = '';
  let passwordConfirmation = '';
  let validPassword = false;
  let errorMessage = '';
  let successMessage = '';
  let languageErrorMessage = '';

  $: disableSetButton = !validPassword || passwordConfirmation.length === 0;

  // Variable for the user's chosen app language. Keep it updated if changed.
  $: appLanguageCode = $user?.candidate?.appLanguage?.localisationCode;

  // Fetch languages from backend
  let allLanguages: Array<StrapiLanguageData> | undefined;
  getLanguages().then((languages) => (allLanguages = languages));

  // Handle the change when the app language is changed
  async function handleLanguageSelect(e: Event) {
    languageErrorMessage = '';

    const chosenLanguage = allLanguages
      ? allLanguages.find((lang) => lang.attributes.localisationCode === (e.target as HTMLSelectElement).value)
      : undefined;

    if (chosenLanguage) {
      const languageObj: Language = {
        id: chosenLanguage?.id,
        localisationCode: chosenLanguage?.attributes?.localisationCode,
        name: chosenLanguage?.attributes?.name
      };

      try {
        await updateAppLanguage(languageObj);
        await loadUserData(); // Reload user data so it's up to date
        await goto($getRoute({ locale: languageObj.localisationCode })); // Change page language to the chosen one
      } catch {
        languageErrorMessage = $t('candidateApp.settings.error.changeLanguage');
      }
    }
  }

  async function onButtonPress() {
    successMessage = '';

    if (password !== passwordConfirmation) {
      errorMessage = $t('candidateApp.settings.password.dontMatch');
      return;
    }

    if (currentPassword === password) {
      errorMessage = $t('candidateApp.settings.password.areSame');
      return;
    }

    // Additional check before backend validation
    if (!validatePassword(password)) {
      errorMessage = $t('candidateApp.settings.password.notValid');
      return;
    }

    const response = await changePassword(currentPassword, password);
    // Ideally, we would also want to check if the current password was wrong, but Strapi does not return this information :/
    if (!response?.ok) {
      errorMessage = $t('candidateApp.settings.error.changePassword');
      return;
    }

    // Clear fields on success
    currentPassword = '';
    password = '';
    passwordConfirmation = '';

    errorMessage = '';
    successMessage = $t('candidateApp.settings.password.updated');
  }
</script>

<BasicPage title={$t('candidateApp.settings.title')} mainClass="bg-base-200">
  <div class="text-center">
    <p>{$t('candidateApp.settings.ingress')}</p>
  </div>

  <div class="mt-16 w-full">
    <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
      <div class="flex items-center justify-between bg-base-100 px-4">
        <label for="email" class={labelClass}>
          {$t('candidateApp.common.email')}
        </label>
        <div class="w-6/12 text-right text-secondary">
          <input disabled type="text" id="email" value={$user?.email} class={inputClass} />
        </div>
        <Icon name="locked" class="text-secondary" />
      </div>
    </div>
    <p class={disclaimerClass}>
      {$t('candidateApp.settings.emailDescription')}
    </p>
  </div>

  <div class="mt-16 w-full">
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
            {#each allLanguages ?? [] as option}
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

  <!-- TODO: save settings button -->
  <!-- TODO: discard button -->

  <div class="mt-32 w-full">
    <p class={headerClass}>
      {$t('candidateApp.settings.password.title')}
    </p>
  </div>

  <form class="flex-nowarp flex w-full flex-col items-center" on:submit|preventDefault={onButtonPress}>
    <div class="w-full">
      <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
        <div class="flex items-center justify-between bg-base-100">
          <label for="currentPassword" class={labelClass}>
            {$t('candidateApp.settings.password.current')}
          </label>
          <div class="w-6/12 text-right text-secondary">
            <PasswordField
              id="currentPassword"
              bind:password={currentPassword}
              externalLabel={true}
              autocomplete="current-password" />
          </div>
        </div>
      </div>
      <p class={disclaimerClass}>
        {$t('candidateApp.settings.password.currentDescription')}
      </p>
    </div>

    <PasswordValidator bind:validPassword {password} />

    <div class="w-full">
      <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
        <div class="flex items-center justify-between bg-base-100">
          <label for="newPassword" class={labelClass}>
            {$t('candidateApp.settings.password.new')}
          </label>
          <div class="w-6/12 text-right text-secondary">
            <PasswordField id="newPassword" bind:password externalLabel={true} autocomplete="new-password" />
          </div>
        </div>
      </div>
    </div>

    <div class="w-full">
      <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
        <div class="flex items-center justify-between bg-base-100">
          <label for="newPasswordConfirmation" class={labelClass}>
            {$t('candidateApp.settings.password.newConfirmation')}
          </label>
          <div class="w-6/12 text-right text-secondary">
            <PasswordField
              id="newPasswordConfirmation"
              bind:password={passwordConfirmation}
              externalLabel={true}
              autocomplete="new-password" />
          </div>
        </div>
      </div>
    </div>

    <Button
      type="submit"
      variant="main"
      disabled={disableSetButton}
      class="my-10"
      text={$t('candidateApp.settings.password.update')} />

    {#if errorMessage}
      <p class="text-center text-error">
        {errorMessage}
      </p>
    {/if}

    {#if successMessage}
      <p class="mt-2 text-center text-success">
        {successMessage}
      </p>
    {/if}
  </form>
</BasicPage>
