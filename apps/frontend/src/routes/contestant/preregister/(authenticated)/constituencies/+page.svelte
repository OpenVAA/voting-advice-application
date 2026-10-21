<script lang="ts">
  import { goto } from '$app/navigation';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { ConstituencySelector } from '$lib/components/constituencySelector';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { sanitizeHtml } from '$lib/utils/sanitize';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Stable references (functions): destructure-safe.
  // Reactive accessors (preregistrationElections) read via contestantCtx.X — see CLAUDE.md "Context Destructuring Rule".
  const contestantCtx = getContestantContext();
  const { getRoute, t } = contestantCtx;

  let selectionComplete = $state(false);
</script>

<MainContent title={t('contestantApp.preregister.constituencySelect.title')}>
  <div class="mb-md text-center">
    {@html sanitizeHtml(t('contestantApp.preregister.constituencySelect.content'))}
  </div>
  <ConstituencySelector
    onShadedBg
    class="mb-md"
    elections={contestantCtx.preregistrationElections}
    bind:selected={contestantCtx.preregistrationConstituencyIds}
    bind:selectionComplete
    data-testid="preregister-constituencies-list" />
  {#snippet primaryActions()}
    <Button
      type="submit"
      text={t('common.continue')}
      variant="main"
      onclick={() => goto(getRoute.current('ContestantAppPreregisterEmail'))}
      disabled={!selectionComplete}
      data-testid="preregister-constituencies-submit" />
  {/snippet}
</MainContent>
