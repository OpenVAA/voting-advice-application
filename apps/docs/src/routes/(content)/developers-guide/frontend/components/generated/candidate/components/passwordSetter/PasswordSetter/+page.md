# PasswordSetter

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
<PasswordSetter bind:password={password} bind:valid={canSubmit} />
```

## Source

[frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte)

[frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.type.ts)
