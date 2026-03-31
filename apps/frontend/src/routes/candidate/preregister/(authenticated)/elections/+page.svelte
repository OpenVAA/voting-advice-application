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

  const candCtx = getCandidateContext();
  const { constituenciesSelectable, dataRoot, getRoute, t } = candCtx;
  const nextRoute = constituenciesSelectable ? 'CandAppPreregisterConstituency' : 'CandAppPreregisterEmail';
</script>

<MainContent title={t('candidateApp.preregister.electionSelect.title')}>
  <div class="mb-md text-center">
    {@html sanitizeHtml(t('candidateApp.preregister.electionSelect.content'))}
  </div>
  <ElectionSelector
    class="mb-md"
    elections={$dataRoot.elections}
    bind:selected={candCtx.preregistrationElectionIds}
    data-testid="preregister-elections-list" />
  {#snippet primaryActions()}
    <Button
      type="submit"
      text={t('common.continue')}
      variant="main"
      disabled={candCtx.preregistrationElectionIds.length === 0}
      onclick={() => goto($getRoute(nextRoute))}
      data-testid="preregister-elections-submit" />
  {/snippet}
</MainContent>
