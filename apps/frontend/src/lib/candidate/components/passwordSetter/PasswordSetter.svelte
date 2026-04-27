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

  let {
    password = $bindable(''),
    autocomplete = 'new-password',
    errorMessage = $bindable(undefined),
    valid = $bindable(false),
    passwordTestId = undefined,
    confirmPasswordTestId = undefined,
    ...restProps
  }: PasswordSetterProps = $props();

  export function reset(): void {
    password = '';
    passwordConfirmation = '';
    errorMessage = undefined;
  }

  const { t } = getComponentContext();

  const id = getUUID();

  let passwordConfirmation = $state('');
  let validPassword = $state(false);

  $effect(() => {
    valid = !!(password && passwordConfirmation && validPassword && password === passwordConfirmation);
  });
  $effect(() => {
    if (!validPassword) {
      errorMessage = t('candidateApp.setPassword.passwordNotValid');
    } else if (password !== passwordConfirmation) {
      errorMessage = t('candidateApp.setPassword.passwordsDontMatch');
    } else {
      errorMessage = undefined;
    }
  });
</script>

<form class="m-0 flex w-full flex-col flex-nowrap items-center">
  <p class="mx-md my-0 self-stretch">
    {t('candidateApp.setPassword.ingress')}
  </p>
  <PasswordValidator bind:validPassword {password} />
  <div class="mb-md mt-md flex w-full flex-col gap-6">
    <div data-testid={passwordTestId}>
      <PasswordField bind:password id="password-{id}" label={t('common.password')} {autocomplete} />
    </div>
    <div data-testid={confirmPasswordTestId}>
      <PasswordField
        bind:password={passwordConfirmation}
        id="confirmation-{id}"
        label={t('common.passwordConfirmation')}
        {autocomplete} />
    </div>
  </div>
</form>
