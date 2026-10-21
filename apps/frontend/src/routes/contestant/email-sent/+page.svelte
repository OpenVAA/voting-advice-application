<!--@component

# Contestant app "email sent" page

Shown after a link was asked for by email, whichever screen asked: the sign-in screen, the registration screens or the forgot-password page.

- The page shows the one link request the entry flow holds. Its wording follows the screen the request was made on, its address is the one the user typed, and its count runs on this tab's clock. Nothing of a request's answer is read, so the page is the same whatever became of the request.
- While the entry flow holds no request, as after a reload or a visit by address, the page renders nothing and leads to the login screen in place of this history entry.
- "Send again" repeats the held request. It is unavailable while the count runs and while a repeated request is in flight.
- "Use another email address" leads back to the screen the address was typed on. It is rendered only for a typed address.

-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { ContactSupport } from '$contestant/components/contactSupport';
  import { EmailSentPanel, EmailSentResend, ResendCountdown } from '$contestant/components/emailSentPanel';
  import { getContestantAppName } from '$contestant/utils/contestantAppName';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import type { EntryOrigin } from '$lib/contestant/entryFlow';
  import type { Route } from '$lib/routes';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Stable references are destructured. `entryFlow` and `appSettings` are reactive accessors, read as `contestantCtx.X` inside each tracking scope: see CLAUDE.md "Context Destructuring Rule".
  const contestantCtx = getContestantContext();
  const { getRoute, resendEntryLink, t } = contestantCtx;
  const contestantAppName = $derived(getContestantAppName({ appSettings: contestantCtx.appSettings, t }));
  const { pageStyles } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // The held request
  ////////////////////////////////////////////////////////////////////

  /** The screen an address was typed on, by the origin of the request made there. An origin with no entry has no such screen. */
  const ADDRESS_SCREENS: Partial<Record<EntryOrigin, Route>> = {
    signIn: 'ContestantAppSignIn',
    register: 'ContestantAppRegister',
    registerEmail: 'ContestantAppRegisterEmail',
    forgotPassword: 'ContestantAppForgotPassword'
  };

  // The flow is replaced whole on every write, so this alias follows it.
  const request = $derived(contestantCtx.entryFlow?.request);
  /** The address shown: the one the user typed. A request made with a code alone has none, and the wording for it shows none. */
  const address = $derived(request && request.wording !== 'code' ? request.email?.trim() || undefined : undefined);
  const addressScreen = $derived(request && address ? ADDRESS_SCREENS[request.origin] : undefined);

  $effect(() => {
    if (!contestantCtx.entryFlow?.request) void goto(getRoute.current('ContestantAppLogin'), { replaceState: true });
  });

  ////////////////////////////////////////////////////////////////////
  // Asking again
  ////////////////////////////////////////////////////////////////////

  const countdown = new ResendCountdown(() => contestantCtx.entryFlow?.request?.settledAt);
  let resending = $state(false);

  onMount(() => {
    countdown.start();
    return () => countdown.stop();
  });

  async function handleResend(): Promise<void> {
    countdown.markRequested();
    resending = true;
    await resendEntryLink();
    resending = false;
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
</script>

{#if request}
  <MainContent
    title={t('contestantApp.emailSent.title')}
    data-testid="contestant-email-sent"
    data-wording={request.wording}
    data-address={address ? 'shown' : 'none'}
    data-resend={countdown.ready ? 'ready' : 'waiting'}>
    {#snippet hero()}
      <figure role="presentation">
        <HeroEmoji emoji={t('contestantApp.emailSent.heroEmoji')} />
      </figure>
    {/snippet}

    {#snippet heading()}
      <HeadingGroup>
        <PreHeading>{contestantAppName}</PreHeading>
        <h1 tabindex="-1">{t('contestantApp.emailSent.title')}</h1>
      </HeadingGroup>
    {/snippet}

    <EmailSentPanel
      wording={request.wording}
      email={address}
      askedAgain={request.askedAgain}
      status={countdown.status} />

    {#snippet primaryActions()}
      <EmailSentResend secondsLeft={countdown.secondsLeft} loading={resending} onresend={handleResend} />
      <ContactSupport variant="normal" class="mt-lg">
        <p class="text-center">{t('contestantApp.emailSent.support')}</p>
      </ContactSupport>
      {#if addressScreen}
        <Button
          href={getRoute.current(addressScreen)}
          text={t('contestantApp.emailSent.changeAddress')}
          data-testid="email-sent-change-address" />
      {/if}
      <Button href={getRoute.current('ContestantAppLogin')} text={t('common.return')} data-testid="email-sent-return" />
    {/snippet}
  </MainContent>
{/if}
