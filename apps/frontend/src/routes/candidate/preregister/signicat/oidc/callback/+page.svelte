<svelte:options runes />

<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Loading } from '$lib/components/loading';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import MainContent from '../../../../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t, getRoute, exchangeCodeForIdToken } = getCandidateContext();

  ////////////////////////////////////////////////////////////////////
  // Handle exchanging the authorization code
  ////////////////////////////////////////////////////////////////////

  $effect(() => {
    const authorizationCode = page.url.searchParams.get('code');
    if (authorizationCode) {
      exchangeCodeForIdToken({
        authorizationCode,
        codeVerifier: localStorage.getItem('code_verifier') ?? '',
        redirectUri: `${window.location.origin}${window.location.pathname}`
      });
    } else {
      goto($getRoute('CandAppPreregister'));
    }
  });
</script>

<MainContent title={t('common.loading')}><Loading /></MainContent>
