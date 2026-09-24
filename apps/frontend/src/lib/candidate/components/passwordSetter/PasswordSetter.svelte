<!--
@component Contains a password validator, a password input field and a second confirmation password input field.

### Dynamic component

Contains the dynamic `PasswordValidator` component.

### Properties

- `password`: Bindable: The password value.
- `autocomplete`: The autocomplete attribute for the password input field. Default: `'new-password'`
- `onValidityChange`: Called whenever the validity verdict or the error message changes, with `{ valid, errorMessage }`.
- `reset`: Bindable: Function to clear the form.
- Any valid attributes of a `<form>` element

### Reactivity

`valid` and `errorMessage` are pure functions of this component's own inputs, so they are `$derived` values rather than state pushed by an effect. They are therefore not bindable props: Svelte 5 does not permit a derived value to hold a `$bindable`. The parent receives them through `onValidityChange` instead.

### Usage

```tsx
<PasswordSetter
  bind:password={password}
  onValidityChange={({ valid, errorMessage }) => {
    canSubmit = valid;
    validationError = errorMessage;
  }}/>
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
    onValidityChange,
    ...restProps
  }: PasswordSetterProps = $props();

  export function reset(): void {
    password = '';
    passwordConfirmation = '';
  }

  const { t } = getComponentContext();

  const id = getUUID();

  let passwordConfirmation = $state('');
  let validPassword = $state(false);

  // A pure function of this component's own inputs, so it is derived rather than pushed by an effect. The equality between the password and its confirmation is load-bearing and not a stylistic clause: dropping it would let a mismatched credential pass the client gate.
  const valid = $derived(!!(password && passwordConfirmation && validPassword && password === passwordConfirmation));

  // Total over the same inputs — every path through the ladder yields a value — so it is likewise derived. The branches return translation keys, never credential material.
  const errorMessage = $derived.by(() => {
    if (!validPassword) return t('candidateApp.setPassword.passwordNotValid');
    if (password !== passwordConfirmation) return t('candidateApp.setPassword.passwordsDontMatch');
    return undefined;
  });

  // Handing the pair to the parent is a genuine side effect, not a value, so this one effect survives. It reads the two deriveds and nothing else, which is what keeps it from re-entering.
  $effect(() => {
    onValidityChange?.({ valid, errorMessage });
  });
</script>

<form class="m-0 flex w-full flex-col flex-nowrap items-center" {...restProps}>
  <p class="mx-md my-0 self-stretch">
    {t('candidateApp.setPassword.ingress')}
  </p>
  <!-- bind: keep — Pattern 2: PasswordValidator.validPassword is $bindable(false) -->
  <PasswordValidator bind:validPassword {password} />
  <div class="mb-md mt-md flex w-full flex-col gap-6">
    <div data-testid="password-setter-password">
      <!-- bind: keep — Pattern 2: PasswordField.password is $bindable('') -->
      <PasswordField bind:password id="password-{id}" label={t('common.password')} {autocomplete} />
    </div>
    <div data-testid="password-setter-confirmation">
      <!-- bind: keep — Pattern 2: PasswordField.password is $bindable('') -->
      <PasswordField
        bind:password={passwordConfirmation}
        id="confirmation-{id}"
        label={t('common.passwordConfirmation')}
        {autocomplete} />
    </div>
  </div>
</form>
