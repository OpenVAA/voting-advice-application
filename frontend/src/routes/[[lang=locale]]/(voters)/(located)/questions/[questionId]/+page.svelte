<!--@component

# Question page

Display a question for answering.

## Params

- `questionId`: The `Id` of the question to display. If the value is the one defined by the const `FIRST_QUESTION_ID`, the first question in the `selectedQuestionBlocks` store will be displayed.
- `start`: Optional. Set to a truish value to start answering questions from this question (and category). This will set the session persistent store `firstQuestionId` to the `Id` of the current question, which in turn will reorder the `selectedQuestionBlocks` store. The `firstQuestionId` store will be reset if the `/questions` intro page is visited or the use session is cleared.

## TODO

- Split this into parts so that it can be more easily used in the Candidate App
-->

<script lang="ts">
  import { error } from '@sveltejs/kit';
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { CategoryTag } from '$lib/components/categoryTag';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { Loading } from '$lib/components/loading';
  import { QuestionActions, QuestionInfo } from '$lib/components/questions';
  import QuestionChoices from '$lib/components/questions/QuestionChoices.svelte';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';
  import { logDebugError } from '$lib/utils/logger';
  import { FIRST_QUESTION_ID, parseParams } from '$lib/utils/route';
  import { DELAY } from '$lib/utils/timing';
  import Layout from '../../../../Layout.svelte';
  import type { AnyQuestionVariant } from '@openvaa/data';
  import type { QuestionBlock } from '$lib/contexts/voter/questionBlockStore.type';
  import { Button } from '$lib/components/button';
  import { slide } from 'svelte/transition';
  //import {type VideoMode, Video} from '$lib/components/video';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const {
    answers,
    appSettings,
    dataRoot,
    firstQuestionId,
    selectedQuestionBlocks,
    selectedQuestionCategoryIds,
    getRoute,
    startEvent,
    t
  } = getVoterContext();
  const { progress } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Get the current question and update related variables
  ////////////////////////////////////////////////////////////////////

  let customData: CustomData['Question'];
  let question: AnyQuestionVariant;
  let questionBlock: { block: QuestionBlock; index: number; indexInBlock: number; indexOfBlock: number } | undefined;
  let useQuestionOrdering = $appSettings.questions.questionOrdering?.enabled ?? false;
  let nextQuestionChoices: Array<AnyQuestionVariant> = [];

  $: {
    // Get question
    const questionId = parseParams($page).questionId;
    if (!questionId) error(500, 'No questionId provided.');
    try {
      question =
        questionId === FIRST_QUESTION_ID ? $selectedQuestionBlocks.blocks[0]?.[0] : $dataRoot.getQuestion(questionId);
    } catch {
      error(404, `Question with id ${questionId} not found.`);
    }

    // Get question block and index
    questionBlock = $selectedQuestionBlocks.getByQuestion(question);
    if (!questionBlock) {
      logDebugError(
        `Question with id ${questionId} not found in selectedQuestionBlocks. Rerouting to category selection.`
      );
      goto($getRoute('Questions'));
    } else {
      progress.current.set(questionBlock.index + 1);
      customData = question.customData;

      // Stashed video-related code:
      // // Track whether the previous question has video content
      // const previousHadVideo = videoProps != null;
      // // Check if this question has video content
      // videoProps = getVideoProps(question);
      // // We need to call reload if we're reusing the Video component
      // if (previousHadVideo && videoProps) {
      //  reload(videoProps);
      // }
    }
  }

  $: {
    if ($selectedQuestionBlocks.showChoices) {
      nextQuestionChoices = getNextQuestionChoices();
    }
  }

  ////////////////////////////////////////////////////////////////////
  // Handle `start` query param
  ////////////////////////////////////////////////////////////////////

  onMount(() => {
    if ($page.url.searchParams.get('start')) {
      // Clear any possible selected categories, although there should under normal circumstances be none
      $selectedQuestionCategoryIds = [];
      $firstQuestionId = question.id;
      startEvent('question_startFrom', { questionId: question.id });
    }
    console.log('showChoices', $selectedQuestionBlocks.showChoices);
  });

  ////////////////////////////////////////////////////////////////////
  // Anwering and moving between questions
  ////////////////////////////////////////////////////////////////////

  /** Use to disable the response buttons when an answer is set but we're still waiting for the next page to load */
  let disabled = false;

  function getNextQuestionChoices(): Array<AnyQuestionVariant> {
    const allQuestions = $selectedQuestionBlocks.questions;
    const unansweredQuestions = allQuestions.filter(q => !$answers[q.id]?.value);
    
    if (unansweredQuestions.length === 0) {
      return [];
    }

    const maxSuggestions = $appSettings.questions.questionOrdering?.suggestions ?? 3;
    const choices = [...unansweredQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, maxSuggestions);

    $selectedQuestionBlocks.setShowChoices(true);
    return choices;
  }

  function handleAnswer({ question, value }: { question: AnyQuestionVariant; value?: unknown }): void {
    disabled = true;
    answers.setAnswer(question.id, value);
    
    // Add delay before showing next question or choices
    setTimeout(() => {
      handleJump();
      disabled = false;
    }, DELAY.md);
  }

  function handleDelete() {
    if (!question) return;
    answers.deleteAnswer(question.id);
  }

  /**
   * Jump to another question.
   * @param steps - The number of steps to jump. Defaults to `1`, i.e., jump to next.
   */
  function handleJump(steps = 1): void {
    if (!questionBlock) return;
    if (useQuestionOrdering) {
      handleJumpForQuestionOrdering(steps);
      return;
    }

    // Build the new URL based on appSettings and the new index
    const newIndex = questionBlock.index + steps;
    let url: string;
    let noScroll = false;
    // Go back to the questions are main intro if moving back from the first question
    if (newIndex < 0) {
      url = $getRoute($appSettings.questions.questionsIntro.show ? 'Questions' : 'Intro');
      // Go to results if moving forward from the last question
    } else if (newIndex >= $selectedQuestionBlocks.questions.length) {
      url = $getRoute('Results');
      // Show category intro if moving forward from the first question in a category
    } else {
      const newQuestion = $selectedQuestionBlocks.questions[newIndex];
      // Show the next category intro if the next question is the first question in a new category and we're not moving backwards
      // TODO: Handle category showing more centrally, e.g. during onMount of this page, so that sources linking here need to concern themselves with choosing whether to show the category intro. In that case, though, another search param will be necessary that can be used to suppress category intro display.
      if (
        $appSettings.questions.questionsIntro.show &&
        steps > 0 &&
        $selectedQuestionBlocks.getByQuestion(newQuestion)?.indexInBlock === 0
      ) {
        url = $getRoute({ route: 'QuestionCategory', categoryId: newQuestion.category.id });
        // Othwerwise, just go to the new question
      } else {
        url = $getRoute({ route: 'Question', questionId: newQuestion.id });
        // Disable scrolling when moving between questions for a smoother experience
        noScroll = true;
      }
    }
    goto(url, { noScroll });
    disabled = false;
  }

  // Jump to another question when question ordering is enabled
  function handleJumpForQuestionOrdering(steps: number): void {
    // Get shown questions and the current index
    const shownQuestionIds = $selectedQuestionBlocks.shownQuestionIds;
    console.log('shownQuestionIds', shownQuestionIds);
    const currentIndex = shownQuestionIds.findIndex(id => id === question.id);
    console.log('currentIndex', currentIndex);

    // If showing choices view, stay on current question. Otherwise, move by steps. 
    const newIndex = currentIndex + ($selectedQuestionBlocks.showChoices ? 0 : steps);
    console.log('newIndex', newIndex);
    let url: string;
    let noScroll = false;

    if (steps < 0) {
      $selectedQuestionBlocks.setShowChoices(false);
    }
      
    // Go back to the questions overview if moving back from the first question
    if (newIndex < 0) {
      url = $getRoute('Questions');
    // Go to previous/next question if moving within the shown questions
    } else if (newIndex < shownQuestionIds.length) {
      url = $getRoute({ route: 'Question', questionId: shownQuestionIds[newIndex] });
      noScroll = true;
    // Handle end of shown questions
    } else {
      // If no more questions to answer, go to results
      nextQuestionChoices = getNextQuestionChoices();
      if (nextQuestionChoices.length === 0) {
        url = $getRoute('Results');
      // Otherwise, show the next question choices
      } else {
        disabled = false;
        return;
      }
    }
    goto(url, { noScroll });
    disabled = false;
  }

  ////////////////////////////////////////////////////////////////////
  // Tracking
  ////////////////////////////////////////////////////////////////////

  function handleInfoCollapse(): void {
    startEvent('questionInfo_collapse');
  }

  function handleInfoExpand(): void {
    startEvent('questionInfo_expand');
  }

  ////////////////////////////////////////////////////////////////////
  // Stashed material related to video content
  ////////////////////////////////////////////////////////////////////

  // Variables related to possible video content
  // let atEnd: boolean;
  // let mode: VideoMode;
  // let reload: (props: CustomVideoProps) => void;
  // let toggleTranscript: (show?: boolean) => void;
  // let videoProps: CustomVideoProps | undefined;

  /**
   * Get the possible video props for a question.
   * @param question The question object
   * @returns The video props or `undefined` if the question has no video content
   */
  /* function getVideoProps(question: AnyQuestionVariant): CustomVideoProps | undefined {
    if (
      !(
        question.customData != null &&
        typeof question.customData === 'object' &&
        'video' in question.customData
      )
    )
      return undefined;
    return {
      title: $t('questions.infoDescription'),
      transcript: question.info,
      ...question.customData.video
    } as CustomVideoProps;
  } */

  function handleChoiceSelect(selectedQuestion: AnyQuestionVariant) {
    $selectedQuestionBlocks.addShownQuestionId(selectedQuestion.id);
    $selectedQuestionBlocks.setShowChoices(false);
    goto($getRoute({ route: 'Question', questionId: selectedQuestion.id }));
    disabled = false;
    console.log('showChoices', $selectedQuestionBlocks.showChoices);
  }

  // Replace the existing progress reactive block with:
  $: if (questionBlock) {
    if (useQuestionOrdering) {
      const currentIndex = $selectedQuestionBlocks.shownQuestionIds.findIndex(id => id === question.id);
      progress.current.set(currentIndex + 1);
    } else {
      progress.current.set(questionBlock.index + 1);
    }
    progress.max.set($selectedQuestionBlocks.questions.length);
  }
</script>

{#if question && questionBlock}
  {@const { category, id, info, text, type } = question}
  {@const headingId = `questionHeading-${id}`}
  {@const questions = $selectedQuestionBlocks.questions}

  <!--
    class={videoProps ? 'bg-base-300' : undefined}
    titleClass={videoProps ? '!pb-0' : undefined}
  -->

  <Layout title={text}>
    <!--
      <svelte:fragment slot="video">
        {#if videoProps}
          <Video
            bind:atEnd
            bind:mode
            bind:reload
            bind:toggleTranscript
            hideControls={['transcript']}
            {...videoProps} />
        {/if}
      </svelte:fragment>
    -->

    <svelte:fragment slot="heading">
      {#if useQuestionOrdering && $selectedQuestionBlocks.showChoices}
        <h2 class="text-xl font-bold mb-4">{$t('questions.pickNext')}</h2>
      {/if}
      {#each (useQuestionOrdering && $selectedQuestionBlocks.showChoices) ? nextQuestionChoices : [question] as currentQuestion}
        <div
          transition:slide
          class="border-b border-base-300 last:border-none py-4"
        >
          <button
            class="w-full text-left {(useQuestionOrdering && $selectedQuestionBlocks.showChoices) ? 'hover:bg-base-200 transition-colors p-2 rounded-lg' : ''}"
            on:click={() => (useQuestionOrdering && $selectedQuestionBlocks.showChoices) && handleChoiceSelect(currentQuestion)}
            disabled={!(useQuestionOrdering && $selectedQuestionBlocks.showChoices)}
          >
            <HeadingGroup
              id={`questionHeading-${currentQuestion.id}`}
              class="relative"
            >
              <PreHeading>
                {#if $appSettings.questions.showCategoryTags}
                  <CategoryTag category={currentQuestion.category} />
                  <span class="text-secondary">
                    {#if !useQuestionOrdering}
                      {questionBlock.indexInBlock + 1}/{questionBlock.block.length}
                    {/if}
                  </span>
                {:else}
                  {$t('common.question')}
                  <span class="text-secondary">
                    {#if !(useQuestionOrdering && $selectedQuestionBlocks.showChoices)}
                      {questionBlock.index + 1}/{questions.length}
                    {/if}
                  </span>
                {/if}
              </PreHeading>
              <h1>{currentQuestion.text}</h1>
            </HeadingGroup>
          </button>
        </div>
      {/each}
    </svelte:fragment>

    <!-- !videoProps && -->
    {#if info && info !== ''}
      <QuestionInfo {info} onCollapse={handleInfoCollapse} onExpand={handleInfoExpand} />
    {/if}

    <svelte:fragment slot="primaryActions">
      {#if !(useQuestionOrdering && $selectedQuestionBlocks.showChoices)}
        {#if type === 'singleChoiceOrdinal' || type === 'singleChoiceCategorical'}
          {@const selectedId = question.ensureValue($answers[question.id]?.value)}
          <QuestionChoices
            aria-labelledby={headingId}
            {disabled}
            {question}
            {selectedId}
            variant={customData?.vertical ? 'vertical' : undefined}
            onChange={handleAnswer}
          />
        {:else}
          {$t('error.unsupportedQuestion')}
        {/if}

        <QuestionActions
          answered={$answers[question.id]?.value != null}
          {disabled}
          nextLabel={questionBlock.index === questions.length - 1 && $answers[question.id]?.value != null
            ? $t('results.title.results')
            : undefined}
          previousLabel={questionBlock.index === 0 ? $t('common.back') : undefined}
          separateSkip={true}
          onPrevious={() => {
            startEvent('question_previous', { questionIndex: questionBlock?.index });
            handleJump(-1);
          }}
          onDelete={handleDelete}
          onNext={() => {
            startEvent('question_next', { questionIndex: questionBlock?.index });
            handleJump(+1);
          }}
          onSkip={() => {
            startEvent('question_skip', { questionIndex: questionBlock?.index });
            handleJump(+1);
          }}
        />
      {/if}
    </svelte:fragment>

    {#if useQuestionOrdering && $selectedQuestionBlocks.showChoices}
      <div
        role="group"
        aria-label={$t('questions.additionalActions')}
        class="mt-lg grid w-full grid-cols-3 items-stretch gap-md"
      >
        <Button
          on:click={() => {
            handleJump(-1);
          }}
          style="grid-row: 1; grid-column: 1"
          color="secondary"
          variant="secondary"
          iconPos="left"
          class="content-start"
          icon="previous"
          text={$t('questions.previous')}
        />
        <Button
          on:click={() => {
            const randomIndex = Math.floor(Math.random() * nextQuestionChoices.length);
            const randomChoice = nextQuestionChoices[randomIndex];
            handleChoiceSelect(randomChoice);
          }}
          style="grid-row: 1; grid-column: 3"
          color="secondary"
          variant="secondary"
          iconPos="right"
          class="content-end"
          icon="check"
          text={$t('questions.chooseForMe')}
        />
      </div>
    {/if}
  </Layout>
{:else}
  <Loading class="mt-lg" />
{/if}
