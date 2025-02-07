<script lang="ts">
  import { Button } from '$lib/components/button';
  import MainContent from '../../../MainContent.svelte';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { onDestroy } from 'svelte';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { goto } from '$app/navigation';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appCustomization, darkMode, t, userData, getRoute } = getCandidateContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

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
{:else}
  <MainContent title={$t('candidateApp.preregister.success.title')}>
    <div class="mb-md text-center">
      {@html sanitizeHtml($t('candidateApp.preregister.success.content'))}
    </div>
    <Button
      type="submit"
      text={$t('common.continue')}
      variant="main"
      on:click={() => goto($getRoute('CandAppRegister'), { invalidateAll: true })} />
  </MainContent>
{/if}
