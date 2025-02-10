<script lang="ts">
  import { Button } from '$lib/components/button';
  import MainContent from '../../../../MainContent.svelte';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { onDestroy } from 'svelte';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { goto } from '$app/navigation';
  import { ConstituencySelector } from '$lib/components/constituencySelector';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appCustomization, darkMode, getRoute, preregistrationElections, preregistrationConstituencyIds, t } =
    getCandidateContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  const nextStep = 'CandAppPreregisterEmail';

  let selectionComplete: boolean;

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    imageSrc: $darkMode
      ? ($appCustomization.candPoster?.urlDark ?? $appCustomization.candPoster?.url ?? '/images/hero-candidate.png')
      : ($appCustomization.candPoster?.url ?? '/images/hero-candidate.png')
  });
</script>

<svelte:head>
  <title>{$t('candidateApp.preregister.identification.start.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

<MainContent title={$t('candidateApp.preregister.constituencySelect.title')}>
  <div class="mb-md text-center">
    {@html sanitizeHtml($t('candidateApp.preregister.constituencySelect.content'))}
  </div>
  <ConstituencySelector
    elections={$preregistrationElections}
    bind:selected={$preregistrationConstituencyIds}
    bind:selectionComplete />
  <Button
    type="submit"
    text={$t('common.continue')}
    variant="main"
    on:click={() => goto($getRoute(nextStep))}
    disabled={!selectionComplete} />
</MainContent>
