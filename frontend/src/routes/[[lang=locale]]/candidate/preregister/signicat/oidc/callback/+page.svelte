<script lang="ts">
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { goto } from '$app/navigation';
  import { Loading } from '$lib/components/loading';
  import { page } from '$app/stores';
  import MainContent from '../../../../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t, getRoute, exchangeCodeForIdToken } = getCandidateContext();

  ////////////////////////////////////////////////////////////////////
  // Handle exchanging the  authorization code
  ////////////////////////////////////////////////////////////////////

  $: authorizationCode = $page.url.searchParams.get('code');

  $: if (authorizationCode) {
    exchangeCodeForIdToken({
      authorizationCode,
      redirectUri: `${window.location.origin}${window.location.pathname}`
    });
  } else {
    goto($getRoute('CandAppPreregister'));
  }
</script>

<svelte:head>
  <title>{$t('candidateApp.preregister.identification.start.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

<MainContent title=""><Loading /></MainContent>
