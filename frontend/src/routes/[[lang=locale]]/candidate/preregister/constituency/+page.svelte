<script lang="ts">
  import { Button } from '$lib/components/button';
  import MainContent from '../../../MainContent.svelte';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { onDestroy } from 'svelte';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { goto } from '$app/navigation';
  import { ConstituencySelector } from '$lib/components/constituencySelector';

  export let data: { claims: { firstName: string; lastName: string } | null };

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const {
    dataRoot,
    appCustomization,
    darkMode,
    t,
    userData,
    getRoute,
    preselectedElections,
    preselectedConstituencies
  } = getCandidateContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  const nextStep = 'CandAppPreregisterEmail';

  let elections = $dataRoot.elections.filter((e) => $preselectedElections.includes(e.id));
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

{#if $userData}
  <MainContent title={$t('candidateApp.preregister.identification.start.title')}>
    <div class="mb-md text-center text-warning">
      {@html sanitizeHtml($t('candidateApp.preregister.identification.error.loggedIn.content'))}
    </div>
    <Button
      text={$t('common.continue')}
      variant="main"
      on:click={() => goto($getRoute('CandAppHome'), { invalidateAll: true })} />
  </MainContent>
{:else if data.claims}
  <MainContent title={$t('candidateApp.preregister.constituencySelect.title')}>
    <div class="mb-md text-center">
      {@html sanitizeHtml($t('candidateApp.preregister.constituencySelect.content'))}
    </div>
    <ConstituencySelector {elections} bind:selected={$preselectedConstituencies} bind:selectionComplete />
    <Button
      type="submit"
      text={$t('common.continue')}
      variant="main"
      on:click={() => goto($getRoute(nextStep))}
      disabled={!selectionComplete} />
    <Button type="reset" text={$t('common.cancel')} variant="secondary" />
  </MainContent>
{:else}
  <MainContent title={$t('candidateApp.preregister.identification.error.expired.title')}>
    <div class="mb-md text-center">
      {@html sanitizeHtml($t('candidateApp.preregister.identification.error.expired.content'))}
    </div>
    <Button
      text={$t('common.continue')}
      variant="main"
      on:click={() => goto($getRoute('CandAppPreregister'), { invalidateAll: true })} />
  </MainContent>
{/if}
