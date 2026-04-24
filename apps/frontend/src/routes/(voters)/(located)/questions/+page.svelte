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
  import MainContent from '../../../MainContent.svelte';
  import type { QuestionCategory } from '@openvaa/data';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const voterCtx = getVoterContext();
  const {
    appSettings,
    getRoute,
    opinionQuestions,
    opinionQuestionCategories,
    selectedElections: elections,
    selectedConstituencies: constituencies,
    selectedQuestionBlocks,
    t
  } = voterCtx;

  const { progress } = getLayoutContext(onDestroy);
  progress.current.set(0);

  ////////////////////////////////////////////////////////////////////
  // Possible redirect and selection initialization
  ////////////////////////////////////////////////////////////////////

  // On mount either redirect or filter stale category IDs and clear out the possible firstQuestionId store
  onMount(() => {
    voterCtx.firstQuestionId = null;
    // Filter stale category IDs (holdovers from a different election/constituency).
    // Navigation-level concern — stays here. Default-seeding moved to voterContext
    // per QUESTION-03 (Phase 61 D-09 + D-11).
    const filtered = voterCtx.selectedQuestionCategoryIds.filter((id) =>
      opinionQuestionCategories.find((c) => c.id === id)
    );
    if (filtered.length !== voterCtx.selectedQuestionCategoryIds.length) {
      voterCtx.selectedQuestionCategoryIds = filtered;
    }
    // Redirect: unchanged behavior — preserve the existing logic exactly.
    if (!$appSettings.questions.questionsIntro.show) {
      const categoryId = selectedQuestionBlocks.blocks[0]?.[0]?.category.id;
      return goto(
        $getRoute(
          $appSettings.questions.categoryIntros?.show && categoryId
            ? { route: 'QuestionCategory', categoryId }
            : { route: 'Question' }
        ),
        { replaceState: true }
      );
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Selecting question categories and submitting
  ////////////////////////////////////////////////////////////////////

  // To submit, there number of questions in the selected categories must be at least the minimum number set in the app settings or all questions if there are less than the minimum number
  let canSubmit = $derived(
    voterCtx.selectedQuestionCategoryIds.length > 0 &&
      selectedQuestionBlocks.questions.length >= Math.min(opinionQuestions.length, $appSettings.matching.minimumAnswers)
  );

  function handleSubmit(): void {
    if (!canSubmit) return;
    const categoryId = selectedQuestionBlocks.blocks[0]?.[0]?.category.id;
    if (!categoryId) error(500, 'No question categories selected even though canSubmit is true');
    goto(
      $getRoute(
        $appSettings.questions.categoryIntros?.show ? { route: 'QuestionCategory', categoryId } : { route: 'Question' }
      )
    );
  }

  ////////////////////////////////////////////////////////////////////
  // Functions
  ////////////////////////////////////////////////////////////////////

  /**
   * Count the applicable questions in a given category.
   */
  function countQuestions(category: QuestionCategory): number {
    return category.getApplicableQuestions({ elections, constituencies }).length;
  }
</script>

<MainContent title={t('questions.title')}>
  {#snippet hero()}
    <figure role="presentation">
      <HeroEmoji emoji={t('dynamic.questions.heroEmoji')} />
    </figure>
  {/snippet}

  {#if $appSettings.questions.questionsIntro.allowCategorySelection}
    <p class="text-center">
      {t('questions.intro.ingress.withCategorySelection', {
        numCategories: opinionQuestionCategories.length,
        minQuestions: $appSettings.matching.minimumAnswers
      })}
    </p>
    <div class="gap-sm grid" data-testid="voter-questions-category-list">
      {#each opinionQuestionCategories as category}
        <label class="label gap-sm cursor-pointer justify-start !p-0">
          <input
            type="checkbox"
            class="checkbox"
            name="vaa-selectedCategories"
            value={category.id}
            bind:group={voterCtx.selectedQuestionCategoryIds}
            data-testid="voter-questions-category-checkbox" />
          <CategoryTag {category} />
          <span class="text-secondary">{countQuestions(category)}</span>
        </label>
      {/each}
    </div>
  {:else}
    <p class="text-center">
      {t('questions.intro.ingress.withoutCategorySelection', {
        numCategories: opinionQuestionCategories.length,
        numQuestions: selectedQuestionBlocks.questions.length
      })}
    </p>
    <div
      class="
        {opinionQuestionCategories.length > 6 ? 'flex flex-wrap ' : 'grid '}
        gap-sm justify-center justify-items-center
      ">
      {#each opinionQuestionCategories as category}
        <CategoryTag {category} />
      {/each}
    </div>
  {/if}

  {#snippet primaryActions()}
    <Button
      disabled={!canSubmit}
      onclick={handleSubmit}
      variant="main"
      icon="next"
      text={t('questions.intro.start', {
        numQuestions: voterCtx.selectedQuestionCategoryIds.length > 0 ? selectedQuestionBlocks.questions.length : 0
      })}
      data-testid="voter-questions-start" />
  {/snippet}
</MainContent>
