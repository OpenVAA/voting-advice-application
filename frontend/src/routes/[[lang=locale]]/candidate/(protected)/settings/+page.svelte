<script lang="ts">
  import {t} from '$lib/i18n';
  import {BasicPage} from '$lib/templates/basicPage';
  import Icon from '$lib/components/icon/Icon.svelte';
  import {PasswordValidator} from '$candidate/components/passwordValidator';
  import {Button} from '$lib/components/button';
  import {validatePassword} from '$shared/utils/passwordValidation';
  import {changePassword} from '$lib/api/candidate';
  import PasswordField from '$lib/candidate/components/PasswordField/PasswordField.svelte';
  import {getContext} from 'svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';

  const {userStore} = getContext<CandidateContext>('candidate');
  $: user = $userStore;

  // TODO: consider refactoring this as this uses same classes as profile/+page.svelte?
  const labelClass = 'w-6/12 label-sm label mx-6 my-2 text-secondary';
  const disclaimerClass = 'mx-6 my-0 p-0 text-sm text-secondary';
  const headerClass = 'uppercase mx-6 my-0 p-0 text-m text-secondary';
  const inputClass =
    'input-ghost input input-sm w-full pr-2 text-right disabled:border-none disabled:bg-base-100';

  let currentPassword = '';
  let password = '';
  let passwordConfirmation = '';
  let validPassword = false;
  let errorMessage = '';
  let successMessage = '';

  $: disableSetButton = !validPassword || passwordConfirmation.length === 0;

  const onButtonPress = async () => {
    successMessage = '';

    if (password !== passwordConfirmation) {
      errorMessage = $t('candidateApp.settings.passwordsDontMatch');
      return;
    }

    if (currentPassword === password) {
      errorMessage = $t('candidateApp.settings.passwordIsTheSame');
      return;
    }

    // Additional check before backend validation
    if (!validatePassword(password)) {
      errorMessage = $t('candidateApp.settings.passwordNotValid');
      return;
    }

    const response = await changePassword(currentPassword, password);
    // Ideally, we would also want to check if the current password was wrong, but Strapi does not return this information :/
    if (!response?.ok) {
      errorMessage = $t('candidateApp.settings.changePasswordError');
      return;
    }

    errorMessage = '';
    successMessage = $t('candidateApp.settings.passwordUpdated');
  };
</script>

<BasicPage title={$t('candidateApp.settings.title')} mainClass="bg-base-200">
  <div class="text-center">
    <p>{$t('candidateApp.settings.instructions')}</p>
  </div>

  <div class="mt-16 w-full">
    <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
      <div class="flex items-center justify-between bg-base-100 px-4">
        <label for="email" class={labelClass}>
          {$t('candidateApp.settings.fields.email')}
        </label>
        <div class="w-6/12 text-right text-secondary">
          <input disabled type="text" id="email" value={user?.email} class={inputClass} />
        </div>
        <Icon name="locked" class="text-secondary" />
      </div>
    </div>
    <p class={disclaimerClass}>
      {$t('candidateApp.settings.emailDescription')}
    </p>
  </div>

  <!-- TODO: this is a placeholder for the future i18n support, @see https://github.com/OpenVAA/voting-advice-application/issues/202 -->
  <div class="mt-16 w-full">
    <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
      <div class="flex items-center justify-between bg-base-100 px-4">
        <label for="language" class={labelClass}>
          {$t('candidateApp.settings.fields.language')}
        </label>
        <div class="w-6/12 text-right text-secondary">
          <select id="language" class="select select-sm w-6/12 text-primary">
            <!-- TODO: fetch the locales from somewhere when implementing proper i18n support here -->
            <option value="english">English</option>
          </select>
        </div>
      </div>
    </div>
    <p class={disclaimerClass}>
      {$t('candidateApp.settings.languageDescription')}
    </p>
  </div>

  <!-- TODO: save settings button -->
  <!-- TODO: discard button -->

  <div class="mt-32 w-full">
    <p class={headerClass}>
      {$t('candidateApp.settings.accountPassword')}
    </p>
  </div>

  <form
    class="flex-nowarp flex w-full flex-col items-center"
    on:submit|preventDefault={onButtonPress}>
    <div class="w-full">
      <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
        <div class="flex items-center justify-between bg-base-100 px-4">
          <label for="currentPassword" class={labelClass}>
            {$t('candidateApp.settings.currentPassword')}
          </label>
          <div class="w-6/12 text-right text-secondary">
            <PasswordField bind:password={currentPassword} autocomplete="" />
          </div>
        </div>
      </div>
      <p class={disclaimerClass}>
        {$t('candidateApp.settings.currentPasswordDescription')}
      </p>
    </div>

    <PasswordValidator bind:validPassword {password} />

    <div class="w-full">
      <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
        <div class="flex items-center justify-between bg-base-100 px-4">
          <label for="newPassword" class={labelClass}>
            {$t('candidateApp.settings.newPassword')}
          </label>
          <div class="w-6/12 text-right text-secondary">
            <PasswordField bind:password autocomplete="new-password" />
          </div>
        </div>
      </div>
    </div>

    <div class="w-full">
      <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
        <div class="flex items-center justify-between bg-base-100 px-4">
          <label for="newPasswordConfirmation" class={labelClass}>
            {$t('candidateApp.settings.newPasswordConfirmation')}
          </label>
          <div class="w-6/12 text-right text-secondary">
            <PasswordField bind:password={passwordConfirmation} autocomplete="new-password" />
          </div>
        </div>
      </div>
    </div>

    <Button
      type="submit"
      variant="main"
      disabled={disableSetButton}
      class="my-10"
      text={$t('candidateApp.settings.updatePassword')} />

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
