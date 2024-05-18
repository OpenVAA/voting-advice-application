<script lang="ts">
  import {browser} from '$app/environment';
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {logDebugError} from '$lib/utils/logger';
  import {FIRST_QUESTION_ID, getRoute, Route} from '$lib/utils/navigation';
  import {openFeedbackModal, settings} from '$lib/stores';
  import {
    answeredQuestions,
    deleteVoterAnswer,
    opinionQuestions,
    resultsAvailable,
    setVoterAnswer
  } from '$lib/stores';
  import {Button} from '$lib/components/button';
  import {CategoryTag} from '$lib/components/categoryTag';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {
    LikertResponseButtons,
    QuestionActions,
    QuestionInfo,
    type LikertResponseButtonsEventDetail
  } from '$lib/components/questions';
  import {type VideoMode, Video} from '$lib/components/video';
  import {BasicPage} from '$lib/templates/basicPage';
  import type {PageData} from './$types';
  import {Loading} from '$lib/components/loading';
  import {startEvent} from '$lib/utils/analytics/track';
  import {firstQuestionId} from './page-stores';

  export let data: PageData;

  /**
   * A small delay before moving to the next question.
   * TODO: Make this a global variable used throughout the app.
   */
  const DELAY_M_MS = 350;

  let questions: QuestionProps[];
  let questionId: string;
  let question: QuestionProps | undefined;
  let questionIndex: number;
  let selectedKey: AnswerOption['key'] | undefined;

  let resultsAvailableSync = false;
  $: $resultsAvailable.then((v) => (resultsAvailableSync = v));

  // Variable related to possible video content
  let atEnd: boolean;
  let mode: VideoMode;
  let reload: (props: CustomVideoProps) => void;
  let toggleTranscript: (show?: boolean) => void;
  let videoProps: CustomVideoProps | undefined;

  // Set questionId and prepare question data reactively when the route param changes
  $: updateQuestion(data.questionId);

  async function updateQuestion(newQuestionId: string) {
    questions = await $opinionQuestions;
    // Check if we this question is defined as the one to start from (using a search param, see `./+page.ts`)
    if (data.setQuestionAsFirst && newQuestionId !== FIRST_QUESTION_ID)
      $firstQuestionId = newQuestionId;
    // If a first question is saved in session storage, move it as first and maintain the original question order otherwise
    if ($firstQuestionId) questions = questions.sort((q) => (q.id === $firstQuestionId ? -1 : 0));
    // Save the current question so that we only rebuild the page if the question has actually changed either due to being a different one or a locale change
    const previousQuestion = question;
    questionId = newQuestionId === FIRST_QUESTION_ID ? questions[0].id : newQuestionId;
    question = questions.find((q) => q.id == questionId);
    if (!question) {
      logDebugError(`No question with id ${questionId}`);
      if (newQuestionId !== FIRST_QUESTION_ID && browser) return goto($getRoute(Route.Questions));
      return;
    }
    // Update the index because we need it in the goto-functions
    questionIndex = questions.indexOf(question);
    // Only perform updates if the question has actually changed
    if (question !== previousQuestion) {
      // Track whether the previous question has video content
      const previousHadVideo = videoProps != null;
      // Check if this question has video content
      videoProps = getVideoProps(question);
      // We need to call reload if we're reusing the Video component
      if (previousHadVideo && videoProps) {
        reload(videoProps);
      }
    }
  }

  // Set this in a separate reactive block so that it tracks changes in $answeredQuestions and question
  $: if (question) {
    selectedKey = $answeredQuestions[question.id]?.value as AnswerOption['key'] | undefined;
  }

  /** Save voter answer in a store and go to next question */
  function answerQuestion({detail}: CustomEvent<LikertResponseButtonsEventDetail>) {
    setVoterAnswer(detail.id, detail.value);
    logDebugError(
      `Answered question ${detail.id} with value ${detail.value}. Store length: ${
        Object.values($answeredQuestions).length
      }.`
    );
    setTimeout(() => jumpQuestion(+1), DELAY_M_MS);
  }

  /** Delete the voter's answer */
  function deleteAnswer() {
    if (!question) return;
    deleteVoterAnswer(question.id);
  }

  /**
   * Go to the next or previous question, or to results or the intro page if this was the last or first question
   */
  function jumpQuestion(steps: number) {
    const newIndex = questionIndex + steps;
    let url: string;
    let noScroll = false;
    if (newIndex < 0) {
      url = $getRoute($settings.questions.showIntroPage ? Route.Questions : Route.Intro);
    } else if (newIndex >= questions.length) {
      url = $getRoute(Route.Results);
    } else {
      url = $getRoute({route: Route.Question, id: questions[newIndex].id});
      // Disable scrolling when moving between questions for a smoother experience
      noScroll = true;
    }
    goto(url, {noScroll});
  }

  /**
   * Get the possible video props for a question.
   * @param question The question object
   * @returns The video props or `undefined` if the question has no video content
   */
  function getVideoProps(question: QuestionProps): CustomVideoProps | undefined {
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
  }
</script>

{#await $opinionQuestions}
  <Loading class="mt-lg" />
{:then}
  {#if question}
    {@const {id, text, type, values, category, info, customData} = question}
    {@const headingId = `questionHeading-${id}`}

    <BasicPage
      title={text}
      class={videoProps ? 'bg-base-300' : undefined}
      titleClass={videoProps ? '!pb-0' : undefined}
      progressMin={0}
      progressMax={questions.length + 1}
      progress={questionIndex + 1}>
      <svelte:fragment slot="banner">
        {#if $settings.header.showFeedback && $openFeedbackModal}
          <Button
            on:click={$openFeedbackModal}
            variant="icon"
            icon="feedback"
            text={$t('navigation.sendFeedback')} />
        {/if}
        {#if $settings.questions.showResultsLink}
          <Button
            href={$getRoute(Route.Results)}
            disabled={resultsAvailableSync ? null : true}
            variant="responsive-icon"
            icon="results"
            text={$t('actionLabels.results')} />
        {/if}
        {#if videoProps}
          <Button
            on:click={() => toggleTranscript()}
            variant="responsive-icon"
            icon={mode === 'video' ? 'videoOn' : 'videoOff'}
            text={mode === 'video'
              ? $t('components.video.showTranscript')
              : $t('components.video.showVideo')} />
        {/if}
      </svelte:fragment>

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

      <svelte:fragment slot="heading">
        <HeadingGroup id={headingId} class="relative">
          {#if $settings.questions.showCategoryTags && category}
            <PreHeading><CategoryTag {category} /></PreHeading>
          {/if}
          <h1 class={videoProps ? 'my-0 text-lg sm:my-md sm:text-xl' : ''}>{text}</h1>
        </HeadingGroup>
      </svelte:fragment>

      {#if !videoProps && info && info !== ''}
        <QuestionInfo {info} />
      {/if}

      <svelte:fragment slot="primaryActions">
        {#if type === 'singleChoiceOrdinal'}
          <LikertResponseButtons
            aria-labelledby={headingId}
            name={id}
            options={values}
            {selectedKey}
            onShadedBg={videoProps != null}
            variant={customData?.vertical ? 'vertical' : undefined}
            on:change={answerQuestion} />
        {:else}
          {$t('error.general')}
        {/if}
        <QuestionActions
          answered={selectedKey != null}
          nextLabel={questionIndex === questions.length - 1 && selectedKey != null
            ? $t('actionLabels.results')
            : undefined}
          previousLabel={questionIndex === 0 ? $t('header.back') : undefined}
          separateSkip={true}
          on:previous={() => {
            startEvent('question_previous', {questionIndex});
            jumpQuestion(-1);
          }}
          on:delete={deleteAnswer}
          on:next={() => {
            startEvent('question_next', {questionIndex});
            jumpQuestion(+1);
          }}
          on:skip={() => {
            startEvent('question_skip', {questionIndex});
            jumpQuestion(+1);
          }} />
      </svelte:fragment>
    </BasicPage>
  {/if}
{/await}
