<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {goto} from '$app/navigation';
  import Footer from '$lib/templates/parts/footer/Footer.svelte';
  import {register} from '$lib/api/candidate';
  import {PasswordValidator} from '$candidate/components/passwordValidator';
  import {validatePassword} from '$lib/utils/passwordValidation';
  import {FrontPage} from '$lib/templates/frontPage';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {Button} from '$lib/components/button';
  import {candidateAppRoute} from '$lib/utils/routes';
  import PasswordField from '$lib/candidate/components/PasswordField/PasswordField.svelte';

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
    goto(candidateAppRoute);
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

<FrontPage title={$_('candidateApp.registration.title')}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$page.data.appLabels.appTitle}</PreHeading>
    <h1 class="text-3xl font-normal">{$page.data.election.name}</h1>
    <h1 class="my-24 text-2xl font-normal">
      {$_('candidateApp.setPassword.greeting', {values: {name: userName}})}
    </h1>
  </HeadingGroup>

  <form
    class="flex flex-col flex-nowrap items-center"
    on:submit|preventDefault={onSetButtonPressed}>
    <p class="m-0 text-center">
      {$_('candidateApp.setPassword.description')}
    </p>

    <PasswordValidator bind:validPassword password={password1} />

    <div class="mb-md w-full max-w-md space-y-10">
      <label for="password1" class="hidden">{$_('candidate.password')}</label>
      <PasswordField bind:password={password1} autoComplete="new-password" />
      <label for="password2" class="hidden">{$_('candidate.password')}</label>
      <PasswordField bind:password={password2} autoComplete="new-password" />
    </div>

    {#if errorMessage}
      <p class="text-center text-error">
        {errorMessage}
      </p>
    {/if}

    <Button
      type="submit"
      disabled={!disableSetButton}
      variant="main"
      text={$_('candidateApp.setPassword.setPassword')} />

    <Button href="{candidateAppRoute}/help" text={$_('candidate.contact_support')} />
  </form>

  <Footer slot="footer" />
</FrontPage>
