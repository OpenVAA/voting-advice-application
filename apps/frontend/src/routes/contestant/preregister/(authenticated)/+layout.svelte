<!--@component

# Contestant app pre-registration authenticated layout

Contains the parts of the pre-registration process taking part after a successful ID provider authentication.

- Shows an error if the authentication token has expired
- Hides the navigation menu
-->

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

  // idTokenClaims is reactive; access via contestantCtx.X.
  const contestantCtx = getContestantContext();
  const { getRoute, t } = contestantCtx;
  const { navigationSettings } = getLayoutContext();
  navigationSettings.use({ hide: true });
</script>

{#if contestantCtx.idTokenClaims}
  {@render children?.()}
{:else}
  <MainContent title={t('contestantApp.preregister.status.tokenExpiredError.title')}>
    <div class="mb-md text-center">
      {@html sanitizeHtml(t('contestantApp.preregister.status.tokenExpiredError.content'))}
    </div>
    <Button
      text={t('common.continue')}
      variant="main"
      onclick={() => goto(getRoute.current('ContestantAppPreregister'), { invalidateAll: true })} />
  </MainContent>
{/if}
