<!--
@component
Contains a password validator, a password input field and a second confirmation password input field.

### Dynamic component

Contains the dynamic `PasswordValidator` component.

### Properties

- `password`: Bindable: The password value.
- `autocomplete`: The autocomplete attribute for the password input field. Default: `'new-password'`
- `errorMessage`: Bindable: Error message if the password is invalid or doesn't match the confirmation password.
- `valid`: Bindable: Whether the password is valid and the confirmation password matches.
- `reset`: Bindable: Function to clear the form.
- Any valid attributes of a `<form>` element

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
  import type { PasswordSetterProps } from './PasswordSetter.type';

  type $$Props = PasswordSetterProps;

  export let password: $$Props['password'] = '';
  export let autocomplete: $$Props['autocomplete'] = 'new-password';
  export let errorMessage: $$Props['errorMessage'] = undefined;
  export let valid: $$Props['valid'] = false;
  export function reset(): void {
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
  <div class="mb-md mt-md flex w-full flex-col gap-6">
    <PasswordField bind:password id="password-{id}" label={$t('common.password')} {autocomplete} />
    <PasswordField
      bind:password={passwordConfirmation}
      id="confirmation-{id}"
      label={$t('common.passwordConfirmation')}
      {autocomplete} />
  </div>
</form>
