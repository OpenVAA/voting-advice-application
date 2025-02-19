<!--@component

# Candidate app preregistration start page

- Shows the steps needed for preregistration.
- Shows a button for opening the authentication provider service.
- Shows a popup prompting the user to log in instead of preregistering again if they've already preregistered.
-->

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { generateChallenge } from '$lib/api/utils/auth/generateChallenge';
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

  async function redirectToIdentityProvider() {
    if (!browser) {
      return;
    }

    const { codeVerifier, codeChallenge } = await generateChallenge(window.crypto);
    localStorage.setItem('code_verifier', codeVerifier);

    const clientId = constants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID;
    const authorizationEndpointUri = constants.PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT;
    const redirectUri = `${window.location.origin}${$getRoute('CandAppPreregisterIdentityProviderCallback')}`;
    window.location.href = `${authorizationEndpointUri}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=openid%20profile&prompt=login&code_challenge=${codeChallenge}&code_challenge_method=S256`;
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
