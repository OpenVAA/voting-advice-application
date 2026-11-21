# PasswordSaveForm

The view in which a signed-in user saves a new password: the address of the account, the password form, a failure alert, a button for saving and one other action beside it. What follows a save, and the heading and the other action, are the caller's.

- It asks for no current password.
- The address of the account is shown as text and handed to the password form, where a password manager reads it beside the new password.
- A saved password runs `afterSave`. A failed save is reported as an alert, and the form stays with what was typed.

### Dynamic component

Accesses the component context for its translations, and nothing of any app's context: the app's functions and the address come in as props.

### Properties

- `title`: The page's title, and its first-level heading unless `heading` is given.
- `heading`: Optional content for the title block.
- `children`: Optional content shown above the address of the account.
- `email`: The address of the signed-in account. When it is empty or absent, the label and the address are left out together.
- `setPassword`: The app's own store of a new password for the signed-in account.
- `afterSave`: Run once a password has been saved, and awaited. A rejection is logged.
- `onShadedBg`: Whether the page behind the form is shaded. @default false
- `testId`: The test id of the view's root.
- `emailTestId`: The test id of the shown address.
- `errorTestId`: The test id of the alert shown when a save fails.
- `secondaryAction`: The action beside the main button.
- `status`: Bindable: where a save stands, `'idle'`, `'saving'` or `'failed'`. @default 'idle'
- Any valid properties of a `MainContent` component, such as a `data-` attribute on the root.

### Accessibility

- The address is a `<dd>` under its label, so it is announced with the label.
- The main button stands outside the form and submits it, so Enter in a field does the same as a press. It is unavailable until the view's script runs, and from a press until `afterSave` settles. A press with a password the form does not accept saves nothing, and the field says why.
- A failed save is announced as an alert, and focus stays on the control that had it.

### Usage

```tsx
<PasswordSaveForm
  title={t('contestantApp.setPassword.title')}
  {email}
  {setPassword}
  afterSave={invalidateAll}
  testId="contestant-set-password-gate"
  emailTestId="set-password-email"
  errorTestId="set-password-error"
  bind:status
  data-set-password-state={status}>
  {#snippet secondaryAction()}
    <LogoutButton {logout} icon={undefined} />
  {/snippet}
</PasswordSaveForm>
```

## Source

- Component: [apps/frontend/src/lib/dynamic-components/passwordSaveForm/PasswordSaveForm.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/passwordSaveForm/PasswordSaveForm.svelte)
- Types: [apps/frontend/src/lib/dynamic-components/passwordSaveForm/PasswordSaveForm.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/passwordSaveForm/PasswordSaveForm.type.ts)
