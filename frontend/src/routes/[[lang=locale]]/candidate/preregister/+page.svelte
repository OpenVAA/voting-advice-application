<!--@component

# Candidate app preregistration start page

- Shows the steps needed for preregistration.
- Shows a button for opening the authentication provider service.
- Shows a popup prompting the user to log in instead of preregistering again if they've already preregistered.
-->

<script lang="ts">
  import { browser } from '$app/environment';
  import { Button } from '$lib/components/button';
  import { constants } from '$lib/utils/constants';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { goto } from '$app/navigation';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../../MainContent.svelte';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { onDestroy, onMount } from 'svelte';
  import { PreregisteredNotification } from '$candidate/components/preregisteredNotification';

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

  async function redirectToIdentityProvider() {
    if (!browser) {
      return;
    }
    const clientId = constants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID;
    const redirectUri = `${window.location.origin}/${$locale}/candidate/preregister/signicat/oidc/callback`; // TODO: Shorter URI.
    window.location.href = `${constants.PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=openid%20profile&prompt=login`;
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
      <p class="my-md text-center small-info">
        {$t('candidateApp.preregister.identification.identifyYourselHelpText')}
      </p>
    </svelte:fragment>
  </MainContent>

{/if}
