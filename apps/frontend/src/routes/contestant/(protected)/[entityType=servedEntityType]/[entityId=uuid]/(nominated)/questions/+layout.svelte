<!--@component

# Contestant app questions layout

Decides what the questions pages of the entity the user edits show. It is one of three views:

- A loading view, until the entity's question data is loaded. The list of opinion questions is empty before that, on the server and on first paint among them, so nothing is decided from an empty list.
- For an entity that is asked no opinion question, a page that says there is nothing to answer, with one button back to the entity's home. A project may address every opinion question to another entity type, so this is not an error.
- Otherwise the questions page, with the progress of the entity's answers in the top bar. It is shown whether or not the entity's required basic info is answered.

The layout asks for no navigation in any of the three.
-->

<script lang="ts">
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { Loading } from '$lib/components/loading';
  import { opinionQuestionsStateOf } from '$lib/contestant/utils/opinionQuestionsState';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const ctx = getContestantContext();
  const { getRoute, t } = ctx;
  const { progress, topBarSettings } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // Choose the view
  ////////////////////////////////////////////////////////////////////

  /** What is known of the opinion questions the entity is asked. */
  const questionsState = $derived(
    opinionQuestionsStateOf({ questionsReady: ctx.questionsReady, questionCount: ctx.opinionQuestions.length })
  );

  /** The view shown: the page that says there is nothing to answer, the loading view, or the questions page. */
  const view = $derived.by<'loading' | 'none' | 'questions'>(() => {
    if (questionsState === 'none') return 'none';
    return questionsState === 'loading' ? 'loading' : 'questions';
  });

  ////////////////////////////////////////////////////////////////////
  // Set progress
  ////////////////////////////////////////////////////////////////////

  // The progress bar is in the top bar only while the entity has opinion questions: the overlay is taken away again when the effect reruns or the layout is destroyed.
  $effect(() => {
    if (questionsState === 'some') return topBarSettings.push({ progress: 'show' });
  });

  $effect(() => {
    progress.max = ctx.opinionQuestions.length;
  });

  $effect(() => {
    progress.current.set(ctx.opinionQuestions.length - ctx.unansweredOpinionQuestions.length);
  });
</script>

{#if view === 'loading'}
  <Loading />
{:else if view === 'none'}
  <MainContent title={t('contestantApp.questions.none.title')} data-testid="contestant-questions-none">
    <p class="text-center">{t('contestantApp.questions.none.content')}</p>

    {#snippet primaryActions()}
      <Button
        href={getRoute.current('ContestantAppEntityHome')}
        text={t('common.return')}
        variant="main"
        data-testid="contestant-questions-none-return" />
    {/snippet}
  </MainContent>
{:else}
  {@render children?.()}
{/if}
