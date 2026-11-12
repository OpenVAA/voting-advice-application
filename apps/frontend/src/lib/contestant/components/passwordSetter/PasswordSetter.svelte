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
- `validate`: Bindable: Function that judges the password as typed, shows what is wrong at the field it concerns, moves focus there and returns the verdict.
- `reset`: Bindable: Function to clear both fields and both errors.
- Any valid attributes of a `<form>` element except `method`, `novalidate` and `autocomplete`; an `id` and an `onsubmit` reach the form.

### Reactivity

`valid` and `errorMessage` are pure functions of this component's own inputs, so they are `$derived` values rather than state pushed by an effect. They are therefore not bindable props: Svelte 5 does not permit a derived value to hold a `$bindable`. The parent receives them through `onValidityChange` instead. Both rest on the rule list's verdict, which arrives after a delay; `validate()` does not.

### Accessibility

- Each of the two fields has a visible label tied to it by `for` and no placeholder.
- A field's error has `role="alert"`; while it is shown the control is `aria-invalid` and described by it. An error goes when its field is edited, and the mismatch also when the password is.
- The first field states the rule list's rules to browsers that suggest passwords, through `passwordrules`.

### Usage

```tsx
<PasswordSetter
  id="set-password"
  username={contestantCtx.user?.email}
  bind:password
  bind:this={setter}
  onsubmit={(event) => {
    event.preventDefault();
    if (setter.validate()) save();
  }} />
<Button type="submit" form="set-password" variant="main" text={t('contestantApp.setPassword.setPassword')} />
```
-->

<script lang="ts">
  import { PasswordField } from '$contestant/components/passwordField';
  import { PasswordValidator } from '$contestant/components/passwordValidator';
  import { ErrorMessage } from '$lib/components/errorMessage';
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
    ...restProps
  }: PasswordSetterProps = $props();

  /**
   * Judge the password as typed, and its confirmation. Shows what is wrong at the field it concerns, moves focus to that field and returns whether the pair is acceptable. The verdict does not wait for the rule list's display.
   */
  export function validate(): boolean {
    passwordError = undefined;
    confirmationError = undefined;
    if (!validatePasswordDetails(password, username ?? '').status) {
      passwordError = t('contestantApp.setPassword.passwordNotValid');
      passwordField?.focus();
      return false;
    }
    if (password !== passwordConfirmation) {
      confirmationError = t('contestantApp.setPassword.passwordsDontMatch');
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

  let passwordField: PasswordField | undefined = $state();
  let confirmationField: PasswordField | undefined = $state();

  let passwordConfirmation = $state('');
  let validPassword = $state(false);
  let passwordError = $state<string>();
  let confirmationError = $state<string>();

  // A pure function of this component's own inputs, so it is derived rather than pushed by an effect. The equality between the password and its confirmation is load-bearing and not a stylistic clause: dropping it would let a mismatched credential pass the client gate.
  const valid = $derived(!!(password && passwordConfirmation && validPassword && password === passwordConfirmation));

  // Total over the same inputs — every path through the ladder yields a value — so it is likewise derived. The branches return translation keys, never credential material.
  const errorMessage = $derived.by(() => {
    if (!validPassword) return t('contestantApp.setPassword.passwordNotValid');
    if (password !== passwordConfirmation) return t('contestantApp.setPassword.passwordsDontMatch');
    return undefined;
  });

  // Handing the pair to the parent is a genuine side effect, not a value, so this one effect survives. It reads the two deriveds and nothing else, which is what keeps it from re-entering.
  $effect(() => {
    onValidityChange?.({ valid, errorMessage });
  });

  // Each field writes here when the user edits it, which is also when its error goes. A mismatch is about both fields, so an edit of either removes it.
  function handlePasswordEdited(next: string): void {
    password = next;
    passwordError = undefined;
    confirmationError = undefined;
  }

  function handleConfirmationEdited(next: string): void {
    passwordConfirmation = next;
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
    {t('contestantApp.setPassword.ingress')}
  </div>
  <!-- The rule list is as wide as the form and has margins of its own, so the stack centres its blocks to keep the list's edges on the form's. -->
  <PasswordValidator bind:validPassword {password} {username} />
  <div class="gap-xs flex w-full flex-col" data-testid="password-setter-password">
    <label for={passwordId} class="text-start">{t('common.password')}</label>
    <PasswordField
      bind:this={passwordField}
      bind:password={() => password, handlePasswordEdited}
      id={passwordId}
      name="new-password"
      autocomplete="new-password"
      externalLabel
      {passwordrules}
      describedby={passwordError ? `${passwordId}-error` : undefined}
      invalid={!!passwordError} />
    {#if passwordError}
      <ErrorMessage
        inline
        message={passwordError}
        id="{passwordId}-error"
        role="alert"
        data-testid="password-setter-password-error" />
    {/if}
  </div>
  <div class="gap-xs flex w-full flex-col" data-testid="password-setter-confirmation">
    <label for={confirmationId} class="text-start">{t('common.passwordConfirmation')}</label>
    <PasswordField
      bind:this={confirmationField}
      bind:password={() => passwordConfirmation, handleConfirmationEdited}
      id={confirmationId}
      name="new-password-confirmation"
      autocomplete="new-password"
      externalLabel
      describedby={confirmationError ? `${confirmationId}-error` : undefined}
      invalid={!!confirmationError} />
    {#if confirmationError}
      <ErrorMessage
        inline
        message={confirmationError}
        id="{confirmationId}-error"
        role="alert"
        data-testid="password-setter-confirmation-error" />
    {/if}
  </div>
</form>
