<!--@component

# Question category intro page

Display the intro to a question category and possibly a button with which to skip the whole category.

## Settings

- `questions.categoryIntros.show`: If `false`, this route will be bypassed.
- `questions.categoryIntros.allowSkip`: If `true`, display a button with which to skip the whole category.

## Params

- `categoryId`: The `Id` of the category to display.
-->

<script lang="ts">
  import { getCustomData } from '@openvaa/app-shared';
  import { error } from '@sveltejs/kit';
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Button } from '$lib/components/button';
  import { CategoryTag } from '$lib/components/categoryTag';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { Hero } from '$lib/components/hero';
  import { Loading } from '$lib/components/loading';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';
  import { parseParams } from '$lib/utils/route';
  import MainContent from '../../../../../MainContent.svelte';
  import type { Id } from '@openvaa/core';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Phase 61-03 voter-side parallel fix: selectedQuestionBlocks is a reactive
  // context getter; access via voterCtx.X (live $state).
  const voterCtx = getVoterContext();
  const { appSettings, getRoute, dataRoot, t } = voterCtx;
  const { pageStyles, video } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Get the current category and first question id
  // Use $derived to avoid effect-writes-state pattern that causes
  // effect_update_depth_exceeded during SvelteKit navigation
  ////////////////////////////////////////////////////////////////////

  let categoryId = $derived(parseParams(page).categoryId);
  let category = $derived(categoryId ? $dataRoot.getQuestionCategory(categoryId) : undefined);
  let block = $derived(category ? voterCtx.selectedQuestionBlocks.getByCategory(category) : undefined);
  let questionId = $derived<Id | undefined>(block?.block[0]?.id);
  let customData = $derived(category ? getCustomData(category) : undefined);
  let nextCategoryId = $derived.by<Id | undefined>(() => {
    if (!block) return undefined;
    if (block.index < voterCtx.selectedQuestionBlocks.blocks.length - 1) {
      return voterCtx.selectedQuestionBlocks.blocks[block.index + 1][0]?.category.id;
    }
    return undefined;
  });

  // Side effect: load video content when category has video data
  $effect(() => {
    if (customData?.video) video.load(customData.video);
  });

  ////////////////////////////////////////////////////////////////////
  // Possible redirect
  ////////////////////////////////////////////////////////////////////

  // On mount possibly redirect
  onMount(() => {
    if (!$appSettings.questions.categoryIntros?.show) {
      return goto($getRoute({ route: 'Question', questionId }), { replaceState: true });
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Edit layout
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
</script>

{#if category}
  <MainContent title={category.name}>
    {#snippet hero()}
      <figure role="presentation">
        {#if customData?.hero}
          <Hero content={customData?.hero} />
        {/if}
      </figure>
    {/snippet}

    {#snippet heading()}
      <HeadingGroup class="relative" data-testid="voter-questions-category-intro">
        <h1><CategoryTag category={category!} class="text-xl" /></h1>
        <PreHeading class="text-secondary">
          {t('questions.category.numQuestions', {
            numQuestions: block?.block.length ?? -1
          })}
        </PreHeading>
      </HeadingGroup>
    {/snippet}

    {#if !customData?.video && category.info}
      <p class="text-center">{category.info}</p>
    {/if}

    {#snippet primaryActions()}
      <Button
        variant="main"
        href={$getRoute({ route: 'Question', questionId })}
        text={t('common.continue')}
        data-testid="voter-questions-category-start" />
      {#if $appSettings.questions.categoryIntros?.allowSkip}
        <Button
          icon="skip"
          color="secondary"
          href={$getRoute(
            nextCategoryId ? { route: 'QuestionCategory', categoryId: nextCategoryId } : { route: 'Results' }
          )}
          text={nextCategoryId ? t('questions.category.skip') : t('questions.skipToResults')}
          class="justify-center"
          data-testid="voter-questions-category-skip" />
      {/if}
    {/snippet}
  </MainContent>
{:else}
  <Loading />
{/if}
