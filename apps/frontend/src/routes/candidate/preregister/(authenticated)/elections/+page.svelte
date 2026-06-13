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

  // Stable references (functions, stores, objects with internal getters): destructure-safe.
  // Reactive accessors (constituenciesSelectable) read via candCtx.X — see CLAUDE.md §Context Destructuring Rule.
  const candCtx = getCandidateContext();
  const { getRoute, t } = candCtx;
  // dataRoot is a reactive accessor (Phase 113 flatten) — read via candCtx.X, never destructure.
  const dataRoot = $derived(candCtx.dataRoot);
  const nextRoute = $derived(candCtx.constituenciesSelectable ? 'CandAppPreregisterConstituency' : 'CandAppPreregisterEmail');
</script>

<MainContent title={t('candidateApp.preregister.electionSelect.title')}>
  <div class="mb-md text-center">
    {@html sanitizeHtml(t('candidateApp.preregister.electionSelect.content'))}
  </div>
  <ElectionSelector
    class="mb-md"
    elections={dataRoot.current.elections}
    bind:selected={candCtx.preregistrationElectionIds}
    data-testid="preregister-elections-list" />
  {#snippet primaryActions()}
    <Button
      type="submit"
      text={t('common.continue')}
      variant="main"
      disabled={candCtx.preregistrationElectionIds.length === 0}
      onclick={() => goto(getRoute.current(nextRoute))}
      data-testid="preregister-elections-submit" />
  {/snippet}
</MainContent>
