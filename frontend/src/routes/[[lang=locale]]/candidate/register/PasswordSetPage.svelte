<script lang="ts">
  import {page} from '$app/stores';
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {register} from '$lib/api/candidate';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {validatePassword} from '$shared/utils/passwordValidation';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import Footer from '$lib/templates/parts/footer/Footer.svelte';
  import {FrontPage} from '$lib/templates/frontPage';
  import {emailOfNewUserStore} from '$lib/utils/authenticationStore';
  import {PasswordSetter} from '$lib/candidate/components/PasswordSetter';
  import {getContext} from 'svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';

  export let userName: string;
  export let registrationCode: string;
  export let email: string;

  let password = '';
  let passwordConfirmation = '';
  const {emailOfNewUserStore} = getContext<CandidateContext>('candidate');
  let validPassword = false;
  let errorMessage = '';

  const onSetButtonPressed = async () => {
    if (password !== passwordConfirmation) {
      errorMessage = $t('candidateApp.setPassword.passwordsDontMatch');
      return;
    }

    // Additional check before backend validation
    if (!validatePassword(password, userName)) {
      errorMessage = $t('candidateApp.setPassword.passwordNotValid');
      return;
    }

    const response = await register(registrationCode, password);
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
    goto($getRoute(Route.CandAppHome));
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

  <form class="flex flex-col flex-nowrap items-center">
    <PasswordSetter
      buttonPressed={onSetButtonPressed}
      bind:validPassword
      bind:errorMessage
      bind:password
      bind:passwordConfirmation />
  </form>

  <Footer slot="footer" />
</FrontPage>
