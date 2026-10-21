# EmailSentPanel

The body of the "email sent" screen: fixed sentences saying that an email was sent and what to do with it, the address it was asked for, and a status region for assistive technology.

Everything it shows is decided by its properties, and none of them is an answer of the server: the wording says which screen the request was made from, the address is what the user typed, and whether the request was asked again is judged on the page's own clock. The body is therefore the same for an address that was sent an email and for one that was not.

### Properties

- `wording`: Which first sentence is shown: `'signIn'` for a sign-in link, `'recovery'` for a password-recovery link, `'code'` for a link mailed to the address a used code was registered with.
- `email`: The address the user typed, shown as text under "Sent to". Without one, no address is shown and the last sentence does not mention a typed address.
- `askedAgain`: Whether to add the sentence saying that this email may not have been sent because another was asked for shortly before. Default: `false`
- `status`: What the polite status region says: `'requested'` when a new email has been asked for, `'ready'` when one can be asked for again. Without one the region is empty.
- Any valid attributes of a `<div>` element.

### Accessibility

- The address is a `<dd>` under its label, so it is announced with it. It is marked as not to be translated and is never hyphenated.
- The status region has `role="status"` and `aria-live="polite"`, is always in the document, and is shown to assistive technology alone.

### Usage

```tsx
<EmailSentPanel
  wording={request.wording}
  email={request.email}
  askedAgain={request.askedAgain}
  status={countdown.status}
/>
```

## Source

- Component: [apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentPanel.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentPanel.svelte)
- Types: [apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentPanel.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentPanel.type.ts)
