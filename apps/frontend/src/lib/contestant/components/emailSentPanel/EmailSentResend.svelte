<!--
@component The one action of the "email sent" screen: a "Send again" button, and under it a line counting the seconds until the button can be pressed.

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
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass, getUUID } from '$lib/utils/components';
  import type { EmailSentResendProps } from './EmailSentResend.type';

  let { secondsLeft, loading = false, onresend, ...restProps }: EmailSentResendProps = $props();

  const { t } = getComponentContext();

  const countdownId = `${getUUID()}-countdown`;

  const waiting = $derived(secondsLeft > 0);
  const unavailable = $derived(waiting || loading);

  function handlePress(): void {
    if (unavailable) return;
    void onresend();
  }
</script>

<div {...concatClass(restProps, 'flex w-full flex-col items-center')}>
  <Button
    type="button"
    text={loading ? t('common.loading') : t('contestantApp.emailSent.resend')}
    aria-disabled={unavailable ? 'true' : undefined}
    aria-busy={loading ? 'true' : undefined}
    aria-describedby={waiting ? countdownId : undefined}
    onclick={handlePress}
    data-testid="email-sent-resend" />
  {#if waiting}
    <p id={countdownId} class="small-info mt-sm text-center" data-testid="email-sent-countdown">
      {t('contestantApp.emailSent.resendWait', { seconds: secondsLeft })}
    </p>
  {/if}
</div>
