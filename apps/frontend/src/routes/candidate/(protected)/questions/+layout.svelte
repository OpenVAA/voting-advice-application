<!--@component

# Candidate app questions layout

- Display an error if we can't load the questions.
- Set top bar actions and initiate progess.
- Redirects to the basic info page if required basic info has not been filled out.
-->

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import MainContent from '../../../MainContent.svelte';

  let { children }: { children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const ctx = getCandidateContext();
  const { getRoute, t } = ctx;
  const { progress, topBarSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Redirect if basic info has not been filled out
  ////////////////////////////////////////////////////////////////////

  $effect(() => {
    if (ctx.unansweredRequiredInfoQuestions.length) {
      goto($getRoute('CandAppProfile'));
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Set progress
  ////////////////////////////////////////////////////////////////////

  topBarSettings.push({
    progress: 'show'
  });

  $effect(() => {
    progress.max = ctx.opinionQuestions.length;
  });

  $effect(() => {
    progress.current.set(ctx.opinionQuestions.length - ctx.unansweredOpinionQuestions.length);
  });
</script>

{#if ctx.unansweredRequiredInfoQuestions.length === 0 && ctx.opinionQuestions.length > 0}
  {@render children?.()}
{:else}
  <MainContent title={t('error.noQuestions')}>
    {#snippet hero()}
      <figure role="presentation">
        <HeroEmoji emoji={t('dynamic.error.heroEmoji')} />
      </figure>
    {/snippet}

    {#snippet primaryActions()}
      <Button href={$getRoute('CandAppHome')} text={t('common.return')} variant="main" />
    {/snippet}
  </MainContent>
{/if}
