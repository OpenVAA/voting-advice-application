# SetPasswordGate

Ask a signed-in user whose account has no password to choose one: why, the address of the account, the password form, a button for saving the password and another for logging out. Saving stores the password and reruns the page's loads, so the next gate or the page the user asked for replaces this view. A failed save is reported and the form stays, with what was typed.

The view cannot be put aside: it offers no way to continue without a password, and only a rerun load that reads a stored password removes it. Logging out is always available and asks nothing.

Each app renders it through a wrapper of its own that reads that app's context and passes in the address, the app's `setPassword` and its sign-out. Its Log out is the shared `LogoutButton`.

### Dynamic component

Accesses the component context for its translations, and nothing of any app's context: the app's functions and the address come in as props.

### Properties

- `email`: The address of the signed-in account. When it is empty or absent, the label and the address are left out together.
- `setPassword`: The app's own store of a new password for the signed-in account.
- `logout`: The app's own sign-out, as the shared `LogoutButton` takes it. A rejection is logged and the view stays.
- `redirectTo`: Where the Log out leaves to after a sign-out that worked, for an app whose `logout` does not navigate.
- `onSaved`: Called once a password has been saved, before the page's loads are rerun.
- `testId`: The test id of the view's root.

### Accessibility

- The title is the page's first-level heading and can take focus, so the layout can move focus to it when this view replaces another.
- The address is a `<dd>` under its label, so it is announced with the label. It is never hyphenated or translated, and it wraps at any character rather than overflowing.
- The main button stands outside the form and submits it, so Enter in a field does the same as a press. It is unavailable until the view's script runs, and from a press until the next view is shown.
- A failed save is announced as an alert, and focus stays on the control that had it.

### Usage

```tsx
<SetPasswordGate
  email={ctx.user?.email}
  setPassword={setPassword}
  {logout}
  onSaved={clearEntryFlow}
  testId="contestant-set-password-gate" />
```

## Source

- Component: [apps/frontend/src/lib/dynamic-components/gates/SetPasswordGate.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/gates/SetPasswordGate.svelte)
- Types: [apps/frontend/src/lib/dynamic-components/gates/SetPasswordGate.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/gates/SetPasswordGate.type.ts)
