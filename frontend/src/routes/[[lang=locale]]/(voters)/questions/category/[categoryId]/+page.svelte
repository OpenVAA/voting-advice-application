<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {t} from '$lib/i18n';
  import {
    openFeedbackModal,
    opinionQuestionCategories,
    resultsAvailable,
    settings
  } from '$lib/stores';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {CategoryTag} from '$lib/components/categoryTag';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {Loading} from '$lib/components/loading';
  import {BasicPage} from '$lib/templates/basicPage';
  import {getQuestionsContext} from '../../questions.context';
  import {filterAndSortQuestions} from '../../questions.utils';
  import type {PageData} from './$types';

  /**
   * A page for showing a category's introduction page.
   * TODO: This has a lot of overlap with the single question page, but combining them would be a mess with template slots. Both this and the question page should be thoroughly refactored when the slotless page templates are available and the app state management is more coherent.
   */

  export let data: PageData;

  const {firstQuestionId, selectedCategories} = getQuestionsContext();
  let category: QuestionCategoryProps | undefined;
  let nextQuestionId: string | undefined;
  let progress = 0;
  let nextCategoryId: string | undefined;
  let questions: QuestionProps[];
  /** Synced version so that we don't have to await for this explicitly */
  let resultsAvailableSync = false;
  $: $resultsAvailable.then((d) => (resultsAvailableSync = d));

  // Prepare category data reactively when the route param or question categories (triggered by locale changes) change
  $: update(data.categoryId, $opinionQuestionCategories);

  async function update(categoryId: string, promisedCategories: Promise<QuestionCategoryProps[]>) {
    const cc = await promisedCategories;
    const qq = cc.map((c) => c.questions).flat();
    category = cc.find((c) => c.id === categoryId);
    if (!category) error(500, `Category not found: ${categoryId}`);
    questions = filterAndSortQuestions(qq, $firstQuestionId, $selectedCategories);
    nextQuestionId = category.questions?.[0].id;
    // Find the next category which is included in `selectedCategories`
    nextCategoryId = cc
      .slice(cc.indexOf(category!) + 1)
      .find((c) => !$selectedCategories || $selectedCategories.includes(c.id))?.id;
    if (nextQuestionId)
      progress = Math.max(0, questions.findIndex((q) => q.id === nextQuestionId) + 1);
  }
</script>

{#if !category}
  <Loading class="mt-lg" />
{:else}
  {@const {customData, name, info} = category}

  <BasicPage title={name} progressMin={0} progressMax={questions.length + 1} {progress}>
    <svelte:fragment slot="banner">
      {#if $settings.header.showFeedback && $openFeedbackModal}
        <Button
          on:click={$openFeedbackModal}
          variant="icon"
          icon="feedback"
          text={$t('feedback.send')} />
      {/if}
      {#if $settings.questions.showResultsLink}
        <Button
          href={$getRoute(Route.Results)}
          disabled={resultsAvailableSync ? null : true}
          variant="responsive-icon"
          icon="results"
          text={$t('results.title.results')} />
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="hero">
      {#if customData?.emoji}
        <HeroEmoji emoji={customData.emoji} />
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="heading">
      <HeadingGroup class="relative">
        <h1><CategoryTag {category} /></h1>
        <PreHeading class="text-secondary">
          {$t('questions.category.numQuestions', {numQuestions: category.questions?.length ?? -1})}
        </PreHeading>
      </HeadingGroup>
    </svelte:fragment>

    {#if info}
      <p class="text-center">{info}</p>
    {/if}

    <svelte:fragment slot="primaryActions">
      <Button
        variant="main"
        disabled={!nextQuestionId}
        href={$getRoute({route: Route.Question, id: nextQuestionId})}
        text={$t('common.continue')} />
      {#if $settings.questions.categoryIntros?.allowSkip}
        <Button
          icon="skip"
          color="secondary"
          href={$getRoute(
            nextCategoryId
              ? {route: Route.QuestionCategory, id: nextCategoryId}
              : {route: Route.Results}
          )}
          text={nextCategoryId ? $t('questions.category.skip') : $t('questions.skipToResults')}
          class="justify-center" />
      {/if}
    </svelte:fragment>
  </BasicPage>
{/if}
