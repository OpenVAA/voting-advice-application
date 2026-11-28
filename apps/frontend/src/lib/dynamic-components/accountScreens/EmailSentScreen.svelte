<!--
@component The "email sent" screen both apps render, after a link was asked for by email from whichever screen of the app asked.

- The screen shows the one link request the app's entry flow holds. Its wording follows the screen the request was made on, its address is the one the user typed, and its count runs on this tab's clock. Nothing of a request's answer is read, so the screen is the same whatever became of the request.
- Without a held request it renders nothing; the page that renders it decides where such a visit leads.
- The body reads top to bottom: what was sent, to the typed address, what to check, a sentence whose words lead to support, and "Send again".
- "Send again" repeats the held request. It is unavailable while the count runs and while a repeated request is in flight.
- A repeat the function refused because the caller has made more requests than its limit admits is shown below "Send again" as a sentence naming the wait, in whole minutes rounded up, and the status says nothing. The status changes only once the function has answered, so it never says an email was requested for a repeat that is refused. The refusal comes before the address is read, so it says nothing about the address. The sentence goes at the next press.
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
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getComponentContext } from '$lib/contexts/component';
  import { EmailSentPanel, EmailSentResend, ResendCountdown } from '$lib/dynamic-components/emailSentPanel';
  import type { EmailSentScreenProps } from './EmailSentScreen.type';

  let { appName, request, resendEntryLink, addressScreenHrefs, returnHref, testId }: EmailSentScreenProps = $props();

  const { t } = getComponentContext();

  /** The address shown: the one the user typed. A request made with a code alone has none, and the wording for it shows none. */
  const address = $derived(request && request.wording !== 'code' ? request.email?.trim() || undefined : undefined);
  const addressScreenHref = $derived(request && address ? addressScreenHrefs[request.origin] : undefined);

  const countdown = new ResendCountdown(() => request?.settledAt);
  let resending = $state(false);
  /** The sentence naming the wait of a repeat refused over the per-caller limit. */
  let refusalText = $state<string>();

  onMount(() => {
    countdown.start();
    return () => countdown.stop();
  });

  async function handleResend(): Promise<void> {
    refusalText = undefined;
    resending = true;
    const retryAfterSeconds = (await resendEntryLink())?.retryAfterSeconds;
    resending = false;
    if (retryAfterSeconds === undefined) {
      countdown.markRequested();
      return;
    }
    countdown.markRefused();
    refusalText = t('common.account.tooManyAttempts', { minutes: Math.ceil(retryAfterSeconds / 60) });
  }
</script>

{#if request}
  <MainContent
    title={t('common.account.emailSent.title')}
    data-testid={testId}
    data-wording={request.wording}
    data-address={address ? 'shown' : 'none'}
    data-resend={countdown.ready ? 'ready' : 'waiting'}>
    {#snippet hero()}
      <figure role="presentation">
        <HeroEmoji emoji={t('common.account.emailSent.heroEmoji')} />
      </figure>
    {/snippet}

    {#snippet heading()}
      <HeadingGroup>
        <PreHeading>{appName}</PreHeading>
        <h1 tabindex="-1">{t('common.account.emailSent.title')}</h1>
      </HeadingGroup>
    {/snippet}

    <EmailSentPanel
      wording={request.wording}
      email={address}
      askedAgain={request.askedAgain}
      status={countdown.status}
      data-testid="email-sent-panel">
      {#snippet resend()}
        <EmailSentResend secondsLeft={countdown.secondsLeft} loading={resending} onresend={handleResend} />
        {#if refusalText}
          <p class="text-error mt-sm text-center" role="alert" data-testid="email-sent-resend-refused">{refusalText}</p>
        {/if}
      {/snippet}
    </EmailSentPanel>

    {#snippet primaryActions()}
      {#if addressScreenHref}
        <Button
          href={addressScreenHref}
          text={t('common.account.emailSent.changeAddress')}
          data-testid="email-sent-change-address" />
      {/if}
      <Button href={returnHref} text={t('common.return')} data-testid="email-sent-return" />
    {/snippet}
  </MainContent>
{/if}
