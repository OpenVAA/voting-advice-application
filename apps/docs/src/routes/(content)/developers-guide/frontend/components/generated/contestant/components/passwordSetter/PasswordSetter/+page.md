# PasswordSetter

The form for choosing a password: the rule list, a password field and its confirmation, in a form a browser and a password manager can read.

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

## Source

- Component: [apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.svelte)
- Types: [apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.type.ts)
