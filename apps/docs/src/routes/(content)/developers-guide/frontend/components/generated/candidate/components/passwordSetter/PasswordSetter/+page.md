# PasswordSetter

Contains a password validator, a password input field and a second confirmation password input field.

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
  }}
/>
```

## Source

[apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte)

[apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.type.ts)
