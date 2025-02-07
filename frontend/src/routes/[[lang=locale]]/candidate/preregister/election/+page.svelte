<script lang="ts">
  import { Button } from '$lib/components/button';
  import { browser } from '$app/environment';
  import { constants } from '$lib/utils/constants';
  import MainContent from '../../../MainContent.svelte';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { onDestroy } from 'svelte';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { goto } from '$app/navigation';
  import { DEFAULT_DATE_FORMAT } from '../../../../../../../packages/data/src/internal';

  export let data: { claims: { firstName: string; lastName: string } | null };

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appCustomization, darkMode, t, userData, constituenciesSelectable, locale, getRoute } = getCandidateContext(); // TODO: Redirect to (where) if there's user data.
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  const electionDate = new Date(); // TODO: Where does this come from?

  const nextStep = constituenciesSelectable ? 'CandAppPreregisterConstituency' : 'CandAppPreregisterEmail';

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
    if (browser) {
      const clientId = constants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID;
      const redirectUri = `${window.location.origin}${window.location.pathname}/signicat/oidc/callback`;
      window.location.href = `${constants.PUBLIC_SIGNICAT_AUTHORIZE_ENDPOINT}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=openid%20profile&prompt=login`;
    }
  }
</script>

<svelte:head>
  <title>{$t('candidateApp.preregister.identification.start.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

{#if $userData}
  <MainContent title={$t('candidateApp.preregister.identification.start.title')}>
    <div class="mb-md text-center text-warning">
      {@html sanitizeHtml($t('candidateApp.preregister.identification.error.loggedIn.content'))}
    </div>
    <Button
      text={$t('common.continue')}
      variant="main"
      on:click={() => goto($getRoute('CandAppHome'), { invalidateAll: true })} />
  </MainContent>
{:else if data.claims}
  <MainContent title={$t('candidateApp.preregister.electionSelect.title')}>
    <div class="mb-md text-center">
      {@html sanitizeHtml(
        $t('candidateApp.preregister.electionSelect.content', {
          date: electionDate.toLocaleDateString($locale, DEFAULT_DATE_FORMAT)
        })
      )}
    </div>
    <div class="mb-md text-center">TODO: Select component</div>
    <Button type="submit" text={$t('common.continue')} variant="main" on:click={() => goto($getRoute(nextStep))} />
    <Button type="reset" text={$t('common.cancel')} variant="secondary" />
  </MainContent>
{:else}
  <MainContent title={$t('candidateApp.preregister.identification.error.expired.title')}>
    <div class="mb-md text-center">
      {@html sanitizeHtml($t('candidateApp.preregister.identification.error.expired.content'))}
    </div>
    <Button
      text={$t('candidateApp.preregister.identification.identifyYourselfButton')}
      variant="main"
      on:click={redirectToIdentityProvider} />
    <p class="mb-md text-center">{$t('candidateApp.preregister.identification.identifyYourselHelpText')}</p>
  </MainContent>
{/if}
