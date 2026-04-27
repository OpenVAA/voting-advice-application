<!--@component

# Candidate app pre-registration authenticated layout

Contains the parts of the pre-registration process taking part after a successful ID provider authentication.

- Shows an error if the authentication token has expired
- Hides the navigation menu
-->

<script lang="ts">
  import type { Snippet } from 'svelte';
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

  let { children }: { children: Snippet } = $props();

  // Phase 61-03 follow-up: idTokenClaims is reactive; access via candCtx.X.
  const candCtx = getCandidateContext();
  const { getRoute, t } = candCtx;
  const { navigationSettings } = getLayoutContext(onDestroy);
  navigationSettings.push({ hide: true });
</script>

{#if candCtx.idTokenClaims}
  {@render children?.()}
{:else}
  <MainContent title={t('candidateApp.preregister.status.tokenExpiredError.title')}>
    <div class="mb-md text-center">
      {@html sanitizeHtml(t('candidateApp.preregister.status.tokenExpiredError.content'))}
    </div>
    <Button
      text={t('common.continue')}
      variant="main"
      onclick={() => goto($getRoute('CandAppPreregister'), { invalidateAll: true })} />
  </MainContent>
{/if}
