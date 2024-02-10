<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {goto} from '$app/navigation';
  import {resetPassword} from '$lib/api/candidate';
  import {FrontPage} from '$lib/templates/frontPage';
  import {candidateAppRoute} from '$lib/utils/routes';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {PasswordValidator} from '$candidate/components/passwordValidator';
  import {validatePassword} from '$lib/utils/passwordValidation';
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
      errorMessage = $_('candidateApp.setPassword.passwordsDontMatch');
      return;
    }

    // Additional check before backend validation
    if (!validatePassword(password)) {
      errorMessage = $_('candidateApp.setPassword.passwordNotValid');
      return;
    }

    const response = await resetPassword(code, password);
    if (!response.ok) {
      errorMessage = $_('candidateApp.resetPassword.passwordResetError');
      return;
    }

    errorMessage = '';
    await goto(candidateAppRoute);
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

<FrontPage title={$page.data.appLabels.appTitle}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$page.data.appLabels.appTitle}</PreHeading>
    <h1 class="text-xl font-normal">{$page.data.election.name}</h1>
    <h1 class="my-24 text-2xl font-normal">{$_('candidateApp.resetPassword.createNewPassword')}</h1>
  </HeadingGroup>

  <form class="flex-nowarp flex flex-col items-center" on:submit|preventDefault={onButtonPress}>
    <p class="m-0 max-w-md text-center">
      {$_('candidateApp.setPassword.description')}
    </p>

    <PasswordValidator bind:validPassword {password} />

    <label for="password" class="hidden">{$_('candidate.password')}</label>
    <label for="passwordConfirmation" class="hidden">{$_('candidate.password')}</label>
    <div class="input mb-md w-full max-w-md">
      <PasswordField bind:password autoComplete="new-password" />
      <PasswordField bind:password={passwordConfirmation} autoComplete="new-password" />
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
      text={$_('candidateApp.setPassword.setPassword')} />

    <Button href="{candidateAppRoute}/help" text={$_('candidate.contact_support')} />
  </form>

  <svelte:fragment slot="footer"><Footer /></svelte:fragment>
</FrontPage>
