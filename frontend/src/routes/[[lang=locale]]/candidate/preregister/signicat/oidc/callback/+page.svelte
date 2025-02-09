<script lang="ts">
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { goto } from '$app/navigation';
  import { Loading } from '$lib/components/loading';
  import { onDestroy } from 'svelte';
  import { page } from '$app/state';
  import MainContent from '../../../../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appCustomization, darkMode, t, getRoute, exchangeCodeForIdToken } = getCandidateContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Handle exchanging the  authorization code
  ////////////////////////////////////////////////////////////////////

  $: authorizationCode = page.url.searchParams.get('code');

  $: if (authorizationCode) {
    exchangeCodeForIdToken({
      authorizationCode,
      redirectUri: `${window.location.origin}${window.location.pathname}`
    });
  } else {
    goto($getRoute('CandAppPreregister'));
  }

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    imageSrc: $darkMode
      ? ($appCustomization.candPoster?.urlDark ?? $appCustomization.candPoster?.url ?? '/images/hero-candidate.png')
      : ($appCustomization.candPoster?.url ?? '/images/hero-candidate.png')
  });
</script>

<svelte:head>
  <title>{$t('candidateApp.preregister.identification.start.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

<MainContent title={$t('candidateApp.preregister.identification.start.title')}><Loading /></MainContent>
