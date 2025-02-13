<script lang="ts">
  import { PasswordField } from '$candidate/components/passwordField';
  import { PasswordValidator } from '$candidate/components/passwordValidator';
  import { Button } from '$lib/components/button';
  import { t } from '$lib/i18n';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';

  export let password = '';
  export let passwordConfirmation = '';
  export let autocompleteString = 'new-password';
  export let errorMessage = '';
  export let validPassword = false;

  $: disableSetButton = validPassword && passwordConfirmation.length > 0;
  // Dispatcher used for a function that calls the submit button's function in parent component
  export let buttonPressed: () => void;
</script>

<!--
@component
PasswordSetter is a component used by PasswordSetPage and PasswordResetPage that contains a password input field,
a second confirmation password input field, a button for submitting the password, a button to contact support and informatory text

### Properties

- `password` : value for the first password field
- `passwordConfirmation` : value for the second password field
- `errorMessage` : message showing error if one exists
- `validPassword` : variable used to determine if the password combination is valid

### Usage

```tsx

<PasswordSetComponent
  bind:password={passwordOfContext1}
  bind:passwordConfirmation={passwordOfContext2}
  on:ButtonPressed={onSetButtonPressed}
  bind:validPassword={validPasswordOfContext}
  bind:errorMessage={errorMessageOfContext} />
```
-->

<form class="m-0 flex w-full flex-col flex-nowrap items-center" on:submit|preventDefault={buttonPressed}>
  <p class="m-0 text-center">
    {$t('candidateApp.setPassword.ingress')}
  </p>
  <PasswordValidator bind:validPassword {password} />
  <div class="mb-md flex w-full max-w-md flex-col gap-6">
    <PasswordField bind:password id="password" autocomplete={autocompleteString} />
    <PasswordField bind:password={passwordConfirmation} id="passwordConfirmation" autocomplete={autocompleteString} />
  </div>

  {#if errorMessage}
    <p class="text-center text-error">
      {errorMessage}
    </p>
  {/if}
  <Button type="submit" disabled={!disableSetButton} variant="main" text={$t('candidateApp.setPassword.setPassword')} />
  <Button href={$getRoute(ROUTE.CandAppHelp)} text={$t('candidateApp.common.contactSupport')} />
</form>
