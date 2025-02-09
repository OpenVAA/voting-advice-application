<script lang="ts">
  import { browser } from '$app/environment';
  import { Button } from '$lib/components/button';
  import { constants } from '$lib/utils/constants';
  import { DEFAULT_DATE_FORMAT } from '../../../../../../packages/data/src/internal';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { goto } from '$app/navigation';
  import { onDestroy } from 'svelte';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const {
    appCustomization,
    constituenciesSelectable,
    darkMode,
    dataRoot,
    electionsSelectable,
    getRoute,
    idTokenClaims,
    locale,
    preselectedElections,
    t
  } = getCandidateContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  $preselectedElections = $dataRoot.elections.map(({ id }) => id);

  const publicationDate = new Date(); // TODO: Where does this come from?

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

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    imageSrc: $darkMode
      ? ($appCustomization.candPoster?.urlDark ?? $appCustomization.candPoster?.url ?? '/images/hero-candidate.png')
      : ($appCustomization.candPoster?.url ?? '/images/hero-candidate.png')
  });

  async function redirectToIdentityProvider() {
    if (!browser) {
      return;
    }
    const clientId = constants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID;
    const redirectUri = `${window.location.origin}/${$locale}/candidate/preregister/signicat/oidc/callback`; // TODO: Shorter URI.
    window.location.href = `${constants.PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=openid%20profile&prompt=login`;
  }
</script>

<svelte:head>
  <title>{$t('candidateApp.preregister.identification.start.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

{#if $idTokenClaims}
  <MainContent title={$t('candidateApp.preregister.identification.success.title')}>
    <div class="mb-md text-center">
      {@html sanitizeHtml($t('candidateApp.preregister.identification.success.content', $idTokenClaims))}
    </div>
    <Button type="submit" text={$t('common.continue')} variant="main" on:click={() => goto($getRoute(nextRoute))} />
    <Button
      type="reset"
      text={$t('common.cancel')}
      variant="secondary"
      on:click={() => {
        /* TODO: Clear the ID token. */
      }} />
  </MainContent>
{:else}
  <MainContent title={$t('candidateApp.preregister.identification.start.title')}>
    <div class="mb-md text-center">
      {@html sanitizeHtml(
        $t('candidateApp.preregister.identification.start.content', {
          date: publicationDate.toLocaleDateString($locale, DEFAULT_DATE_FORMAT)
        })
      )}
    </div>
    <ol class="list-circled mb-md w-fit">
      {#each steps as step}
        <li>{step}</li>
      {/each}
    </ol>
    <Button
      text={$t('candidateApp.preregister.identification.identifyYourselfButton')}
      variant="main"
      on:click={redirectToIdentityProvider} />
    <p class="mb-md text-center text-xs text-secondary">
      {$t('candidateApp.preregister.identification.identifyYourselHelpText')}
    </p>
  </MainContent>
{/if}
