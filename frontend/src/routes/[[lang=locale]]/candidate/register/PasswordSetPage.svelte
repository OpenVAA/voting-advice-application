<script lang="ts">
  import { validatePassword } from '@openvaa/app-shared';
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { register } from '$lib/legacy-api/candidate';
  import { LogoutButton } from '$lib/candidate/components/logoutButton';
  import { PasswordSetter } from '$lib/candidate/components/passwordSetter';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { t } from '$lib/i18n';
  import { FrontPage } from '$lib/templates/frontPage';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import type { CandidateContext } from '$lib/utils/legacy-candidateContext';

  export let username: string;
  export let registrationCode: string;
  export let email: string;

  let password = '';
  let passwordConfirmation = '';
  const { newUserEmail, user, logOut } = getContext<CandidateContext>('candidate');

  let validPassword = false;
  let errorMessage = '';

  async function onSetButtonPressed() {
    if (password !== passwordConfirmation) {
      errorMessage = $t('candidateApp.setPassword.passwordsDontMatch');
      return;
    }

    // Additional check before backend validation
    if (!validatePassword(password, username)) {
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
    if ($user) {
      await logOut();
    }
    newUserEmail.set(email);
    errorMessage = '';
    goto($getRoute(ROUTE.CandAppHome));
  }
</script>

<!--
@component
Page where candidates can set their password when logging to the app for the first time.
Registration code and email are required to complete the registration.
Shows an error message if the registration is not successful.

### Properties

- `username` (required): name the user is greeted with
- `registrationCode` (required): registration key of the user, used by the backend
- `email` (required): email of the user, used for registration

### Usage

  ```tsx
  <PasswordSetPage username="Barnabas" registrationCode="123-123-123" />
  ```
-->

<FrontPage title={$t('candidateApp.register.title')}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('dynamic.appName')}</PreHeading>
    <h1 class="text-3xl font-normal">{$page.data.election?.name}</h1>
    <h1 class="my-24 text-2xl font-normal">
      {$t('candidateApp.common.greeting', { username })}
    </h1>
  </HeadingGroup>
  {#if $user}
    <p class="text-center text-warning">{$t('candidateApp.register.loggedInWarning')}</p>
    <div class="center pb-10">
      <LogoutButton stayOnPage={true} buttonVariant="main" />
    </div>
  {/if}
  <form class="flex flex-col flex-nowrap items-center">
    <PasswordSetter
      buttonPressed={onSetButtonPressed}
      bind:validPassword
      bind:errorMessage
      bind:password
      bind:passwordConfirmation />
  </form>
</FrontPage>
