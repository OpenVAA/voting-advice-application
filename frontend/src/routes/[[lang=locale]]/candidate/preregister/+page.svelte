<!--@component

# Candidate app preregistration start page

- Shows the steps needed for preregistration.
- Shows a button for opening the authentication provider service.
- Shows a popup prompting the user to log in instead of preregistering again if they've already preregistered.
-->

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { PreregisteredNotification } from '$candidate/components/preregisteredNotification';
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

  const {
    constituenciesSelectable,
    dataRoot,
    electionsSelectable,
    getRoute,
    idTokenClaims,
    isPreregistered,
    locale,
    popupQueue,
    preregistrationElectionIds,
    t
  } = getCandidateContext();
  const { navigationSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Popup management
  ////////////////////////////////////////////////////////////////////

  onMount(() => {
    // Show possible notification
    if ($isPreregistered && !$idTokenClaims)
      popupQueue.push({
        component: PreregisteredNotification
      });
  });

  ////////////////////////////////////////////////////////////////////
  // Build steps, init elections and handle redirection
  ////////////////////////////////////////////////////////////////////

  $preregistrationElectionIds = $dataRoot.elections.map(({ id }) => id);

  const steps = [
    $t('candidateApp.preregister.identification.start.step.identification'),
    $electionsSelectable ? $t('candidateApp.preregister.identification.start.step.electionSelect') : undefined,
    $constituenciesSelectable ? $t('candidateApp.preregister.identification.start.step.constituencySelect') : undefined,
    $t('candidateApp.preregister.identification.start.step.emailVerification'),
    $t('candidateApp.preregister.identification.start.step.passwordSelect')
  ].filter(Boolean);

  const nextRoute = $electionsSelectable
    ? 'CandAppPreregisterElection'
    : $constituenciesSelectable
      ? 'CandAppPreregisterConstituency'
      : 'CandAppPreregisterEmail';

  function toBase64(arrayBuffer: Uint8Array<ArrayBuffer>) {
    return btoa(String.fromCharCode(...arrayBuffer))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  async function generatePKCE() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    const codeVerifier = toBase64(array);

    return {
      codeVerifier,
      codeChallenge: toBase64(
        new Uint8Array(await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier)))
      )
    };
  }

  async function redirectToIdentityProvider() {
    if (!browser) {
      return;
    }
    const clientId = constants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID;
    const redirectUri = `${window.location.origin}/${$locale}/candidate/preregister/signicat/oidc/callback`; // TODO: Shorter URI.
    const { codeVerifier, codeChallenge } = await generatePKCE();
    localStorage.setItem('codeVerifier', codeVerifier);
    window.location.href = `${constants.PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=openid%20profile&prompt=login&code_challenge=${codeChallenge}&code_challenge_method=S256`;
  }

  ////////////////////////////////////////////////////////////////////
  // Top bar
  ////////////////////////////////////////////////////////////////////

  if ($idTokenClaims) navigationSettings.push({ hide: true });
</script>

{#if $idTokenClaims}
  <MainContent title={$t('candidateApp.preregister.identification.success.title', $idTokenClaims)}>
    <figure role="presentation" slot="hero">
      <HeroEmoji emoji={$t('candidateApp.preregister.identification.success.heroEmoji')} />
    </figure>
    <div class="mb-md text-center">
      {@html sanitizeHtml($t('candidateApp.preregister.identification.success.content'))}
    </div>
    <Button
      slot="primaryActions"
      type="submit"
      text={$t('common.continue')}
      variant="main"
      on:click={() => goto($getRoute(nextRoute))} />
  </MainContent>
{:else}
  <MainContent title={$t('candidateApp.preregister.identification.start.title')}>
    <figure role="presentation" slot="hero">
      <HeroEmoji emoji={$t('candidateApp.preregister.identification.start.heroEmoji')} />
    </figure>
    <div class="mb-md text-center">
      {@html sanitizeHtml($t('candidateApp.preregister.identification.start.content'))}
    </div>
    <ol class="list-circled list-circled-on-shaded my-md w-fit">
      {#each steps as step}
        <li>{step}</li>
      {/each}
    </ol>
    <svelte:fragment slot="primaryActions">
      <Button
        text={$t('candidateApp.preregister.identification.identifyYourselfButton')}
        variant="main"
        on:click={redirectToIdentityProvider} />
      <p class="small-info my-md text-center">
        {$t('candidateApp.preregister.identification.identifyYourselHelpText')}
      </p>
      <Button href={$getRoute('CandAppLogin')} text={$t('common.return')} />
    </svelte:fragment>
  </MainContent>
{/if}
