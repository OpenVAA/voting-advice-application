<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { getRoute, t, userData, idTokenClaims, clearIdToken } = getCandidateContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    actions: {
      cancel: $idTokenClaims ? 'show' : 'hide',
      cancelButtonLabel: $t('common.cancel'),
      cancelButtonCallback: async () => {
        await clearIdToken();
        await goto($getRoute('CandAppLogin'), { invalidateAll: true });
      }
    }
  });
</script>

{#if $userData}
  <MainContent title={$t('candidateApp.preregister.identification.start.title')}>
    <div class="mb-md text-center text-warning">
      {@html sanitizeHtml($t('candidateApp.preregister.status.loggedInError.content'))}
    </div>
    <Button
      text={$t('common.continue')}
      variant="main"
      on:click={() => goto($getRoute('CandAppHome'), { invalidateAll: true })} />
  </MainContent>
{:else}
  <slot />
{/if}
