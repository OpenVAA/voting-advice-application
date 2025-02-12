<script lang="ts">
  import { Button } from '$lib/components/button';
  import MainContent from '../../../../MainContent.svelte';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { goto } from '$app/navigation';
  import { ElectionSelector } from '$lib/components/electionSelector';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { constituenciesSelectable, dataRoot, getRoute, preregistrationElectionIds, t } = getCandidateContext();
  const nextRoute = $constituenciesSelectable ? 'CandAppPreregisterConstituency' : 'CandAppPreregisterEmail';
</script>

<svelte:head>
  <title>{$t('candidateApp.preregister.identification.start.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

<MainContent title={$t('candidateApp.preregister.electionSelect.title')}>
  <div class="mb-md text-center">
    {@html sanitizeHtml($t('candidateApp.preregister.electionSelect.content'))}
  </div>
  <ElectionSelector class="mb-md" elections={$dataRoot.elections} bind:selected={$preregistrationElectionIds} />
  <Button
    type="submit"
    text={$t('common.continue')}
    variant="main"
    disabled={$preregistrationElectionIds.length === 0}
    on:click={() => goto($getRoute(nextRoute))} />
</MainContent>
