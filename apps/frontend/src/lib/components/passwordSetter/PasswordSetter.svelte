<!--
@component The form for choosing a password: the rule list, a password field and its confirmation, in a form a browser and a password manager can read.

The component is the `<form>` itself. The form is posted by `POST` and its own validation is switched off; both are fixed. It holds no submit control: its caller renders one, tied to the form by the `form` attribute, and handles the submit event. In the form's markup the order is: the account's address, the sentence, the rule list, the password, its confirmation.

With `username` the form's first control is a read-only field holding the account's address, for a password manager to pair with the new password. That field is not rendered: it takes no space, is no tab stop and is not in the accessibility tree. The component never shows the address and never sends it anywhere.

### Dynamic component

Contains the dynamic `PasswordValidator` component, and judges a password with `validatePasswordDetails` of `$lib/utils/password-validation/passwordValidation`.

### Properties

- `password`: Bindable: The password value.
- `username`: The address of the account the password is for. Held in the form for a password manager and given to the rule list, which refuses a password that contains it. Without it no address field is rendered.
- `onValidityChange`: Called whenever the validity verdict or the error message changes, with `{ valid, errorMessage }`. The verdict follows the rule list's delayed display.
- `onShadedBg`: Whether the page behind the form is shaded, so that the fields' rows are painted to show on it. Default: `false`
- `validate`: Bindable: Function that judges the password as typed, shows what is wrong at the field it concerns, moves focus there and returns the verdict.
- `reset`: Bindable: Function to clear both fields and both errors.
- Any valid attributes of a `<form>` element except `method`, `novalidate` and `autocomplete`; an `id` and an `onsubmit` reach the form.

### Reactivity

`valid` and `errorMessage` are pure functions of this component's own inputs, so they are `$derived` values rather than state pushed by an effect. They are therefore not bindable props: Svelte 5 does not permit a derived value to hold a `$bindable`. The parent receives them through `onValidityChange` instead. Both rest on the rule list's verdict, which arrives after a delay; `validate()` does not.

### Accessibility

- Each of the two fields is the input library's `Input` of the `password` kind: its label is visible, in the control's row and tied to the control by `for`, and it has no placeholder.
- Each control is `aria-required`, without the native `required` attribute and without the badge an empty required `Input` shows.
- A field's error has `role="alert"`; while it is shown the control is `aria-invalid` and described by it. An error goes when its field is edited, and the mismatch also when the password is.
- The first field states the rule list's rules to browsers that suggest passwords, through `passwordrules`.

### Usage

```tsx
<PasswordSetter
  id="set-password"
  username={email}
  bind:password
  bind:this={setter}
  onsubmit={(event) => {
    event.preventDefault();
    if (setter.validate()) save();
  }} />
<Button type="submit" form="set-password" variant="main" text={t('common.account.setPassword.setPassword')} />
```
-->

<script lang="ts">
  import { Input } from '$lib/components/input';
  import { PasswordValidator } from '$lib/components/passwordValidator';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass, getUUID } from '$lib/utils/components';
  import { minPasswordLength, validatePasswordDetails } from '$lib/utils/password-validation/passwordValidation';
  import type { PasswordSetterProps } from './PasswordSetter.type';

  /**
   * The `passwordrules` token of each character class, by the key of the rule that requires it in `validatePasswordDetails`.
   */
  const CHARACTER_CLASS_TOKENS: Record<string, string> = {
    uppercase: 'upper',
    lowercase: 'lower',
    number: 'digit',
    symbol: 'special'
  };

  let {
    password = $bindable(''),
    username = undefined,
    onValidityChange,
    onShadedBg = false,
    ...restProps
  }: PasswordSetterProps = $props();

  /**
   * Judge the password as typed, and its confirmation. Shows what is wrong at the field it concerns, moves focus to that field and returns whether the pair is acceptable. The verdict does not wait for the rule list's display.
   */
  export function validate(): boolean {
    passwordError = undefined;
    confirmationError = undefined;
    if (!validatePasswordDetails(password, username ?? '').status) {
      passwordError = t('common.account.setPassword.passwordNotValid');
      passwordField?.focus();
      return false;
    }
    if (password !== passwordConfirmation) {
      confirmationError = t('common.account.setPassword.passwordsDontMatch');
      confirmationField?.focus();
      return false;
    }
    return true;
  }

  /**
   * Clear both fields and both errors.
   */
  export function reset(): void {
    password = '';
    passwordConfirmation = '';
    passwordError = undefined;
    confirmationError = undefined;
  }

  const { t } = getComponentContext();

  // Generated once, so that the two controls' ids are the same on every read. The form's own id is its caller's.
  const uid = getUUID();
  const passwordId = `password-${uid}`;
  const confirmationId = `confirmation-${uid}`;

  // What the rule list requires, stated in the form browsers that suggest passwords read. The length and the required character classes are read from the rules themselves, so the string follows them.
  const passwordrules =
    [
      `minlength: ${minPasswordLength}`,
      ...Object.keys(validatePasswordDetails('').details)
        .filter((rule) => Object.hasOwn(CHARACTER_CLASS_TOKENS, rule))
        .map((rule) => `required: ${CHARACTER_CLASS_TOKENS[rule]}`)
    ].join('; ') + ';';

  let passwordField: Input | undefined = $state();
  let confirmationField: Input | undefined = $state();

  let passwordConfirmation = $state('');
  let validPassword = $state(false);
  let passwordError = $state<string>();
  let confirmationError = $state<string>();

  // A pure function of this component's own inputs, so it is derived rather than pushed by an effect. The equality between the password and its confirmation is load-bearing and not a stylistic clause: dropping it would let a mismatched credential pass the client gate.
  const valid = $derived(!!(password && passwordConfirmation && validPassword && password === passwordConfirmation));

  // Total over the same inputs — every path through the ladder yields a value — so it is likewise derived. The branches return translation keys, never credential material.
  const errorMessage = $derived.by(() => {
    if (!validPassword) return t('common.account.setPassword.passwordNotValid');
    if (password !== passwordConfirmation) return t('common.account.setPassword.passwordsDontMatch');
    return undefined;
  });

  // Handing the pair to the parent is a genuine side effect, not a value, so this one effect survives. It reads the two deriveds and nothing else, which is what keeps it from re-entering.
  $effect(() => {
    onValidityChange?.({ valid, errorMessage });
  });

  // `Input` clears a field's own error when that field is edited. A mismatch is about both fields, so an edit of the password removes it as well.
  function clearMismatch(): void {
    confirmationError = undefined;
  }
</script>

<!-- `method` and `novalidate` follow the spread, so that no caller replaces them: a form posted by `GET` would put a password in the address bar. -->
<form {...concatClass(restProps, 'flex w-full flex-col items-center gap-md')} method="POST" novalidate>
  {#if username}
    <!-- For a password manager alone: not rendered, so it is no tab stop and needs no label. -->
    <input
      type="email"
      name="username"
      autocomplete="username"
      value={username}
      readonly
      tabindex="-1"
      class="hidden" />
  {/if}
  <div class="mx-md self-stretch">
    {t('common.account.setPassword.ingress')}
  </div>
  <!-- The rule list is as wide as the form and has margins of its own, so the stack centres its blocks to keep the list's edges on the form's. -->
  <PasswordValidator bind:validPassword {password} {username} />
  <Input
    bind:this={passwordField}
    bind:value={password}
    bind:error={passwordError}
    type="password"
    id={passwordId}
    label={t('common.password')}
    name="new-password"
    autocomplete="new-password"
    aria-required="true"
    data-testid="password-field"
    errorTestId="password-setter-password-error"
    containerProps={{ 'data-testid': 'password-setter-password' }}
    {passwordrules}
    {onShadedBg}
    oninput={clearMismatch} />
  <Input
    bind:this={confirmationField}
    bind:value={passwordConfirmation}
    bind:error={confirmationError}
    type="password"
    id={confirmationId}
    label={t('common.passwordConfirmation')}
    name="new-password-confirmation"
    autocomplete="new-password"
    aria-required="true"
    data-testid="password-field"
    errorTestId="password-setter-confirmation-error"
    containerProps={{ 'data-testid': 'password-setter-confirmation' }}
    {onShadedBg} />
</form>
