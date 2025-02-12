<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { goto } from '$app/navigation';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { getRoute, idTokenClaims, t } = getCandidateContext();
</script>

<svelte:head>
  <title>{$t('candidateApp.preregister.identification.start.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

{#if $idTokenClaims}
  <slot />
{:else}
  <MainContent title={$t('candidateApp.preregister.status.tokenExpiredError.title')}>
    <div class="mb-md text-center">
      {@html sanitizeHtml($t('candidateApp.preregister.status.tokenExpiredError.content'))}
    </div>
    <Button
      text={$t('common.continue')}
      variant="main"
      on:click={() => goto($getRoute('CandAppPreregister'), { invalidateAll: true })} />
  </MainContent>
{/if}
