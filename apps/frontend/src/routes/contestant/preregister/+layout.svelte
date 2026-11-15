<script lang="ts">
  import { goto } from '$app/navigation';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import type { Snippet } from 'svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  let { children }: { children: Snippet } = $props();

  // Read the reactive context getters via contestantCtx.X.
  const contestantCtx = getContestantContext();
  const { getRoute, t, userData, clearIdToken } = contestantCtx;
  const { pageStyles, topBarSettings } = getLayoutContext();

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.use({ drawer: { background: 'bg-base-300' } });
  topBarSettings.use({
    actions: {
      cancel: contestantCtx.idTokenClaims ? 'show' : 'hide',
      cancelButtonLabel: t('common.cancel'),
      cancelButtonCallback: async () => {
        await clearIdToken();
        await goto(getRoute.current('ContestantAppLogin'), { invalidateAll: true });
      }
    }
  });
</script>

{#if userData.current}
  <MainContent title={t('contestantApp.preregister.identification.start.title')}>
    <div class="mb-md text-warning text-center">
      {@html sanitizeHtml(t('contestantApp.preregister.status.loggedInError.content'))}
    </div>
    <Button
      text={t('common.continue')}
      variant="main"
      onclick={() => goto(getRoute.current('ContestantAppHome'), { invalidateAll: true })} />
  </MainContent>
{:else if contestantCtx.answersLocked}
  <MainContent title={t('contestantApp.error.registrationLocked')}>
    <Button
      text={t('common.return')}
      variant="main"
      onclick={() => goto(getRoute.current('ContestantAppHome'), { invalidateAll: true })} />
  </MainContent>
{:else}
  {@render children?.()}
{/if}
