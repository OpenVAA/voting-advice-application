<!--
@component A "Send again" button whose label is followed by the seconds until it can be pressed, "Send again (in 12s)": the one action of the "email sent" screen, and the action that mails the link of an address awaiting confirmation again.

While seconds are left, and while a request the button made is in flight, the button is unavailable: it is marked so for assistive technology and a press does nothing. It is never taken out of the tab order, so it keeps focus when a press makes it unavailable. The component does not make the request and is told nothing of its outcome: it calls `onresend` and shows what it is given.

### Properties

- `secondsLeft`: How many seconds are left before another email can be asked for. The button is unavailable while any are left.
- `loading`: Whether a request the button made is still in flight. The button is unavailable meanwhile and reads as loading. Default: `false`
- `onresend`: Called when the button is pressed while it is available.
- `resendTestId`: The test id of the button. Default: `'email-sent-resend'`
- `countdownTestId`: The test id of the suffix that counts the seconds. Default: `'email-sent-countdown'`
- Any valid attributes of a `<div>` element.

### Tracking events

- `emailSent_resend`: Sent when the button is pressed while it is available.

### Accessibility

- While unavailable the button is `aria-disabled` and still a tab stop. It is never natively `disabled`, which would drop the focus it holds.
- While seconds are left the count is part of the button's name and nothing else: it is neither the button's description nor a live region, so focus reads it once.
- While a request is in flight the button is `aria-busy`.

### Usage

```tsx
<EmailSentResend secondsLeft={countdown.secondsLeft} loading={resending} onresend={handleResend} />
```
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import type { EmailSentResendProps } from './EmailSentResend.type';

  let {
    secondsLeft,
    loading = false,
    onresend,
    resendTestId = 'email-sent-resend',
    countdownTestId = 'email-sent-countdown',
    ...restProps
  }: EmailSentResendProps = $props();

  const { t } = getComponentContext();
  const { track } = getAppContext();

  const waiting = $derived(secondsLeft > 0);
  const unavailable = $derived(waiting || loading);
  /** The count is shown while seconds are left, and not while the button reads as loading. */
  const counting = $derived(waiting && !loading);

  function handlePress(): void {
    if (unavailable) return;
    track('emailSent_resend');
    void onresend();
  }
</script>

<div {...concatClass(restProps, 'flex w-full flex-col items-center')}>
  <Button
    type="button"
    text={loading ? t('common.loading') : t('common.account.emailSent.resend')}
    suffix={counting ? t('common.account.emailSent.resendIn', { seconds: secondsLeft }) : undefined}
    suffixProps={{ 'data-testid': countdownTestId }}
    aria-disabled={unavailable ? 'true' : undefined}
    aria-busy={loading ? 'true' : undefined}
    onclick={handlePress}
    data-testid={resendTestId} />
</div>
