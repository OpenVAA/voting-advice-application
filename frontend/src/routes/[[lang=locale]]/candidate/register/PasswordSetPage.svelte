<script lang="ts">
  import {page} from '$app/stores';
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {register} from '$lib/api/candidate';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {validatePassword} from '$lib/utils/passwordValidation';
  import {PasswordValidator} from '$candidate/components/passwordValidator';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {Button} from '$lib/components/button';
  import PasswordField from '$lib/candidate/components/PasswordField/PasswordField.svelte';
  import Footer from '$lib/templates/parts/footer/Footer.svelte';
  import {FrontPage} from '$lib/templates/frontPage';
  import {emailOfNewUserStore} from '$lib/utils/authenticationStore';

  export let userName: string;
  export let registrationCode: string;
  export let email: string;

  let password1 = '';
  let password2 = '';
  let validPassword = false;
  let errorMessage = '';

  $: disableSetButton = validPassword && password2.length > 0;

  const onSetButtonPressed = async () => {
    if (password1 !== password2) {
      errorMessage = $t('candidateApp.setPassword.passwordsDontMatch');
      return;
    }

    // Additional check before backend validation
    if (!validatePassword(password1, userName)) {
      errorMessage = $t('candidateApp.setPassword.passwordNotValid');
      return;
    }

    const response = await register(registrationCode, password1);
    if (!response.ok) {
      errorMessage = $t('candidateApp.setPassword.registrationError');
      return;
    }

    const data = await response.json();
    if (!data.success) {
      errorMessage = $t('candidateApp.setPassword.registrationError');
      return;
    }

    emailOfNewUserStore.set(email);
    errorMessage = '';
    goto(getRoute(Route.CandAppHome));
  };
</script>

<!--
@component
Page where candidates can set their password when logging to the app for the first time.

### Properties

- userName:
  - The component will greet the user with the given name.
- registrationKey:
  - The registration key is given to the component.
  - The component will use this key to register the user.
  - The component will show an error message if the registration fails.
### Usage

  ```tsx
  <PasswordSetPage userName="Barnabas" registrationKey="123-123-123" />
  ```
-->

<FrontPage title={$t('candidateApp.registration.title')}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('viewTexts.appTitle')}</PreHeading>
    <h1 class="text-3xl font-normal">{$page.data.election.name}</h1>
    <h1 class="my-24 text-2xl font-normal">
      {$t('candidateApp.setPassword.greeting', {userName})}
    </h1>
  </HeadingGroup>

  <form
    class="flex flex-col flex-nowrap items-center"
    on:submit|preventDefault={onSetButtonPressed}>
    <p class="m-0 text-center">
      {$t('candidateApp.setPassword.description')}
    </p>

    <PasswordValidator bind:validPassword password={password1} />

    <div class="mb-md w-full max-w-md space-y-10">
      <label for="password1" class="hidden">{$t('candidate.password')}</label>
      <PasswordField bind:password={password1} autocomplete="new-password" />
      <label for="password2" class="hidden">{$t('candidate.password')}</label>
      <PasswordField bind:password={password2} autocomplete="new-password" />
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
      text={$t('candidateApp.setPassword.setPassword')} />

    <Button href={getRoute(Route.CandAppHelp)} text={$t('candidate.contact_support')} />
  </form>

  <Footer slot="footer" />
</FrontPage>
