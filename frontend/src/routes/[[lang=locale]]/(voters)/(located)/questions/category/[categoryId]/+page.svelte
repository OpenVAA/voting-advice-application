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
  import { type CustomData, getCustomData } from '@openvaa/app-shared';
  import { error } from '@sveltejs/kit';
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
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
  import type { QuestionCategory } from '@openvaa/data';
  import type { QuestionBlock } from '$lib/contexts/utils/questionBlockStore.type';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, getRoute, dataRoot, selectedQuestionBlocks, t } = getVoterContext();
  const { pageStyles, video } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Get the current category and first question id
  ////////////////////////////////////////////////////////////////////

  let block: { block: QuestionBlock; index: number } | undefined;
  let category: QuestionCategory;
  let customData: CustomData['QuestionCategory'];
  /** Used for the possible skip button */
  let nextCategoryId: Id | undefined;
  let questionId: Id;
  $: {
    const categoryId = parseParams($page).categoryId;
    if (!categoryId) error(500, 'No categoryId provided.');
    category = $dataRoot.getQuestionCategory(categoryId);
    block = $selectedQuestionBlocks.getByCategory(category);
    if (!block?.block[0]) error(404, `No applicable questions found for category ${categoryId}.`);
    questionId = block.block[0].id;
    customData = getCustomData(category);
    if (block.index < $selectedQuestionBlocks.blocks.length - 1) {
      nextCategoryId = $selectedQuestionBlocks.blocks[block.index + 1][0]?.category.id;
      if (!nextCategoryId) error(404, `Next category not found after category ${categoryId}.`);
    } else {
      nextCategoryId = undefined;
    }
    // Possibly show video
    if (customData?.video) video.load(customData.video);
  }

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
    <figure role="presentation" slot="hero">
      {#if customData?.hero}
        <Hero content={customData?.hero} />
      {/if}
    </figure>

    <svelte:fragment slot="heading">
      <HeadingGroup class="relative">
        <h1><CategoryTag {category} class="text-xl" /></h1>
        <PreHeading class="text-secondary">
          {$t('questions.category.numQuestions', {
            numQuestions: block?.block.length ?? -1
          })}
        </PreHeading>
      </HeadingGroup>
    </svelte:fragment>

    {#if !customData?.video && category.info}
      <p class="text-center">{category.info}</p>
    {/if}

    <svelte:fragment slot="primaryActions">
      <Button variant="main" href={$getRoute({ route: 'Question', questionId })} text={$t('common.continue')} />
      {#if $appSettings.questions.categoryIntros?.allowSkip}
        <Button
          icon="skip"
          color="secondary"
          href={$getRoute(
            nextCategoryId ? { route: 'QuestionCategory', categoryId: nextCategoryId } : { route: 'Results' }
          )}
          text={nextCategoryId ? $t('questions.category.skip') : $t('questions.skipToResults')}
          class="justify-center" />
      {/if}
    </svelte:fragment>
  </MainContent>
{:else}
  <Loading />
{/if}
