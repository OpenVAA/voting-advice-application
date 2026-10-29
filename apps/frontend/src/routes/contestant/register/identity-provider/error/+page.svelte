<!--@component

# Contestant app identity provider error page

Shown when identification through the identity provider fails. It says which of three things happened, and only that: the user cancelled, a failure trying again may cure, or one it will not.

- The class comes from the page's server load, which maps the address's `error` parameter through a closed table. The page never sees the parameter, and renders nothing derived from it but the class.
- Each class has its own title, so the route announcement names it, and its own sentence. A cancel is told calmly and without apology.
- In `cancelled` and `retry` the main action is Try again, followed by the class's sentence about support, whose own words are the link to support. In `noRetry` the main action is the support button, with no icon, and Try again is a text link.
- Try again is a link to the registration page with the provider's option open. It is rendered only while the provider's mode is listed; Return to the login screen always is.
- The page is public and is not refused when registration is not offered; a signed-in visitor is sent to the app root by the entry routes' gate.

## Settings

- `contestantApp.registrationModes`, `contestantApp.entityTypes` and `access.answersLocked`: Together they decide, on the server, whether Try again is offered.
- `contestantApp.entityTypes`: The entity types the project serves also decide the app's name above the heading.

-->

<script lang="ts">
  import { ContactSupport } from '$contestant/components/contactSupport';
  import { getContestantAppName } from '$contestant/utils/contestantAppName';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import type { OidcErrorClass } from '$lib/contestant/utils/oidcError';
  import type { TranslationKey } from '$types';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Stable references are destructured. `appSettings` is a reactive accessor, read as `contestantCtx.appSettings` inside each tracking scope: see CLAUDE.md "Context Destructuring Rule".
  const contestantCtx = getContestantContext();
  const { getRoute, t } = contestantCtx;
  const contestantAppName = $derived(getContestantAppName({ appSettings: contestantCtx.appSettings, t }));
  const { pageStyles } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // The class
  ////////////////////////////////////////////////////////////////////

  /** The words of each class: its title, its sentence and the sentence that leads to support, if any. */
  const WORDS: Record<OidcErrorClass, { title: TranslationKey; content: TranslationKey; support?: TranslationKey }> = {
    cancelled: {
      title: 'contestantApp.identityProvider.error.cancelled.title',
      content: 'contestantApp.identityProvider.error.cancelled.content',
      support: 'contestantApp.identityProvider.error.cancelled.support'
    },
    retry: {
      title: 'contestantApp.identityProvider.error.retry.title',
      content: 'contestantApp.identityProvider.error.retry.content',
      support: 'contestantApp.identityProvider.error.retry.support'
    },
    noRetry: {
      title: 'contestantApp.identityProvider.error.noRetry.title',
      content: 'contestantApp.identityProvider.error.noRetry.content'
    }
  };

  const words = $derived(WORDS[data.errorClass]);
  const title = $derived(t(words.title));
  const tryAgainHref = $derived(getRoute.current({ route: 'ContestantAppRegister', mode: 'identity_provider' }));

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
</script>

<MainContent {title} data-testid="contestant-identity-provider-error" data-error-class={data.errorClass}>
  {#snippet heading()}
    <HeadingGroup>
      <PreHeading>{contestantAppName}</PreHeading>
      <h1 tabindex="-1">{title}</h1>
    </HeadingGroup>
  {/snippet}

  <p class="text-center" data-testid="identity-provider-error-message">{t(words.content)}</p>

  {#snippet primaryActions()}
    {#if data.errorClass === 'noRetry'}
      <ContactSupport variant="main" icon={null} />
      {#if data.providerOffered}
        <Button
          href={tryAgainHref}
          text={t('contestantApp.identityProvider.error.tryAgain')}
          data-testid="identity-provider-error-try-again" />
      {/if}
    {:else}
      {#if data.providerOffered}
        <Button
          variant="main"
          href={tryAgainHref}
          text={t('contestantApp.identityProvider.error.tryAgain')}
          data-testid="identity-provider-error-try-again" />
      {/if}
      {#if words.support}
        <ContactSupport
          sentence={words.support}
          class="mt-lg"
          data-testid="contestant-identity-provider-error-support" />
      {/if}
    {/if}
    <Button
      href={getRoute.current('ContestantAppLogin')}
      text={t('common.return')}
      data-testid="identity-provider-error-return" />
  {/snippet}
</MainContent>
