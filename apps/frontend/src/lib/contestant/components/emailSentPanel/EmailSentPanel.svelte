<!--
@component The body of the "email sent" screen: fixed sentences saying that an email was sent and what to do with it, the address it was asked for, and a status region for assistive technology.

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
  status={countdown.status} />
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import type { EmailSentPanelProps } from './EmailSentPanel.type';

  let {
    wording,
    email = undefined,
    askedAgain = false,
    status = undefined,
    ...restProps
  }: EmailSentPanelProps = $props();

  const { t } = getComponentContext();

  /** The address to show, or nothing for an absent or blank one. */
  const address = $derived(email?.trim() || undefined);

  const intro = $derived(
    wording === 'recovery'
      ? t('contestantApp.emailSent.intro.recovery')
      : wording === 'code'
        ? t('contestantApp.emailSent.intro.code')
        : t('contestantApp.emailSent.intro.signIn')
  );

  const statusText = $derived(
    status === 'requested'
      ? t('contestantApp.emailSent.resendRequested')
      : status === 'ready'
        ? t('contestantApp.emailSent.resendReady')
        : ''
  );
</script>

<div {...concatClass(restProps, 'flex w-full flex-col items-center')}>
  <p class="text-center">{intro}</p>
  {#if address}
    <dl class="my-lg text-center">
      <dt class="small-label">{t('contestantApp.emailSent.sentTo')}</dt>
      <dd class="font-bold [overflow-wrap:anywhere] hyphens-none" translate="no" data-testid="email-sent-address">
        {address}
      </dd>
    </dl>
  {/if}
  <p class="text-center">{t('contestantApp.emailSent.newest')}</p>
  <p class="text-center">
    {address ? t('contestantApp.emailSent.notFound.withAddress') : t('contestantApp.emailSent.notFound.withoutAddress')}
  </p>
  {#if askedAgain}
    <p class="text-center" data-testid="email-sent-asked-again">{t('contestantApp.emailSent.askedAgain')}</p>
  {/if}
  <p class="sr-only" role="status" aria-live="polite" data-testid="email-sent-status">{statusText}</p>
</div>
