# PendingAddressPanel

What a screen shows under an address awaiting its confirmation link: "Send again", which mails the link once more, "Use another email address", and a polite status region that says when a new email has been asked for and when another can be asked for.

"Send again" is available on arrival, and after a press unavailable until a count of `RESEND_WAIT_SECONDS` from the request's settlement has ended. The count belongs to the panel, so it runs on while the caller hides the buttons with `hideActions` or shows its form in their place with `changeForm`; only unmounting the panel resets it. Render the panel for as long as the address is pending, and use those two properties for the switches within that time.

The panel decides nothing else. "Use another email address" calls `onchangeaddress`, and the caller shows the email form. Each screen that renders it passes its own test ids.

### Dynamic component

Accesses `ContestantContext`: `registerIdentityProviderAccount` and `t`.

### Properties

- `onchangeaddress`: Called when "Use another email address" is pressed.
- `testIds`: The test ids of "Send again", of the count in its label, of "Use another email address" and of the status region.
- `hideActions`: Whether "Send again" and "Use another email address" are left out. The status region and the count stay. Default: `false`
- `changeForm`: Shown in place of "Use another email address", under "Send again".
- Any valid attributes of a `<div>` element.

### Accessibility

- "Send again" keeps focus when pressed. While unavailable it is `aria-disabled`, still a tab stop, and its label ends with the seconds left, which also describe it.
- The status region is always rendered, so that a message put into it is announced.

### Usage

```tsx
<PendingAddressPanel
  onchangeaddress={handleChangeAddress}
  testIds={{
    resend: 'settings-email-pending-resend',
    countdown: 'settings-email-pending-countdown',
    change: 'settings-email-pending-change',
    status: 'settings-email-pending-status'
  }}
  changeForm={changingEmail ? emailForm : undefined}
/>
```

## Source

- Component: [apps/frontend/src/lib/contestant/components/pendingAddressPanel/PendingAddressPanel.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/pendingAddressPanel/PendingAddressPanel.svelte)
- Types: [apps/frontend/src/lib/contestant/components/pendingAddressPanel/PendingAddressPanel.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/pendingAddressPanel/PendingAddressPanel.type.ts)
