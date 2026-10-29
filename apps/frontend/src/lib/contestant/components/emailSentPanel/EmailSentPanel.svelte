<!--
@component The body of the "email sent" screen: fixed sentences saying that an email was sent, to the address it was asked for, and what to do with it, a sentence whose own words lead to support, the screen's one action when it is given, and a status region for assistive technology.

Everything it shows is decided by its properties, and none of them is an answer of the server: the wording says which screen the request was made from, the address is what the user typed, and whether the request was asked again is judged on the page's own clock. The body is therefore the same for an address that was sent an email and for one that was not.

It reads, top to bottom: what was sent, what to check, whom to ask, and the one action.

### Dynamic component

Accesses `ContestantContext` through the support sentence.

### Properties

- `wording`: Which first sentence is shown: `'signIn'` for a sign-in link, `'recovery'` for a password-recovery link, `'code'` for a link mailed to the address a used code was registered with.
- `email`: The address the user typed, named in bold in the first sentence. Without one, and with the `'code'` wording, the first sentence names no address and the sentence that says where to look does not mention a typed address.
- `askedAgain`: Whether to add the sentence saying that this email may not have been sent because another was asked for shortly before. Default: `false`
- `status`: What the polite status region says: `'requested'` when a new email has been asked for, `'ready'` when one can be asked for again. Without one the region is empty.
- `resend`: The screen's one action, rendered last, after the support sentence, e.g. an `EmailSentResend`. Without it no action is rendered.
- Any valid attributes of a `<div>` element.

### Accessibility

- The address is a `<strong>` inside the first sentence, so it is read with the sentence. It is marked as not to be translated and is never hyphenated.
- The address is escaped before it is written into the sentence, and the sentence is sanitised, so a typed address is always text.
- The status region has `role="status"` and `aria-live="polite"`, is always in the document, and is shown to assistive technology alone.

### Usage

```tsx
<EmailSentPanel
  wording={request.wording}
  email={request.email}
  askedAgain={request.askedAgain}
  status={countdown.status}>
  {#snippet resend()}
    <EmailSentResend secondsLeft={countdown.secondsLeft} loading={resending} onresend={handleResend} />
  {/snippet}
</EmailSentPanel>
```
-->

<script lang="ts">
  import { ContactSupport } from '$contestant/components/contactSupport';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { escapeHtml } from '$lib/utils/text/escapeHtml';
  import type { EmailSentPanelProps } from './EmailSentPanel.type';

  let {
    wording,
    email = undefined,
    askedAgain = false,
    status = undefined,
    resend,
    ...restProps
  }: EmailSentPanelProps = $props();

  const { t } = getComponentContext();

  /** The attributes of the bold address inside the first sentence: its test id, and the marks that keep it untranslated, unhyphenated and wrapping anywhere. */
  const ADDRESS_ATTRIBUTES =
    'data-testid="email-sent-address" translate="no" class="[overflow-wrap:anywhere] hyphens-none"';

  /** The address to show, or nothing for an absent or blank one, and nothing for the code wording, whose sentence names none. */
  const address = $derived(wording === 'code' ? undefined : email?.trim() || undefined);

  /** The first sentence with the address in bold: the address is escaped before it is interpolated, its bold element is marked, and the whole sentence is sanitised. */
  const introWithAddress = $derived(
    address === undefined
      ? undefined
      : sanitizeHtml(
          t(
            wording === 'recovery'
              ? 'contestantApp.emailSent.intro.recoveryTo'
              : 'contestantApp.emailSent.intro.signInTo',
            {
              email: escapeHtml(address)
            }
          ).replace('<strong>', `<strong ${ADDRESS_ATTRIBUTES}>`)
        )
  );

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
  {#if introWithAddress}
    <p class="text-center" data-testid="email-sent-intro">{@html introWithAddress}</p>
  {:else}
    <p class="text-center" data-testid="email-sent-intro">{intro}</p>
  {/if}
  <p class="text-center">
    {address ? t('contestantApp.emailSent.notFound.withAddress') : t('contestantApp.emailSent.notFound.withoutAddress')}
  </p>
  <p class="text-center">{t('contestantApp.emailSent.newest')}</p>
  {#if askedAgain}
    <p class="text-center" data-testid="email-sent-asked-again">{t('contestantApp.emailSent.askedAgain')}</p>
  {/if}
  <ContactSupport sentence="contestantApp.emailSent.support" class="mt-lg" data-testid="email-sent-support" />
  {#if resend}
    <div class="mt-lg w-full">
      {@render resend()}
    </div>
  {/if}
  <p class="sr-only" role="status" aria-live="polite" data-testid="email-sent-status">{statusText}</p>
</div>
