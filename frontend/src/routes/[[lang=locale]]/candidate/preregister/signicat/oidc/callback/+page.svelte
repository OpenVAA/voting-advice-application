<script lang="ts">
  import { page } from '$app/stores';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { goto } from '$app/navigation';
  import MainContent from '../../../../../MainContent.svelte';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { onDestroy } from 'svelte';
  import { getCandidateContext } from '$lib/contexts/candidate';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appCustomization, darkMode, t, getRoute, exchangeAuthorizationCode } = getCandidateContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Handle exchanging the  authorization code
  ////////////////////////////////////////////////////////////////////

  $: authorizationCode = $page.url.searchParams.get('code');

  $: if (authorizationCode) {
    exchangeAuthorizationCode({
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
  <title>{$t('candidateApp.register.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

<MainContent title={$t('candidateApp.register.title')}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('dynamic.appName')}</PreHeading>
  </HeadingGroup>
  <p>Loading...</p>
</MainContent>
