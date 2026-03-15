<!--@component

# Candidate app questions layout

- Display an error if we can't load the questions.
- Set top bar actions and initiate progess.
- Redirects to the basic info page if required basic info has not been filled out.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import MainContent from '../../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { getRoute, opinionQuestions, t, unansweredOpinionQuestions, unansweredRequiredInfoQuestions } =
    getCandidateContext();
  const { progress, topBarSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Redirect if basic info has not been filled out
  ////////////////////////////////////////////////////////////////////

  $: if ($unansweredRequiredInfoQuestions.length) {
    goto($getRoute('CandAppProfile'));
  }

  ////////////////////////////////////////////////////////////////////
  // Set progress
  ////////////////////////////////////////////////////////////////////

  topBarSettings.push({
    progress: 'show'
  });

  $: progress.max.set($opinionQuestions.length);
  $: progress.current.set($opinionQuestions.length - $unansweredOpinionQuestions.length);
</script>

{#if $unansweredRequiredInfoQuestions.length === 0 && $opinionQuestions.length > 0}
  <slot />
{:else}
  <MainContent title={$t('error.noQuestions')}>
    <figure role="presentation" slot="hero">
      <HeroEmoji emoji={$t('dynamic.error.heroEmoji')} />
    </figure>

    <svelte:fragment slot="primaryActions">
      <Button href={$getRoute('CandAppHome')} text={$t('common.return')} variant="main" />
    </svelte:fragment>
  </MainContent>
{/if}
