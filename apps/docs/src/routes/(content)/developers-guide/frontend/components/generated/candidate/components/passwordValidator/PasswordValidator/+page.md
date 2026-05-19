# PasswordValidator

Component for real-time password validation UI.
Password is validated against rules defined in `passwordValidation.ts`.

A progress bar is shown that indicates the number of completed rules.
The progress bar is colored based on the validation state:

There are two types of rules:

- Positive rules: These are basic requirements that must be met for the password to be valid.
  These are always enforced and their status is shown in the UI.
  Completed positive rules are shown in a different color with a checkmark.
- Negative rules: These are rules that are used to prevent bad password practises.
  These can be either enforced or non-enforced. Negative rules are shown if they are violated.

Due to the use of debounced validation, the component will only update after a delay when the user stops typing.
Therefore, the validity should be also checked on form submit as well and on the server side for security reasons.

### Dynamic component

Accesses validation functions from `@openvaa/app-shared`.

### Properties

- `password`: The password to validate.
- `username`: The username used to prevent the password from being too similar. Default: `''`
- `validPassword`: Bindable: Whether the password is valid.
- Any valid attributes of a `<div>` element

### Usage

When using this component, the `validPassword` property should be bound to a boolean variable that is used to enable/disable the submit button.
`password` and `username` should be given as props.

```tsx
<PasswordValidator bind:validPassword={validPassword} password={password} username={username} />
```

## Source

[frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte)

[frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.type.ts)
