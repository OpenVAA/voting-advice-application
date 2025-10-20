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
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Hero } from '$lib/components/hero';
  import { Loading } from '$lib/components/loading';
  import {
    OpinionQuestionInput,
    QuestionActions,
    QuestionBasicInfo,
    QuestionExtendedInfoButton
  } from '$lib/components/questions';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';
  import { QuestionHeading } from '$lib/dynamic-components/questionHeading';
  import { logDebugError } from '$lib/utils/logger';
  import { FIRST_QUESTION_ID, parseParams } from '$lib/utils/route';
  import { DELAY } from '$lib/utils/timing';
  import MainContent from '../../../../MainContent.svelte';
  import type { AnyQuestionVariant } from '@openvaa/data';
  import type { QuestionBlock } from '$lib/contexts/utils/questionBlockStore.type';
  import { Button } from '$lib/components/button';
  import { ElectionTag } from '$lib/components/electionTag';
  import { HeadingGroup } from '$lib/components/headingGroup';
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
  const { progress, video } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Get the current question and update related variables
  ////////////////////////////////////////////////////////////////////

  let question: AnyQuestionVariant;
  let questionBlock: { block: QuestionBlock; index: number; indexInBlock: number; indexOfBlock: number } | undefined;
  let isElectionNoteRead = false;
  let shouldShowElectionNote = false;

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
      // Possibly show video
      const customData = getCustomData(question);
      if (customData?.video) video.load(customData.video);
      // Possibly show election note
      const questions = $selectedQuestionBlocks.questions;
      const currentIndex = questions.indexOf(question);
      const previous = questions[currentIndex - 1];
      if (
        previous &&
        previous.category.elections
          .toSorted()
          .map((e) => e.id)
          .join(',') !==
          question.category.elections
            .toSorted()
            .map((e) => e.id)
            .join(',')
      ) {
        shouldShowElectionNote = true;
        isElectionNoteRead = false;
      }
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
  });

  ////////////////////////////////////////////////////////////////////
  // Anwering and moving between questions
  ////////////////////////////////////////////////////////////////////

  /** Use to disable the response buttons when an answer is set but we're still waiting for the next page to load */
  let disabled = false;

  function handleAnswer({ question, value }: { question: AnyQuestionVariant; value?: unknown }): void {
    disabled = true;
    answers.setAnswer(question.id, value);
    setTimeout(handleJump, DELAY.md);
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
        $appSettings.questions.categoryIntros?.show &&
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
</script>

{#if question && questionBlock}
  {@const { info, text } = question}
  {@const customData = getCustomData(question)}
  {@const questions = $selectedQuestionBlocks.questions}

  {#if shouldShowElectionNote && !isElectionNoteRead}
    {@const electionNames = question.category.elections.map((e) => e.shortName).join(', ')}
    <MainContent title={electionNames}>
      <HeadingGroup slot="heading" class="relative">
        <h1>
          {#each question.category.elections as election}
            <ElectionTag {election} class="text-xl" />
          {/each}
        </h1>
      </HeadingGroup>

      <p class="ingress text-center">
        {$t('questions.electionSeparatorIngress')}
      </p>

      <Button
        slot="primaryActions"
        text={$t('common.continue')}
        on:click={() => (isElectionNoteRead = true)}
        variant="main" />
    </MainContent>
  {:else}
    <MainContent title={text}>
      <figure role="presentation" slot="hero">
        {#if customData?.hero}
          <Hero content={customData?.hero} />
        {/if}
      </figure>

      <QuestionHeading {question} questionBlocks={$selectedQuestionBlocks} slot="heading" />

      {#if !customData.video}
        {#if $appSettings.questions.interactiveInfo?.enabled && (info || customData.infoSections?.length)}
          <div class="flex items-center justify-center">
            <QuestionExtendedInfoButton
              {question}
              onOpen={() => startEvent('questionExtendedInfo_open')}
              onSectionCollapse={(title) => startEvent('questionExtendedInfo_collapseSection', { title })}
              onSectionExpand={(title) => startEvent('questionExtendedInfo_expandSection', { title })} />
          </div>
        {:else if info}
          <QuestionBasicInfo
            {info}
            onCollapse={() => startEvent('questionInfo_collapse')}
            onExpand={() => startEvent('questionInfo_expand')} />
        {/if}
      {/if}

      <svelte:fragment slot="primaryActions">
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
      </svelte:fragment>
    </MainContent>
  {/if}
{:else}
  <Loading class="mt-lg" />
{/if}
