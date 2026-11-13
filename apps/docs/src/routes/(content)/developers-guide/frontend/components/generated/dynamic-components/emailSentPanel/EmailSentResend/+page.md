# EmailSentResend

A "Send again" button whose label is followed by the seconds until it can be pressed, "Send again (in 12s)": the one action of the "email sent" screen, and the action that mails the link of an address awaiting confirmation again.

While seconds are left, and while a request the button made is in flight, the button is unavailable: it is marked so for assistive technology and a press does nothing. It is never taken out of the tab order, so it keeps focus when a press makes it unavailable. The component does not make the request and is told nothing of its outcome: it calls `onresend` and shows what it is given.

### Properties

- `secondsLeft`: How many seconds are left before another email can be asked for. The button is unavailable while any are left.
- `loading`: Whether a request the button made is still in flight. The button is unavailable meanwhile and reads as loading. Default: `false`
- `onresend`: Called when the button is pressed while it is available.
- `resendTestId`: The test id of the button. Default: `'email-sent-resend'`
- `countdownTestId`: The test id of the suffix that counts the seconds. Default: `'email-sent-countdown'`
- Any valid attributes of a `<div>` element.

### Accessibility

- While unavailable the button is `aria-disabled` and still a tab stop. It is never natively `disabled`, which would drop the focus it holds.
- While seconds are left the count is part of the button's name, and the button is also described by it. The count is not a live region, so it is not announced every second.
- While a request is in flight the button is `aria-busy`.

### Usage

```tsx
<EmailSentResend secondsLeft={countdown.secondsLeft} loading={resending} onresend={handleResend} />
```

## Source

- Component: [apps/frontend/src/lib/dynamic-components/emailSentPanel/EmailSentResend.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/emailSentPanel/EmailSentResend.svelte)
- Types: [apps/frontend/src/lib/dynamic-components/emailSentPanel/EmailSentResend.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/emailSentPanel/EmailSentResend.type.ts)
