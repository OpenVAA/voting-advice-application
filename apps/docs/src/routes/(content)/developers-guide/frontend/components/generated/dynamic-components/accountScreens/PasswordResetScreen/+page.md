# PasswordResetScreen

The password-reset screen both apps render: it lets a signed-in user set a new password. A mailed password-recovery link lands its user on the page of the app the link was asked for in.

- It asks for no current password. Whether it is shown at all is the page's server load's decision.
- The address of the account is shown as text and handed to the password form, where a password manager reads it beside the new password.
- The main button stands outside the form and submits it, so Enter in a field does the same as a press. It can always be pressed once the screen's script has loaded: a press with a password the form does not accept saves nothing, and the field says why.
- A saved password leaves the user signed in and leads to the app's home, with the loads rerun. A failed save is reported as an alert, and the form stays with what was typed.
- The form, the address and the save are the shared `PasswordSaveForm`.
- Beside the main button, the app's support link: the Contestant App's Help page, an email in any other app.

### Properties

- `appName`: The name of the app, shown above the heading.
- `email`: The address of the signed-in account.
- `setPassword`: The app's own store of a new password for the signed-in account.
- `homeHref`: The address of the app's home.
- `testId`: The test id of the screen's root.

### Usage

```tsx
<PasswordResetScreen
  appName={contestantAppName}
  email={data.email}
  {setPassword}
  homeHref={getRoute.current('ContestantAppHome')}
  testId="contestant-password-reset" />
```

## Source

- Component: [apps/frontend/src/lib/dynamic-components/accountScreens/PasswordResetScreen.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/accountScreens/PasswordResetScreen.svelte)
- Types: [apps/frontend/src/lib/dynamic-components/accountScreens/PasswordResetScreen.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/accountScreens/PasswordResetScreen.type.ts)
