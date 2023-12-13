<script lang="ts">
  import {FrontPage} from '$lib/templates/frontPage';
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {goto} from '$app/navigation';
  import {register} from '$lib/api/candidate';
  import {PasswordValidator} from '$lib/components/passwordValidator';
  import {validatePassword} from '$lib/utils/passwordValidation';
  import {Button} from '$lib/components/button';
  import Footer from '$lib/components/footer/Footer.svelte';

  export let code: string;

  let password = '';
  let passwordConfirmation = '';
  let validPassword = false;
  let errorMessage = '';

  $: disableSetButton = validPassword && passwordConfirmation.length > 0;

  const onButtonPress = async () => {
    let passwordConfirmation = '';
    if (password !== passwordConfirmation) {
      errorMessage = $_('candidateApp.setPassword.passwordsDontMatch');
      return;
    }

    // Additional check before backend validation
    if (!validatePassword(password)) {
      errorMessage = $_('candidateApp.setPassword.passwordNotValid');
      return;
    }

    const response = await register(code, password);
    if (!response.ok) {
      errorMessage = $_('candidateApp.resetPassword.passwordResetError');
      return;
    }

    const data = await response.json();
    if (!data.success) {
      errorMessage = $_('candidateApp.resetPassword.passwordResetError');
      return;
    }

    errorMessage = '';
    goto('/candidate');
  };
</script>

<!--
@component
Component for setting a new password for a candidate.

If the candidate has forgotten their password, they can request a password reset link,
which will bring them to this page. The page will check the validity of the code from the url parameter.
If the code is valid, the candidate can set a new password, which is validated.
When a valid password is given and the backend accepts the password, the candidate is redirected to `/candidate`.
If the code is invalid, the candidate is also redirected to the candidate page.

### Properties
- `code`: The code used to validate the password reset request

### Usage
```tsx
<PasswordResetPage code={code} />
```

-->

<FrontPage title={$page.data.appLabels.appTitle}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$page.data.appLabels.appTitle}</PreHeading>
    <h1 class="text-xl font-normal">{$page.data.election.name}</h1>
    <h1 class="my-24 text-2xl font-normal">{$_('candidateApp.resetPassword.createNewPassword')}</h1>
  </HeadingGroup>

  <form on:submit|preventDefault={onButtonPress}>
    <p class="m-0 text-center">
      {$_('candidateApp.setPassword.description')}
    </p>

    <PasswordValidator bind:validPassword {password} />

    <label for="password" class="hidden">{$_('candidate.password')}</label>
    <input
      type="password"
      name="password"
      id="password"
      class="input mb-md w-full"
      placeholder={$_('candidateApp.setPassword.password')}
      bind:value={password}
      autocomplete="new-password"
      required />

    <label for="passwordConfirmation" class="hidden">{$_('candidate.password')}</label>
    <input
      type="password"
      name="passwordConfirmation"
      id="passwordConfirmation"
      class="input mb-md w-full"
      placeholder={$_('candidateApp.setPassword.confirmPassword')}
      bind:value={passwordConfirmation}
      autocomplete="new-password"
      required />
    {#if errorMessage}
      <p class="text-center text-error">
        {errorMessage}
      </p>
    {/if}

    <button class="btn btn-primary mb-md w-full" type="submit" disabled={!disableSetButton}>
      {$_('candidateApp.setPassword.setPassword')}
    </button>

    <Button href="/help" variant="normal" text={$_('candidate.contact_support')} />
  </form>

  <svelte:fragment slot="footer"><Footer /></svelte:fragment>
</FrontPage>
