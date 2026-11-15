# PasswordSignIn

The password half of a sign-in form: the labelled password field, the message of a refused sign-in and the link to the forgot-password page, in that order. That order is the tab order: the field, its show-or-hide toggle, the link.

The component decides nothing. Its caller says when the field is in error, by setting `error`, and passes the sentence of a refusal as `failure`. Each screen that renders it passes its own test ids.

### Dynamic component

Accesses `ContestantContext`.

### Properties

- `password`: Bindable: The password in the field. Default: `''`
- `error`: Bindable: The message shown at the field while it is in error, e.g. when it was left empty. Cleared when the user edits the field.
- `failure`: The sentence of a refused sign-in, shown under the field. Not shown when empty.
- `failureStatus`: The status a refused sign-in was answered with, rendered as `data-status` on the refusal.
- `id`: The id of the password control. The field's error takes the id `<id>-error`. Default: a generated id
- `errorTestId`: The test id of the field's error.
- `failureTestId`: The test id of the refusal.
- `forgotPasswordTestId`: The test id of the link to the forgot-password page.
- `focus`: Bindable: Function to set focus to the password control.
- Any valid attributes of a `<div>` element.

### Accessibility

- The label is visible and tied to the password control by `for`; the control has no placeholder.
- The control is `aria-invalid` and described by the field's error while that is shown.
- The field's error and the refusal each have `role="alert"`.

### Usage

```tsx
<form id="sign-in" method="POST" novalidate>
  <EmailField bind:value={email} autocomplete="username" />
  <PasswordSignIn
    bind:password
    bind:error={passwordError}
    failure={refusal}
    failureStatus={status}
    errorTestId="login-password-error"
    failureTestId="login-errorMessage"
    forgotPasswordTestId="login-forgot-password-link"
  />
</form>
```

## Source

- Component: [apps/frontend/src/lib/contestant/components/passwordSignIn/PasswordSignIn.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/passwordSignIn/PasswordSignIn.svelte)
- Types: [apps/frontend/src/lib/contestant/components/passwordSignIn/PasswordSignIn.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/passwordSignIn/PasswordSignIn.type.ts)
