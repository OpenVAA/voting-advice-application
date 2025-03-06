<!--@component

# Questions layout

- Display an error if we can't load the questions.
- Set top bar actions and initiate progess.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter/voterContext.js';
  import MainContent from '../../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, getRoute, opinionQuestions, selectedQuestionBlocks, t } = getVoterContext();
  const { topBarSettings, progress } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Edit layout and set progress max
  ////////////////////////////////////////////////////////////////////

  topBarSettings.push({
    progress: 'show',
    actions: {
      results: $appSettings.questions.showResultsLink ? 'show' : 'hide'
    }
  });

  $: progress.max.set($selectedQuestionBlocks.questions.length + 1);
</script>

{#if $opinionQuestions.length > 0}
  <slot />
{:else}
  <MainContent title={$t('error.noQuestions')}>
    <figure role="presentation" slot="hero">
      <HeroEmoji emoji={$t('dynamic.error.heroEmoji')} />
    </figure>

    <svelte:fragment slot="primaryActions">
      <Button href={$getRoute('Results')} text={$t('results.title.browse')} variant="main" icon="next" />
      <Button href={$getRoute('Home')} text={$t('common.returnHome')} />
    </svelte:fragment>
  </MainContent>
{/if}
