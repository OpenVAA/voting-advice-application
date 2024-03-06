<script lang="ts">
  import {page} from '$app/stores';
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {resetPassword} from '$lib/api/candidate';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {validatePassword} from '$lib/utils/passwordValidation';
  import {FrontPage} from '$lib/templates/frontPage';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {PasswordValidator} from '$candidate/components/passwordValidator';
  import {Button} from '$lib/components/button';
  import Footer from '$lib/templates/parts/footer/Footer.svelte';
  import PasswordField from '$lib/candidate/components/PasswordField/PasswordField.svelte';

  export let code: string;

  let password = '';
  let passwordConfirmation = '';
  let validPassword = false;
  let errorMessage = '';

  $: disableSetButton = !validPassword || passwordConfirmation.length === 0;

  const onButtonPress = async () => {
    if (password !== passwordConfirmation) {
      errorMessage = $t('candidateApp.setPassword.passwordsDontMatch');
      return;
    }

    // Additional check before backend validation
    if (!validatePassword(password)) {
      errorMessage = $t('candidateApp.setPassword.passwordNotValid');
      return;
    }

    const response = await resetPassword(code, password);
    if (!response.ok) {
      errorMessage = $t('candidateApp.resetPassword.passwordResetError');
      return;
    }

    errorMessage = '';
    await goto(getRoute(Route.CandAppHome));
  };
</script>

<!--
  @component
  Component for setting a new password for a candidate.
  
  If the candidate has forgotten their password, they can request a password reset link, which will bring them to this page.
  In the page the candidate can set a new password, which is validated.
  When a valid password is given and the backend accepts the password, the candidate is redirected to `/candidate`.
  
  ### Properties
  - `code`: The code used to validate the password reset request
  
  ### Usage
  ```tsx
  <PasswordResetPage code={"123-123-123"} />
  ```
-->

<FrontPage title={$t('viewTexts.appTitle')}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('viewTexts.appTitle')}</PreHeading>
    <h1 class="text-xl font-normal">{$page.data.election.name}</h1>
    <h1 class="my-24 text-2xl font-normal">{$t('candidateApp.resetPassword.createNewPassword')}</h1>
  </HeadingGroup>

  <form class="flex-nowarp flex flex-col items-center" on:submit|preventDefault={onButtonPress}>
    <p class="m-0 max-w-md text-center">
      {$t('candidateApp.setPassword.description')}
    </p>

    <PasswordValidator bind:validPassword {password} />

    <label for="password" class="hidden">{$t('candidate.password')}</label>
    <label for="passwordConfirmation" class="hidden">{$t('candidate.password')}</label>
    <div class="mb-md flex w-full max-w-md flex-col gap-6">
      <PasswordField bind:password autocomplete="new-password" />
      <PasswordField bind:password={passwordConfirmation} autocomplete="new-password" />
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
      text={$t('candidateApp.setPassword.setPassword')} />

    <Button href={getRoute(Route.CandAppHelp)} text={$t('candidate.contact_support')} />
  </form>

  <svelte:fragment slot="footer"><Footer /></svelte:fragment>
</FrontPage>
