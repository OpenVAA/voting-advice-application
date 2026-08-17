# PasswordField

PasswordField is an input box for password that comes with a button to reveal and hide the password

### Properties

- `id`: Optional id for the input.
- `password`: Bindable: The password value.
- `autocomplete`: The autocomplete value for password input. Default: `''`
- `label`: The label for the password field.
- `externalLabel`: Whether the label is outside the component and should not be rendered inside. Default: `false`
- `focus`: Bindable: Function to set focus to the password input.
- Any valid attributes of a `<div>` element

### Usage

```tsx
<PasswordField bind:password={passwordOfContext} autocomplete="current-password" />
```

## Source

[frontend/src/lib/candidate/components/passwordField/PasswordField.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/candidate/components/passwordField/PasswordField.svelte)

[frontend/src/lib/candidate/components/passwordField/PasswordField.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/candidate/components/passwordField/PasswordField.type.ts)
