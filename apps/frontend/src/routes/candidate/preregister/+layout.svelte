<script lang="ts">
  import { goto } from '$app/navigation';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import type { Snippet } from 'svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  let { children }: { children: Snippet } = $props();

  // Read the reactive context getters via candCtx.X.
  const candCtx = getCandidateContext();
  const { getRoute, t, userData, clearIdToken } = candCtx;
  const { pageStyles, topBarSettings } = getLayoutContext();

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
  topBarSettings.use({
    actions: {
      cancel: candCtx.idTokenClaims ? 'show' : 'hide',
      cancelButtonLabel: t('common.cancel'),
      cancelButtonCallback: async () => {
        await clearIdToken();
        await goto(getRoute.current('CandAppLogin'), { invalidateAll: true });
      }
    }
  });
</script>

{#if userData.current}
  <MainContent title={t('candidateApp.preregister.identification.start.title')}>
    <div class="mb-md text-warning text-center">
      {@html sanitizeHtml(t('candidateApp.preregister.status.loggedInError.content'))}
    </div>
    <Button
      text={t('common.continue')}
      variant="main"
      onclick={() => goto(getRoute.current('CandAppHome'), { invalidateAll: true })} />
  </MainContent>
{:else if candCtx.answersLocked}
  <MainContent title={t('candidateApp.error.registrationLocked')}>
    <Button
      text={t('common.return')}
      variant="main"
      onclick={() => goto(getRoute.current('CandAppHome'), { invalidateAll: true })} />
  </MainContent>
{:else}
  {@render children?.()}
{/if}
