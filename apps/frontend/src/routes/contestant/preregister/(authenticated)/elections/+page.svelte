<script lang="ts">
  import { goto } from '$app/navigation';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { ElectionSelector } from '$lib/components/electionSelector';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { sanitizeHtml } from '$lib/utils/sanitize';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Stable references (functions, stores, objects with internal getters): destructure-safe.
  // Reactive accessors (constituenciesSelectable) read via contestantCtx.X — see CLAUDE.md "Context Destructuring Rule".
  const contestantCtx = getContestantContext();
  const { getRoute, t } = contestantCtx;
  // dataRoot is identity-stable (#version-bridge): read `contestantCtx.dataRoot.<prop>` directly in the tracking scope, never via an intermediate `$derived` alias (stale on cold entry). See CLAUDE.md "Context Destructuring Rule" and the stable-reference alias anti-pattern.
  const nextRoute = $derived(
    contestantCtx.constituenciesSelectable ? 'ContestantAppPreregisterConstituency' : 'ContestantAppPreregisterEmail'
  );
</script>

<MainContent title={t('contestantApp.preregister.electionSelect.title')}>
  <div class="mb-md text-center">
    {@html sanitizeHtml(t('contestantApp.preregister.electionSelect.content'))}
  </div>
  <ElectionSelector
    class="mb-md"
    elections={contestantCtx.dataRoot.elections}
    bind:selected={contestantCtx.preregistrationElectionIds}
    data-testid="preregister-elections-list" />
  {#snippet primaryActions()}
    <Button
      type="submit"
      text={t('common.continue')}
      variant="main"
      disabled={contestantCtx.preregistrationElectionIds.length === 0}
      onclick={() => goto(getRoute.current(nextRoute))}
      data-testid="preregister-elections-submit" />
  {/snippet}
</MainContent>
