<!--@component

# Questions intro page

Display a general intro before starting answering the questions and possibly allow the user the select which question categories to answer.

## Settings

- `questions.questionsIntro.allowCategorySelection`: If `true` show a list of the opinion question categories, from which the user can select one or more. The questions contained in the selected categories must amount up to the minimum number of questions set by the `matching.minimumAnswers` setting for the user to be able to proceed.
- `questions.questionsIntro.show`: If `false`, this page is bypassed.
-->

<script lang="ts">
  import { error } from '@sveltejs/kit';
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { CategoryTag } from '$lib/components/categoryTag';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';
  import Layout from '../../../Layout.svelte';
  import type { QuestionCategory } from '@openvaa/data';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const {
    appSettings,
    firstQuestionId,
    getRoute,
    opinionQuestions,
    opinionQuestionCategories,
    selectedElections: elections,
    selectedConstituencies: constituencies,
    selectedQuestionBlocks,
    selectedQuestionCategoryIds,
    t
  } = getVoterContext();

  const { progress } = getLayoutContext(onDestroy);
  progress.current.set(0);

  ////////////////////////////////////////////////////////////////////
  // Possible redirect and selection initialization
  ////////////////////////////////////////////////////////////////////

  // On mount either redirect or pre-select all questionCategories and clear out the possible firstQuestionId store
  onMount(() => {
    $firstQuestionId = null;
    if (!$appSettings.questions.questionsIntro.show) {
      return goto($getRoute({ route: 'Question' }), { replaceState: true });
    }
    if ($selectedQuestionCategoryIds.length === 0)
      $selectedQuestionCategoryIds = $opinionQuestionCategories.map((c) => c.id);
  });

  ////////////////////////////////////////////////////////////////////
  // Selecting question categories and submitting
  ////////////////////////////////////////////////////////////////////

  // To submit, there number of questions in the selected categories must be at least the minimum number set in the app settings or all questions if there are less than the minimum number
  let canSubmit = false;
  $: canSubmit =
    $selectedQuestionCategoryIds.length > 0 &&
    $selectedQuestionBlocks.questions.length >=
      Math.min($opinionQuestions.length, $appSettings.matching.minimumAnswers);

  function handleSubmit(): void {
    if (!canSubmit) return;
    
    if ($appSettings.questions.questionOrdering?.enabled) {
      // If we have shown questions, go to the first one
      if ($selectedQuestionBlocks.shownQuestionIds.length > 0) {
        const firstShownId = $selectedQuestionBlocks.shownQuestionIds[0];
        goto($getRoute({ route: 'Question', questionId: firstShownId }));
      } else {
        // Otherwise show choices for first question
        $selectedQuestionBlocks.setShowChoices(true);
        goto($getRoute({ route: 'Question' }));
      }
    } else {
      const categoryId = $selectedQuestionBlocks.blocks[0]?.[0]?.category.id;
      if (!categoryId) error(500, 'No question categories selected even though canSubmit is true');
      
      goto($getRoute(
        $appSettings.questions.categoryIntros?.show
          ? { route: 'QuestionCategory', categoryId }
          : { route: 'Question' }
      ));
    }
  }

  ////////////////////////////////////////////////////////////////////
  // Functions
  ////////////////////////////////////////////////////////////////////

  /**
   * Count the applicable questions in a given category.
   */
  function countQuestions(category: QuestionCategory): number {
    return category.getApplicableQuestions({ elections: $elections, constituencies: $constituencies }).length;
  }
</script>

<Layout title={$t('questions.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.questions.heroEmoji')} />
  </figure>

  {#if $appSettings.questions.questionsIntro.allowCategorySelection && !$appSettings.questions.questionOrdering?.enabled}
    <p class="text-center">
      {$t('questions.intro.ingress.withCategorySelection', {
        numCategories: $opinionQuestionCategories.length,
        minQuestions: $appSettings.matching.minimumAnswers
      })}
    </p>
    <div class="grid gap-sm">
      {#each $opinionQuestionCategories as category}
        <label class="label cursor-pointer justify-start gap-sm !p-0">
          <input
            type="checkbox"
            class="checkbox"
            name="vaa-selectedCategories"
            value={category.id}
            bind:group={$selectedQuestionCategoryIds} />
          <CategoryTag {category} />
          <span class="text-secondary">{countQuestions(category)}</span>
        </label>
      {/each}
    </div>
  {:else}
    <p class="text-center">
      {#if $appSettings.questions.questionOrdering?.enabled}
        {$t('questions.intro.ingress.withDynamicOrdering', {
          numQuestions: $selectedQuestionBlocks.questions.length,
          numCategories: $opinionQuestionCategories.length
        })}
      {:else}
        {$t('questions.intro.ingress.withoutCategorySelection', {
          numQuestions: $selectedQuestionBlocks.questions.length,
          numCategories: $opinionQuestionCategories.length
        })}
      {/if}
    </p>
    <div class="grid justify-items-center gap-sm">
      {#each $opinionQuestionCategories as category}
        <CategoryTag {category} />
      {/each}
    </div>
  {/if}

  <Button
    slot="primaryActions"
    disabled={!canSubmit}
    on:click={handleSubmit}
    variant="main"
    icon="next"
    text={$t('questions.intro.start', {
      numQuestions: $selectedQuestionCategoryIds.length > 0 ? $selectedQuestionBlocks.questions.length : 0
    })} />
</Layout>
