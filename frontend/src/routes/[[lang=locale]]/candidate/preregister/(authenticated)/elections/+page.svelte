<script lang="ts">
  import { Button } from '$lib/components/button';
  import MainContent from '../../../../MainContent.svelte';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { onDestroy } from 'svelte';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { goto } from '$app/navigation';
  import { DEFAULT_DATE_FORMAT } from '../../../../../../../../packages/data/src/internal';
  import { ElectionSelector } from '$lib/components/electionSelector';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appCustomization, constituenciesSelectable, darkMode, dataRoot, getRoute, locale, preselectedElections, t } =
    getCandidateContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  const electionDate = new Date(); // TODO: Where does this come from?
  const nextRoute = $constituenciesSelectable ? 'CandAppPreregisterConstituency' : 'CandAppPreregisterEmail';

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

<MainContent title={$t('candidateApp.preregister.electionSelect.title')}>
  <div class="mb-md text-center">
    {@html sanitizeHtml(
      $t('candidateApp.preregister.electionSelect.content', {
        date: electionDate.toLocaleDateString($locale, DEFAULT_DATE_FORMAT)
      })
    )}
  </div>
  <ElectionSelector elections={$dataRoot.elections} bind:selected={$preselectedElections} />
  <Button
    type="submit"
    text={$t('common.continue')}
    variant="main"
    disabled={$preselectedElections.length === 0}
    on:click={() => goto($getRoute(nextRoute))} />
</MainContent>
