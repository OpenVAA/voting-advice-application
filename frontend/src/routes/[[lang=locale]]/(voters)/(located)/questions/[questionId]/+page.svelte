<!--@component

# Question page

Display a question for answering.

## Params

- `questionId`: The `Id` of the question to display. If the value is the one defined by the const `FIRST_QUESTION_ID`, the first question in the `selectedQuestionBlocks` store will be displayed.
- `start`: Optional. Set to a truish value to start answering questions from this question (and category). This will set the session persistent store `firstQuestionId` to the `Id` of the current question, which in turn will reorder the `selectedQuestionBlocks` store. The `firstQuestionId` store will be reset if the `/questions` intro page is visited or the use session is cleared.

## Settings

- `questions.interactiveInfo.enabled`: Whether to display interactive information popup or just a basic info expander.
-->

<script lang="ts">
  import { getCustomData } from '@openvaa/app-shared';
  import { error } from '@sveltejs/kit';
  import { onDestroy, onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Button } from '$lib/components/button';
  import { CategoryTag } from '$lib/components/categoryTag';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { Loading } from '$lib/components/loading';
  import { OpinionQuestionInput, QuestionActions, QuestionBasicInfo } from '$lib/components/questions';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';
  import { QuestionExtendedInfoButton } from '$lib/dynamic-components/questionInfo';
  import { logDebugError } from '$lib/utils/logger';
  import { FIRST_QUESTION_ID, parseParams } from '$lib/utils/route';
  import { DELAY } from '$lib/utils/timing';
  import MainContent from '../../../../MainContent.svelte';
  import type { AnyQuestionVariant } from '@openvaa/data';
  import type { QuestionBlock } from '$lib/contexts/utils/questionBlockStore.type';
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

  let question: AnyQuestionVariant;
  let questionBlock:
    | {
        block: QuestionBlock;
        index: number;
        indexInBlock: number;
        indexOfBlock: number;
      }
    | undefined;
  let useQuestionOrdering = $appSettings.questions.dynamicOrdering?.enabled;
  let nextQuestionChoices: Array<AnyQuestionVariant> = [];

  $: numSuggestions = (() => {
    const config = $appSettings.questions.dynamicOrdering?.config;
    return config?.type === 'factor-based' ? (config.numSuggestions ?? 3) : 3;
  })();

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

      // Stashed video-related code: TODO: Get videoProps from customData
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

  $: shouldShowQuestionSelection =
    useQuestionOrdering && $page.url.searchParams.get('showQuestionSelection') === 'true';

  $: {
    if (shouldShowQuestionSelection && nextQuestionChoices.length === 0) {
      nextQuestionChoices = $selectedQuestionBlocks.getNextQuestionChoices(numSuggestions);
    } else if (!shouldShowQuestionSelection) {
      nextQuestionChoices = [];
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

    // Check if we're showing question selection but numSuggestions is 1
    if (shouldShowQuestionSelection && numSuggestions === 1) {
      // Calculate the single next question and go directly to it
      const nextQuestions = $selectedQuestionBlocks.getNextQuestionChoices(1);
      if (nextQuestions.length > 0) {
        const nextQuestion = nextQuestions[0];
        // Add to shown questions
        $selectedQuestionBlocks.addShownQuestionId(nextQuestion.id);
        // Navigate directly to that question (replacing history so back button works properly)
        goto($getRoute({ route: 'Question', questionId: nextQuestion.id }), { replaceState: true });
      }
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Anwering and moving between questions
  ////////////////////////////////////////////////////////////////////

  /** Use to disable the response buttons when an answer is set but we're still waiting for the next page to load */
  let disabled = false;

  function handleAnswer({ question, value }: { question: AnyQuestionVariant; value?: unknown }): void {
    disabled = true;
    answers.setAnswer(question.id, value);

    // Add delay before showing next question or question choices
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
    let url: string;
    let noScroll = false;
    // Dynamic ordering navigation
    if (useQuestionOrdering) {
      const shownQuestionIds = $selectedQuestionBlocks.shownQuestionIds;
      const currentIndex = shownQuestionIds.findIndex((id) => id === question.id);
      // If showing question selection view, stay on current question. Otherwise, move by steps
      const newIndex = currentIndex + (shouldShowQuestionSelection ? 0 : steps);
      // Go back from first question
      if (newIndex < 0) {
        url = $getRoute('Questions');
        // Navigate to existing answered question
      } else if (newIndex < shownQuestionIds.length) {
        url = $getRoute({ route: 'Question', questionId: shownQuestionIds[newIndex] });
        noScroll = true;
        // Beyond shown questions - calculate next question(s)
      } else {
        // Get next question choices if not already calculated
        if (nextQuestionChoices.length === 0) {
          nextQuestionChoices = $selectedQuestionBlocks.getNextQuestionChoices(numSuggestions);
        }
        // No more questions - go to results
        if (nextQuestionChoices.length === 0) {
          url = $getRoute('Results');
          // Only one next question - go directly to it
        } else if (nextQuestionChoices.length === 1) {
          const questionId = nextQuestionChoices[0].id;
          $selectedQuestionBlocks.addShownQuestionId(questionId);
          url = $getRoute({ route: 'Question', questionId });
          // Multiple questions left - show question selection screen
        } else {
          url = $getRoute({
            route: 'Question',
            questionId: shownQuestionIds[shownQuestionIds.length - 1],
            showQuestionSelection: 'true'
          });
        }
      }
      // Default navigation
    } else {
      const newIndex = questionBlock.index + steps;
      if (newIndex < 0) {
        url = $getRoute($appSettings.questions.questionsIntro.show ? 'Questions' : 'Intro');
        // Go to results if moving forward from the last question
      } else if (newIndex >= $selectedQuestionBlocks.questions.length) {
        url = $getRoute('Results');
        // Show category intro if moving forward from the first question in a category
      } else {
        const newQuestion = $selectedQuestionBlocks.questions[newIndex];
        // Show the next category intro if the next question is the first question in a new category and we're not moving backwards
        // TODO: Handle category showing more centrally, e.g. during onMount of this page, so that sources linking here need to c
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
    }

    goto(url, { noScroll });
    disabled = false;
  }

  ////////////////////////////////////////////////////////////////////
  // Tracking
  ////////////////////////////////////////////////////////////////////

  // TODO: Re-enable
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
    goto($getRoute({ route: 'Question', questionId: selectedQuestion.id }));
    disabled = false;
  }

  // Replace the existing progress reactive block with:
  $: if (questionBlock) {
    if (useQuestionOrdering) {
      const currentIndex = $selectedQuestionBlocks.shownQuestionIds.findIndex((id) => id === question.id);
      progress.current.set(currentIndex + 1);
    } else {
      progress.current.set(questionBlock.index + 1);
    }
    progress.max.set($selectedQuestionBlocks.questions.length);
  }
</script>

{#if question && questionBlock}
  {@const { info, text } = question}
  {@const customData = getCustomData(question)}
  {@const questions = $selectedQuestionBlocks.questions}

  <!--
    class={videoProps ? 'bg-base-300' : undefined}
    titleClass={videoProps ? '!pb-0' : undefined}
  -->

  <MainContent title={text}>
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

    <svelte:fragment slot="note">
      {#if shouldShowQuestionSelection}
        <div class="mb-32">
          <h3 class="text-lg text-secondary/80">{$t('questions.pickNext')}</h3>
        </div>
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="heading">
      {#each shouldShowQuestionSelection ? nextQuestionChoices : [question] as currentQuestion}
        <div transition:slide class="grid-line-x">
          {#if shouldShowQuestionSelection && nextQuestionChoices.length}
            <button
              class="w-full rounded-lg p-2 text-left transition-colors hover:bg-base-200"
              on:click={() => handleChoiceSelect(currentQuestion)}>
              <HeadingGroup id={`questionHeading-${currentQuestion.id}`} class="relative">
                <PreHeading>
                  {#if $appSettings.questions.showCategoryTags}
                    <CategoryTag category={currentQuestion.category} />
                  {/if}
                </PreHeading>
                <h1>{currentQuestion.text}</h1>
              </HeadingGroup>
            </button>
          {:else}
            <HeadingGroup id={`questionHeading-${question.id}`} class="relative">
              <PreHeading>
                {#if $appSettings.questions.showCategoryTags}
                  <CategoryTag category={question.category} />
                  {#if !useQuestionOrdering}
                    <span class="text-secondary">
                      {questionBlock.indexInBlock + 1}/{questionBlock.block.length}
                    </span>
                  {/if}
                {:else}
                  {$t('common.question')}
                  {#if !useQuestionOrdering}
                    <span class="text-secondary">
                      {questionBlock.index + 1}/{questions.length}
                    </span>
                  {/if}
                {/if}
              </PreHeading>
              <h1>{question.text}</h1>
            </HeadingGroup>
          {/if}
        </div>
      {/each}
    </svelte:fragment>

    <style>
      .grid-line-x {
        @apply relative before:absolute before:left-[40%] before:right-[40%] before:top-0 before:border-md before:content-[''];
      }
      /* Target all but first element */
      .grid-line-x:not(:first-child) {
        @apply mt-16 pt-16 before:block;
      }
      .grid-line-x:first-child {
        @apply before:hidden;
      }
    </style>

    <!-- !videoProps && -->
    {#if !shouldShowQuestionSelection && $appSettings.questions.interactiveInfo?.enabled && (info || customData.infoSections?.length)}
      <div class="flex items-center justify-center">
        <QuestionExtendedInfoButton {question} />
      </div>
    {:else if !shouldShowQuestionSelection && info}
      <QuestionBasicInfo {info} onCollapse={handleInfoCollapse} onExpand={handleInfoExpand} />
    {/if}

    <svelte:fragment slot="primaryActions">
      {#if !shouldShowQuestionSelection}
        <OpinionQuestionInput {question} answer={$answers[question.id]} onChange={handleAnswer} />

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
          }} />
      {/if}

      {#if shouldShowQuestionSelection}
        <div
          role="group"
          aria-label={$t('questions.additionalActions')}
          class="mt-lg grid w-full grid-cols-3 items-stretch gap-md">
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
            text={$t('questions.previous')} />
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
            text={$t('questions.chooseForMe')} />
        </div>
      {/if}
    </svelte:fragment>
  </MainContent>
{:else}
  <Loading class="mt-lg" />
{/if}
