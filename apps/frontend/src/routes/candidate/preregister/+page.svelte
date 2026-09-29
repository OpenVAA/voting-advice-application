<!--@component

# Candidate app preregistration start page

- Shows the steps needed for preregistration.
- Shows a button for opening the authentication provider service.
- Shows a popup prompting the user to log in instead of preregistering again if they've already preregistered.
-->

<script lang="ts">
  import { untrack } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { PreregisteredNotification } from '$candidate/components/preregisteredNotification';
  import { MainContent } from '$layouts/main';
  import { generateChallenge } from '$lib/api/utils/auth/generateChallenge';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { COOKIE } from '$lib/cookies';
  import { constants } from '$lib/utils/constants';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import type { ProviderType } from '$lib/api/utils/auth/providers/types';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Stable references (functions, queues): destructure-safe.
  // Reactive accessors (constituenciesSelectable, electionsSelectable, idTokenClaims, isPreregistered) read via candCtx.X — see CLAUDE.md "Context Destructuring Rule".
  const candCtx = getCandidateContext();
  const { getRoute, popupQueue, t } = candCtx;
  const { navigationSettings } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // Popup management
  ////////////////////////////////////////////////////////////////////

  // ONE-SHOT, AND THE PUSH IS UNTRACKED. Both halves are load-bearing; without either, dismissing the notification does not dismiss it.
  //
  // `PopupState.push` is `this.#queue = [...this.#queue, item]` -- it READS `#queue` before writing it. Called bare inside this `$effect`, that read makes the effect depend on the queue, and the root layout dismisses a popup by calling `popupQueue.shift()`, which reassigns `#queue`. So closing the alert would re-run this effect, whose condition is still true, and push the notification straight back: the ✕ works and the popup reappears in the same frame. `untrack` keeps the write out of this effect's dependency set -- the write-after-read invariant recorded in the runes spike findings.
  //
  // `notified` then makes it a one-shot. `untrack` alone stops the self-retrigger, but `isPreregistered` and `idTokenClaims` are both live accessors, so any later change to either would re-push a notification the user has already dismissed. The flag is a plain `let`, deliberately not `$state`: nothing renders it, and making it reactive would hand this effect another dependency for no gain.
  let notified = false;
  $effect(() => {
    if (notified) return;
    if (candCtx.isPreregistered && !candCtx.idTokenClaims) {
      notified = true;
      untrack(() => popupQueue.push({ component: PreregisteredNotification }));
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Build steps, init elections and handle redirection
  ////////////////////////////////////////////////////////////////////

  const steps = $derived(
    [
      t('candidateApp.preregister.identification.start.step.identification'),
      candCtx.electionsSelectable ? t('candidateApp.preregister.identification.start.step.electionSelect') : undefined,
      candCtx.constituenciesSelectable
        ? t('candidateApp.preregister.identification.start.step.constituencySelect')
        : undefined,
      t('candidateApp.preregister.identification.start.step.emailVerification'),
      t('candidateApp.preregister.identification.start.step.passwordSelect')
    ].filter(Boolean)
  );

  const nextRoute = $derived(
    candCtx.electionsSelectable
      ? 'CandAppPreregisterElection'
      : candCtx.constituenciesSelectable
        ? 'CandAppPreregisterConstituency'
        : 'CandAppPreregisterEmail'
  );

  // The failure detail `ErrorMessage` logs; the user sees the generic error text. `undefined` while there is no failure.
  let providerError = $state<string | undefined>(undefined);

  /**
   * Ask the server for the identity provider's authorization URL.
   * @param body - The callback URI, plus the PKCE challenge when the client generates one.
   * @returns The URL, or `undefined` after recording the failure.
   */
  async function fetchAuthorizeUrl(body: { redirectUri: string; codeChallenge?: string }): Promise<string | undefined> {
    const response = await fetch('/api/oidc/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      providerError = `Failed to get authorization URL: HTTP ${response.status}`;
      return undefined;
    }
    const { authorizeUrl } = await response.json();
    return authorizeUrl;
  }

  async function redirectToIdentityProvider() {
    if (!browser) return;
    providerError = undefined;

    const providerType = constants.PUBLIC_IDENTITY_PROVIDER_TYPE as ProviderType;
    const redirectUri = `${window.location.origin}${getRoute.current('CandAppPreregisterIdentityProviderCallback')}`;

    try {
      switch (providerType) {
        case 'idura-ftn': {
          // Idura: the server builds the signed authorization request.
          const authorizeUrl = await fetchAuthorizeUrl({ redirectUri });
          if (authorizeUrl) window.location.href = authorizeUrl;
          return;
        }
        case 'signicat-ftn': {
          // Signicat: the client generates the PKCE pair and the server builds the URL from the challenge.
          const { codeVerifier, codeChallenge } = await generateChallenge(window.crypto);
          const authorizeUrl = await fetchAuthorizeUrl({ redirectUri, codeChallenge });
          if (!authorizeUrl) return;
          // Store code_verifier in a cookie so the callback server route can access it (localStorage is client-only and not available in server routes)
          document.cookie = `${COOKIE.oidcCodeVerifier}=${codeVerifier}; path=/; max-age=600; secure; samesite=lax`;
          window.location.href = authorizeUrl;
          return;
        }
        default:
          providerError = `Unknown identity provider type: ${constants.PUBLIC_IDENTITY_PROVIDER_TYPE}`;
      }
    } catch (e) {
      providerError = `Failed to start identification: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  ////////////////////////////////////////////////////////////////////
  // Top bar
  ////////////////////////////////////////////////////////////////////

  if (candCtx.idTokenClaims) navigationSettings.use({ hide: true });
</script>

{#if candCtx.idTokenClaims}
  <MainContent title={t('candidateApp.preregister.identification.success.title', candCtx.idTokenClaims)}>
    {#snippet hero()}
      <figure role="presentation">
        <HeroEmoji emoji={t('candidateApp.preregister.identification.success.heroEmoji')} />
      </figure>
    {/snippet}
    <div class="mb-md text-center">
      {@html sanitizeHtml(t('candidateApp.preregister.identification.success.content'))}
    </div>
    {#snippet primaryActions()}
      <Button
        type="submit"
        text={t('common.continue')}
        variant="main"
        onclick={() => goto(getRoute.current(nextRoute))}
        data-testid="preregister-continue" />
    {/snippet}
  </MainContent>
{:else}
  <MainContent title={t('candidateApp.preregister.identification.start.title')}>
    {#snippet hero()}
      <figure role="presentation">
        <HeroEmoji emoji={t('candidateApp.preregister.identification.start.heroEmoji')} />
      </figure>
    {/snippet}
    <div class="mb-md text-center">
      {@html sanitizeHtml(t('candidateApp.preregister.identification.start.content'))}
    </div>
    <ol class="list-circled list-circled-on-shaded my-md w-fit">
      {#each steps as step}
        <li>{step}</li>
      {/each}
    </ol>
    {#snippet primaryActions()}
      {#if providerError}
        <ErrorMessage
          inline
          logMessage={providerError}
          role="alert"
          class="mb-md"
          data-testid="preregister-errorMessage" />
      {/if}
      <Button
        text={t('candidateApp.preregister.identification.identifyYourselfButton')}
        variant="main"
        onclick={redirectToIdentityProvider}
        data-testid="preregister-start" />
      <p class="small-info my-md text-center">
        {t('candidateApp.preregister.identification.identifyYourselHelpText')}
      </p>
      <Button href={getRoute.current('CandAppLogin')} text={t('common.return')} data-testid="preregister-return" />
    {/snippet}
  </MainContent>
{/if}
