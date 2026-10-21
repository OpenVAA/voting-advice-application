# EmailSentResend

The one action of the "email sent" screen: a "Send again" button, and under it a line counting the seconds until the button can be pressed.

While seconds are left, and while a request the button made is in flight, the button is unavailable: it is marked so for assistive technology and a press does nothing. It is never taken out of the tab order, so it keeps focus when a press makes it unavailable. The component does not make the request and is told nothing of its outcome: it calls `onresend` and shows what it is given.

### Properties

- `secondsLeft`: How many seconds are left before another email can be asked for. The button is unavailable while any are left.
- `loading`: Whether a request the button made is still in flight. The button is unavailable meanwhile and reads as loading. Default: `false`
- `onresend`: Called when the button is pressed while it is available.
- Any valid attributes of a `<div>` element.

### Accessibility

- While unavailable the button is `aria-disabled` and still a tab stop. It is never natively `disabled`, which would drop the focus it holds.
- While seconds are left the button is described by the line that counts them. The line is not a live region, so the count itself is not announced every second.
- While a request is in flight the button is `aria-busy`.

### Usage

```tsx
<EmailSentResend secondsLeft={countdown.secondsLeft} loading={resending} onresend={handleResend} />
```

## Source

- Component: [apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentResend.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentResend.svelte)
- Types: [apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentResend.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentResend.type.ts)
