<!--
@component
Contains a password validator, a password input field and a second confirmation password input field.

### Dynamic component

Contains the dynamic `PasswordValidator` component.

### Properties

- `password`: value for the password field
- `autocomplete`: autocomplete attribute for the password input field
- `errorMessage`: bindable error message if the password is invalid or doesn't match the confirmation password
- `valid`: bindable property which can be read to see if the password is valid and the confirmation password matches
- `reset`: bindable function with which to clear to form

### Usage

```tsx

<PasswordSetter
  bind:password={password}
  bind:valid={canSubmit}/>
```
-->

<script lang="ts">
  import { PasswordField } from '$candidate/components/passwordField';
  import { PasswordValidator } from '$candidate/components/passwordValidator';
  import { getComponentContext } from '$lib/contexts/component';
  import { getUUID } from '$lib/utils/components';
  
  export let password = '';
  export let autocomplete = 'new-password';
  export let errorMessage: string | undefined = undefined;
  export let valid = false;
  export const reset = function() {
    password = '';
    passwordConfirmation = '';
    errorMessage = undefined;
  }
  
  const { t } = getComponentContext();
  
  const id = getUUID();

  let passwordConfirmation = '';
  let validPassword = false;

  $: valid = !!(password && passwordConfirmation && validPassword && password === passwordConfirmation);
  $: if (!validPassword) {
    errorMessage = $t('candidateApp.setPassword.passwordNotValid');
  } else if (password !== passwordConfirmation) {
    errorMessage = $t('candidateApp.setPassword.passwordsDontMatch');
  } else {
    errorMessage = undefined;
  }
</script>

<form class="m-0 flex w-full flex-col flex-nowrap items-center">
  <p class="mx-md my-0 self-stretch">
    {$t('candidateApp.setPassword.ingress')}
  </p>
  <PasswordValidator bind:validPassword {password} />
  <div class="mt-md mb-md flex w-full flex-col gap-6">
    <PasswordField 
      bind:password 
      id="password-{id}" 
      label={$t('common.password')}
      {autocomplete}/>
    <PasswordField 
      bind:password={passwordConfirmation} 
      id="confirmation-{id}" 
      label={$t('common.passwordConfirmation')}
      {autocomplete}
      />
  </div>
</form>
