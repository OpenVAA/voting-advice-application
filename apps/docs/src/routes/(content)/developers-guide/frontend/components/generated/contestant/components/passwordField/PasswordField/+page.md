# PasswordField

PasswordField is an input box for password that comes with a button to reveal and hide the password

### Properties

- `id`: Optional id for the input.
- `password`: Bindable: The password value.
- `name`: The name the input is submitted under. Two password fields in one form need different names. Default: `'password'`
- `autocomplete`: The autocomplete value for password input. Default: `''`
- `label`: The label for the password field.
- `externalLabel`: Whether the label is outside the component and should not be rendered inside. With an outside label the input has no placeholder either: the visible label names it. Default: `false`
- `describedby`: The ids of the elements that describe the input, e.g. its error message. Rendered as the input's `aria-describedby`.
- `invalid`: Whether the input is in error. Rendered as the input's `aria-invalid`. Default: `false`
- `passwordrules`: A rule string for browsers that suggest passwords, e.g. `'minlength: 8; required: digit;'`. Rendered as the input's `passwordrules`, an attribute outside the HTML standard that some browsers read. Not rendered when not given.
- `focus`: Bindable: Function to set focus to the password input.
- Any valid attributes of a `<div>` element

### Usage

```tsx
<PasswordField bind:password={passwordOfContext} autocomplete="current-password" />

<label for="new-password">{t('common.password')}</label>
<PasswordField
  bind:password
  id="new-password"
  name="new-password"
  autocomplete="new-password"
  externalLabel
  describedby={error ? 'new-password-error' : undefined}
  invalid={!!error} />
```

## Source

- Component: [apps/frontend/src/lib/contestant/components/passwordField/PasswordField.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/passwordField/PasswordField.svelte)
- Types: [apps/frontend/src/lib/contestant/components/passwordField/PasswordField.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/passwordField/PasswordField.type.ts)
