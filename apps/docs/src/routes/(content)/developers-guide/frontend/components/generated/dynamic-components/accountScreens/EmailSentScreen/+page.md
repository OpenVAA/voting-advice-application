# EmailSentScreen

The "email sent" screen both apps render, after a link was asked for by email from whichever screen of the app asked.

- The screen shows the one link request the app's entry flow holds. Its wording follows the screen the request was made on, its address is the one the user typed, and its count runs on this tab's clock. Nothing of a request's answer is read, so the screen is the same whatever became of the request.
- Without a held request it renders nothing; the page that renders it decides where such a visit leads.
- The body reads top to bottom: what was sent, to the typed address, what to check, a sentence whose words lead to support, and "Send again".
- "Send again" repeats the held request. It is unavailable while the count runs and while a repeated request is in flight.
- "Use another email address" leads back to the screen the address was typed on. It is rendered only for a typed address, and only for an origin the app names a screen for.

### Properties

- `appName`: The name of the app, shown above the heading.
- `request`: The one link request the app's entry flow holds.
- `resendEntryLink`: The app's own way to repeat the held request.
- `addressScreenHrefs`: The address of the screen an address was typed on, by the origin of the request made there.
- `returnHref`: The address of the screen's way back.
- `testId`: The test id of the screen's root.

### Usage

```tsx
<EmailSentScreen
  appName={contestantAppName}
  request={contestantCtx.entryFlow?.request}
  {resendEntryLink}
  addressScreenHrefs={{ forgotPassword: getRoute.current('ContestantAppForgotPassword') }}
  returnHref={getRoute.current('ContestantAppLogin')}
  testId="contestant-email-sent" />
```

## Source

- Component: [apps/frontend/src/lib/dynamic-components/accountScreens/EmailSentScreen.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/accountScreens/EmailSentScreen.svelte)
- Types: [apps/frontend/src/lib/dynamic-components/accountScreens/EmailSentScreen.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/accountScreens/EmailSentScreen.type.ts)
