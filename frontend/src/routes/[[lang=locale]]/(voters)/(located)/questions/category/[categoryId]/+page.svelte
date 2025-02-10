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
  import { error } from '@sveltejs/kit';
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Button } from '$lib/components/button';
  import { CategoryTag } from '$lib/components/categoryTag';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Loading } from '$lib/components/loading';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';
  import { parseParams } from '$lib/utils/route';
  import MainContent from '../../../../../MainContent.svelte';
  import type { CustomData } from '@openvaa/app-shared';
  import type { Id } from '@openvaa/core';
  import type { QuestionCategory } from '@openvaa/data';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, getRoute, dataRoot, selectedQuestionBlocks, t } = getVoterContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Get the current category and first question id
  ////////////////////////////////////////////////////////////////////

  let category: QuestionCategory;
  let customData: CustomData['QuestionCategory'];
  /** Used for the possible skip button */
  let nextCategoryId: Id | undefined;
  let questionId: Id;
  $: {
    const categoryId = parseParams($page).categoryId;
    if (!categoryId) error(500, 'No categoryId provided.');
    category = $dataRoot.getQuestionCategory(categoryId);
    const block = $selectedQuestionBlocks.getByCategory(category);
    if (!block?.block[0]) error(404, `No applicable questions found for category ${categoryId}.`);
    questionId = block.block[0].id;
    customData = category.customData ?? {};
    if (block.index < $selectedQuestionBlocks.blocks.length - 1) {
      nextCategoryId = $selectedQuestionBlocks.blocks[block.index + 1][0]?.category.id;
      if (!nextCategoryId) error(404, `Next category not found after category ${categoryId}.`);
    } else {
      nextCategoryId = undefined;
    }
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
      {#if customData?.emoji}
        <HeroEmoji emoji={customData?.emoji} />
      {/if}
    </figure>

    <svelte:fragment slot="heading">
      <HeadingGroup class="relative">
        <h1><CategoryTag {category} /></h1>
        <PreHeading class="text-secondary">
          {$t('questions.category.numQuestions', {
            numQuestions: category.questions?.length ?? -1
          })}
        </PreHeading>
      </HeadingGroup>
    </svelte:fragment>

    {#if category.info}
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
