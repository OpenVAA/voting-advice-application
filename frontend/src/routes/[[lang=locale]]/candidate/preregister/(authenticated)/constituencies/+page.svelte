<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { ConstituencySelector } from '$lib/components/constituencySelector';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../../../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { getRoute, preregistrationElections, preregistrationConstituencyIds, t } = getCandidateContext();

  let selectionComplete: boolean;
</script>

<MainContent title={$t('candidateApp.preregister.constituencySelect.title')}>
  <div class="mb-md text-center">
    {@html sanitizeHtml($t('candidateApp.preregister.constituencySelect.content'))}
  </div>
  <ConstituencySelector
    onShadedBg
    class="mb-md"
    elections={$preregistrationElections}
    bind:selected={$preregistrationConstituencyIds}
    bind:selectionComplete />
  <Button
    slot="primaryActions"
    type="submit"
    text={$t('common.continue')}
    variant="main"
    on:click={() => goto($getRoute('CandAppPreregisterEmail'))}
    disabled={!selectionComplete} />
</MainContent>
