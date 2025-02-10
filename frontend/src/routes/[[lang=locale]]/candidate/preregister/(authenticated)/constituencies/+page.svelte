<script lang="ts">
  import { Button } from '$lib/components/button';
  import MainContent from '../../../../MainContent.svelte';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { goto } from '$app/navigation';
  import { ConstituencySelector } from '$lib/components/constituencySelector';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { getRoute, preregistrationElections, preregistrationConstituencyIds, t } = getCandidateContext();

  let selectionComplete: boolean;
</script>

<svelte:head>
  <title>{$t('candidateApp.preregister.identification.start.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

<MainContent title={$t('candidateApp.preregister.constituencySelect.title')}>
  <div class="mb-md text-center">
    {@html sanitizeHtml($t('candidateApp.preregister.constituencySelect.content'))}
  </div>
  <ConstituencySelector
    class="mb-md"
    elections={$preregistrationElections}
    bind:selected={$preregistrationConstituencyIds}
    bind:selectionComplete />
  <Button
    type="submit"
    text={$t('common.continue')}
    variant="main"
    on:click={() => goto($getRoute('CandAppPreregisterEmail'))}
    disabled={!selectionComplete} />
</MainContent>
