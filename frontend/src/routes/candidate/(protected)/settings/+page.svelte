<script lang="ts">
  import {_} from 'svelte-i18n';
  import {get} from 'svelte/store';
  import {authContext} from '$lib/utils/authenticationStore';
  import {BasicPage} from '$lib/templates/basicPage';
  import {LogoutButton} from '$candidate/components/logoutButton';
  import Icon from '$lib/components/icon/Icon.svelte';
  import {PasswordValidator} from '$candidate/components/passwordValidator';
  import {Button} from '$lib/components/button';
  import {validatePassword} from '$lib/utils/passwordValidation';
  import {changePassword} from '$lib/api/candidate';
  import PasswordField from '$lib/candidate/components/PasswordField/PasswordField.svelte';

  const user = get(authContext.user);

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
      errorMessage = $_('candidateApp.settings.passwordsDontMatch');
      return;
    }

    if (currentPassword === password) {
      errorMessage = $_('candidateApp.settings.passwordIsTheSame');
      return;
    }

    // Additional check before backend validation
    if (!validatePassword(password)) {
      errorMessage = $_('candidateApp.settings.passwordNotValid');
      return;
    }

    const response = await changePassword(currentPassword, password);
    // Ideally, we would also want to check if the current password was wrong, but Strapi does not return this information :/
    if (!response?.ok) {
      errorMessage = $_('candidateApp.settings.changePasswordError');
      return;
    }

    errorMessage = '';
    successMessage = $_('candidateApp.settings.passwordUpdated');
  };
</script>

<BasicPage title={$_('candidateApp.settings.title')} mainClass="bg-base-200">
  <LogoutButton slot="banner" />

  <div class="text-center">
    <p>{$_('candidateApp.settings.instructions')}</p>
  </div>

  <div class="mt-16 w-full">
    <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
      <div class="flex items-center justify-between bg-base-100 px-4">
        <label for="email" class={labelClass}>
          {$_('candidateApp.settings.fields.email')}
        </label>
        <div class="w-6/12 text-right text-secondary">
          <input disabled type="text" id="email" value={user?.email} class={inputClass} />
        </div>
        <Icon name="locked" class="text-secondary" />
      </div>
    </div>
    <p class={disclaimerClass}>
      {$_('candidateApp.settings.emailDescription')}
    </p>
  </div>

  <!-- TODO: this is a placeholder for the future i18n support, @see https://github.com/OpenVAA/voting-advice-application/issues/202 -->
  <div class="mt-16 w-full">
    <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
      <div class="flex items-center justify-between bg-base-100 px-4">
        <label for="language" class={labelClass}>
          {$_('candidateApp.settings.fields.language')}
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
      {$_('candidateApp.settings.languageDescription')}
    </p>
  </div>

  <!-- TODO: save settings button -->
  <!-- TODO: discard button -->

  <div class="mt-32 w-full">
    <p class={headerClass}>
      {$_('candidateApp.settings.accountPassword')}
    </p>
  </div>

  <form
    class="flex-nowarp flex w-full flex-col items-center"
    on:submit|preventDefault={onButtonPress}>
    <div class="w-full">
      <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
        <div class="flex items-center justify-between bg-base-100 px-4">
          <label for="currentPassword" class={labelClass}>
            {$_('candidateApp.settings.currentPassword')}
          </label>
          <div class="w-6/12 text-right text-secondary">
            <PasswordField bind:password={currentPassword} autocomplete="" />
          </div>
        </div>
      </div>
      <p class={disclaimerClass}>
        {$_('candidateApp.settings.currentPasswordDescription')}
      </p>
    </div>

    <PasswordValidator bind:validPassword {password} />

    <div class="w-full">
      <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
        <div class="flex items-center justify-between bg-base-100 px-4">
          <label for="newPassword" class={labelClass}>
            {$_('candidateApp.settings.newPassword')}
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
            {$_('candidateApp.settings.newPasswordConfirmation')}
          </label>
          <div class="w-6/12 text-right text-secondary">
            <PasswordField bind:password={passwordConfirmation} autocomplete="new-password" />
          </div>
        </div>
      </div>
    </div>

    {#if errorMessage}
      <p class="text-center text-error">
        {errorMessage}
      </p>
    {/if}

    <Button
      type="submit"
      variant="main"
      disabled={disableSetButton}
      text={$_('candidateApp.settings.updatePassword')} />

    {#if successMessage}
      <p class="mt-2 text-center text-success">
        {successMessage}
      </p>
    {/if}
  </form>
</BasicPage>
