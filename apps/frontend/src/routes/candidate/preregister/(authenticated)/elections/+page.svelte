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
  // dataRoot is identity-stable (#version-bridge): read `candCtx.dataRoot.<prop>` directly in the tracking scope,
  // never via an intermediate `$derived` alias (stale on cold entry). See CLAUDE.md §Context Destructuring Rule +
  // .planning/spikes/CONVENTIONS.md §9 (Spike-024). Phase 117 COLD-01.
  const nextRoute = $derived(
    candCtx.constituenciesSelectable ? 'CandAppPreregisterConstituency' : 'CandAppPreregisterEmail'
  );
</script>

<MainContent title={t('candidateApp.preregister.electionSelect.title')}>
  <div class="mb-md text-center">
    {@html sanitizeHtml(t('candidateApp.preregister.electionSelect.content'))}
  </div>
  <ElectionSelector
    class="mb-md"
    elections={candCtx.dataRoot.elections}
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
