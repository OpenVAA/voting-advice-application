<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  let { children }: { children: Snippet } = $props();

  const { answersLocked, getRoute, t } = getCandidateContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
</script>

{#if answersLocked}
  <MainContent title={t('candidateApp.error.registrationLocked')}>
    <Button
      text={t('common.return')}
      variant="main"
      onclick={() => goto($getRoute('CandAppHome'), { invalidateAll: true })} />
  </MainContent>
{:else}
  {@render children?.()}
{/if}
