<script lang="ts">
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Loading } from '$lib/components/loading';
  import { t } from '$lib/i18n';
  import { type CandidateContext, candidateContext } from '$lib/utils/legacy-candidateContext';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';

  $: if (!$page.data.token) {
    goto($getRoute(ROUTE.CandAppLogin));
  }

  const { user } = getContext<CandidateContext>('candidate');

  $: candidate = $user?.candidate;
  $: nomination = candidate?.nomination;
  $: election = nomination?.election;

  let errorMessage: string | undefined;
  $: if ($user) {
    if (!candidate) errorMessage = $t('candidateApp.error.userNoCandidate');
    else if (!nomination) errorMessage = $t('candidateApp.error.candidateNoNomination');
    else if (!election) errorMessage = $t('candidateApp.error.nominationNoElection');
    else errorMessage = undefined;
  }

  let data: Promise<Array<void>>;
  // Making sure that we re-fetch the data only if the token has actually changed.
  let currentToken: string;
  $: if ($page.data.token && currentToken !== $page.data.token) {
    currentToken = $page.data.token;
    data = ($user ? Promise.resolve() : candidateContext.loadUserData()).then(() =>
      Promise.all([
        candidateContext.loadAllLanguages(),
        candidateContext.loadOpinionAnswerData(),
        candidateContext.loadInfoAnswerData(),
        candidateContext.loadOpinionQuestionData(),
        candidateContext.loadInfoQuestionData(),
        candidateContext.loadPartyData()
      ])
    );
  }
</script>

{#await data}
  <Loading showLabel />
{:then}
  {#if errorMessage}
    {errorMessage}
  {:else}
    <slot />
  {/if}
{/await}
