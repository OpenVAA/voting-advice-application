<!--@component

# Candidate app preregistration start page

- Shows the steps needed for preregistration.
- Shows a button for opening the authentication provider service.
- Shows a popup prompting the user to log in instead of preregistering again if they've already preregistered.
-->

<svelte:options runes />

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { PreregisteredNotification } from '$candidate/components/preregisteredNotification';
  import { generateChallenge } from '$lib/api/utils/auth/generateChallenge';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { constants } from '$lib/utils/constants';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { constituenciesSelectable, electionsSelectable, getRoute, idTokenClaims, isPreregistered, popupQueue, t } =
    getCandidateContext();
  const { navigationSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Popup management
  ////////////////////////////////////////////////////////////////////

  $effect(() => {
    // Show possible notification
    if ($isPreregistered && !$idTokenClaims)
      popupQueue.push({
        component: PreregisteredNotification
      });
  });

  ////////////////////////////////////////////////////////////////////
  // Build steps, init elections and handle redirection
  ////////////////////////////////////////////////////////////////////

  const steps = [
    t('candidateApp.preregister.identification.start.step.identification'),
    $electionsSelectable ? t('candidateApp.preregister.identification.start.step.electionSelect') : undefined,
    $constituenciesSelectable ? t('candidateApp.preregister.identification.start.step.constituencySelect') : undefined,
    t('candidateApp.preregister.identification.start.step.emailVerification'),
    t('candidateApp.preregister.identification.start.step.passwordSelect')
  ].filter(Boolean);

  const nextRoute = $electionsSelectable
    ? 'CandAppPreregisterElection'
    : $constituenciesSelectable
      ? 'CandAppPreregisterConstituency'
      : 'CandAppPreregisterEmail';

  async function redirectToIdentityProvider() {
    if (!browser) return;

    const redirectUri = `${window.location.origin}${$getRoute('CandAppPreregisterIdentityProviderCallback')}`;

    if (constants.PUBLIC_IDENTITY_PROVIDER_TYPE === 'idura') {
      // Idura: call server-side authorize endpoint for JAR construction
      const response = await fetch('/api/oidc/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirectUri })
      });

      if (!response.ok) {
        console.error('Failed to get authorization URL');
        return;
      }

      const { authorizeUrl } = await response.json();
      window.location.href = authorizeUrl;
    } else {
      // Signicat: client-side PKCE redirect via provider abstraction
      const { codeVerifier, codeChallenge } = await generateChallenge(window.crypto);

      // Call the authorize endpoint to get the provider-constructed URL
      // and store state cookies server-side if the provider returns them
      const response = await fetch('/api/oidc/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirectUri, codeChallenge })
      });

      if (!response.ok) {
        console.error('Failed to get authorization URL');
        return;
      }

      const { authorizeUrl } = await response.json();

      // Store code_verifier in a cookie so the callback server route can access it
      // (localStorage is client-only and not available in server routes)
      document.cookie = `oidc_code_verifier=${codeVerifier}; path=/; max-age=600; secure; samesite=lax`;

      window.location.href = authorizeUrl;
    }
  }

  ////////////////////////////////////////////////////////////////////
  // Top bar
  ////////////////////////////////////////////////////////////////////

  if ($idTokenClaims) navigationSettings.push({ hide: true });
</script>

{#if $idTokenClaims}
  <MainContent title={t('candidateApp.preregister.identification.success.title', $idTokenClaims)}>
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
        onclick={() => goto($getRoute(nextRoute))}
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
      <Button
        text={t('candidateApp.preregister.identification.identifyYourselfButton')}
        variant="main"
        onclick={redirectToIdentityProvider}
        data-testid="preregister-start" />
      <p class="small-info my-md text-center">
        {t('candidateApp.preregister.identification.identifyYourselHelpText')}
      </p>
      <Button href={$getRoute('CandAppLogin')} text={t('common.return')} data-testid="preregister-return" />
    {/snippet}
  </MainContent>
{/if}
