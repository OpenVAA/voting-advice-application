<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {goto} from '$app/navigation';
  import Footer from '$lib/components/footer/Footer.svelte';
  import {register} from '$lib/api/candidate';
  import PasswordValidator from './PasswordValidator.svelte';
  import {validatePassword} from '$lib/utils/passwordValidation';

  export let userName: string;
  export let registrationCode: string;

  let password1 = '';
  let password2 = '';
  let validPassword = false;
  let errorMessage = '';

  $: disableSetButton = validPassword && password2.length > 0;

  const onSetButtonPressed = async () => {
    if (password1 !== password2) {
      errorMessage = $_('candidateApp.setPassword.passwordsDontMatch');
      return;
    }

    // Additional check before backend validation
    if (!validatePassword(password1, userName)) {
      errorMessage = $_('candidateApp.setPassword.passwordNotValid');
      return;
    }

    const response = await register(registrationCode, password1);
    if (!response.ok) {
      errorMessage = $_('candidateApp.setPassword.registrationError');
      return;
    }

    const data = await response.json();
    if (!data.success) {
      errorMessage = $_('candidateApp.setPassword.registrationError');
      return;
    }

    errorMessage = '';
    goto('/candidate');
  };
</script>

<!--
@component
Page where candidates can set their password when logging to the app for the first time.

### Properties

- userName:
  - The component will greet the user with the given name.
  - Default value is Barnabas, but this will be fixed later.
- registrationKey:
  - The registration key is given to the component.
  - The component will use this key to register the user.
  - The component will show an error message if the registration fails.
### Usage

  ```tsx
  <PasswordSetPage userName={"Barnabas"} registrationKey={'123-123-123'}/>
  ```
-->

<div class="flex w-full flex-grow flex-col items-center bg-base-300">
  <main class="flex-grow">
    <div class="flex max-w-xl flex-col items-center p-lg pl-safelgl pr-safelgr">
      <div class="flex flex-col flex-nowrap items-center">
        <hgroup class="py-lg">
          <p class="text-2xl font-bold text-primary">{$page.data.appLabels.appTitle}</p>
          <h1 class="text-3xl font-normal">{$page.data.election.name}</h1>
          <h1 class="my-24 text-2xl font-normal">
            {$_('candidateApp.setPassword.greeting', {values: {name: userName}})}
          </h1>
        </hgroup>

        <form
          class="flex flex-col flex-nowrap items-center"
          on:submit|preventDefault={onSetButtonPressed}>
          <p class="m-0 text-center">
            {$_('candidateApp.setPassword.description')}
          </p>

          <PasswordValidator bind:validPassword password={password1} />

          <label for="password1" class="hidden">{$_('candidate.password')}</label>
          <input
            type="password"
            name="password1"
            id="password1"
            class="input mb-md w-full max-w-md"
            placeholder={$_('candidateApp.setPassword.password')}
            bind:value={password1}
            autocomplete="new-password"
            required />

          <label for="password2" class="hidden">{$_('candidate.password')}</label>
          <input
            type="password"
            name="password2"
            id="password2"
            class="input mb-md w-full max-w-md"
            placeholder={$_('candidateApp.setPassword.confirmPassword')}
            bind:value={password2}
            autocomplete="new-password"
            required />
          {#if errorMessage}
            <p class="text-center text-error">
              {errorMessage}
            </p>
          {/if}

          <button
            type="submit"
            disabled={!disableSetButton}
            class="btn btn-primary mb-md w-full max-w-md"
            >{$_('candidateApp.setPassword.setPassword')}</button>

          <a href="/help" class="btn btn-ghost w-full max-w-md"
            >{$_('candidate.contact_support')}</a>
        </form>
      </div>
    </div>
  </main>

  <Footer />
</div>
