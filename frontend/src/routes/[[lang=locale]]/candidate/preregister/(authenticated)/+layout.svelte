<!--@component

# Candidate app pre-registration authenticated layout

Contains the parts of the pre-registration process taking part after a successful ID provider authentication.

- Shows an error if the authentication token has expired
- Hides the navigation menu
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { getRoute, idTokenClaims, t } = getCandidateContext();
  const { navigationSettings } = getLayoutContext(onDestroy);
  navigationSettings.push({ hide: true });
</script>

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
