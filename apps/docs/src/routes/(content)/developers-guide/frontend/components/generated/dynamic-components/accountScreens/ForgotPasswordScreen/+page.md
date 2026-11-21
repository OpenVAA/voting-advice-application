# ForgotPasswordScreen

The forgot-password screen both apps render: it takes an email address and asks for a mail with which to set a new password.

- A press of the main button with an address that cannot be used sends nothing: the field says what to enter and takes focus.
- With a usable address the screen asks for a password-recovery link with the trimmed address, and opens the app's "email sent" page when the request has settled, whatever it settled as. Nothing about the address is looked up, and nothing of the request's answer is read: the screen shows the same to every visitor, whether or not the address has an account.
- The form is declared as a post although no server action answers it, so that a submit the screen's script did not catch could not write an address into the address bar. The main button needs the script, so it is natively disabled until the screen has mounted.
- The page's `email` search parameter fills the field once, when the screen is created, as the login screens' links pass the address typed there. Nothing is asked for until the main button is pressed.

### Properties

- `appName`: The name of the app, shown above the heading.
- `sendEntryLink`: The app's own way to ask for a mailed link, as its context's entry flow holds it.
- `emailSentHref`: The address of the app's "email sent" page.
- `returnHref`: The address of the screen's way back.
- `testId`: The test id of the screen's root.

### Usage

```tsx
<ForgotPasswordScreen
  appName={contestantAppName}
  {sendEntryLink}
  emailSentHref={getRoute.current('ContestantAppEmailSent')}
  returnHref={getRoute.current('ContestantAppSignIn')}
  testId="contestant-forgot-password" />
```

## Source

- Component: [apps/frontend/src/lib/dynamic-components/accountScreens/ForgotPasswordScreen.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/accountScreens/ForgotPasswordScreen.svelte)
- Types: [apps/frontend/src/lib/dynamic-components/accountScreens/ForgotPasswordScreen.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/accountScreens/ForgotPasswordScreen.type.ts)
