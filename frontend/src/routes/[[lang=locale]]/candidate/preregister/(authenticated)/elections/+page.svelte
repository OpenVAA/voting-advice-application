<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { ElectionSelector } from '$lib/components/electionSelector';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../../../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { constituenciesSelectable, dataRoot, getRoute, preregistrationElectionIds, t } = getCandidateContext();
  const nextRoute = $constituenciesSelectable ? 'CandAppPreregisterConstituency' : 'CandAppPreregisterEmail';
</script>

<MainContent title={$t('candidateApp.preregister.electionSelect.title')}>
  <div class="mb-md text-center">
    {@html sanitizeHtml($t('candidateApp.preregister.electionSelect.content'))}
  </div>
  <ElectionSelector class="mb-md" elections={$dataRoot.elections} bind:selected={$preregistrationElectionIds} />
  <Button
    slot="primaryActions"
    type="submit"
    text={$t('common.continue')}
    variant="main"
    disabled={$preregistrationElectionIds.length === 0}
    on:click={() => goto($getRoute(nextRoute))} />
</MainContent>
