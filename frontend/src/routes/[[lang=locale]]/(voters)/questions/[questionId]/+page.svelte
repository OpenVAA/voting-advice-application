<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {logDebugError} from '$lib/utils/logger';
  import {FIRST_QUESTION_ID, getRoute, Route} from '$lib/utils/navigation';
  import {settings} from '$lib/utils/stores';
  import {
    answeredQuestions,
    deleteVoterAnswer,
    resultsAvailable,
    setVoterAnswer
  } from '$lib/utils/stores';
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

  // Variable related to possible video content
  let atEnd: boolean;
  let mode: VideoMode;
  let reload: (props: CustomVideoProps) => void;
  let toggleTranscript: (show?: boolean) => void;
  let videoProps: CustomVideoProps | undefined;

  // Set questionId and prepare question data reactively when the route param changes
  $: {
    questions = data.questions;
    // Save the current questionId so that we only rebuild the page if the question is actually changed
    const previousId = question?.id;
    questionId = data.questionId === FIRST_QUESTION_ID ? questions[0].id : data.questionId;
    question = questions.find((q) => q.id == questionId);
    if (!question) throw error(404, `No question with id ${questionId}`);
    // Update the index because we need it in the goto-functions
    questionIndex = questions.indexOf(question);
    // Only perform updates if the question has actually changed
    if (previousId !== question.id) {
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
    setTimeout(gotoNextQuestion, DELAY_M_MS);
  }

  /** Delete the voter's answer */
  function deleteAnswer() {
    if (!question) return;
    deleteVoterAnswer(question.id);
  }

  /** Go to the next question or results if this was the last question */
  function gotoNextQuestion() {
    let url =
      questionIndex < questions.length - 1
        ? $getRoute({route: Route.Question, id: questions[questionIndex + 1].id})
        : $getRoute(Route.Results);
    goto(url);
  }

  /**
   * Go to the previous question or the questions intro page if this was
   * the first question
   */
  function gotoPreviousQuestion() {
    let url =
      questionIndex > 0
        ? $getRoute({route: Route.Question, id: questions[questionIndex - 1].id})
        : $getRoute($settings.questions.showIntroPage ? Route.Questions : Route.Intro);
    goto(url);
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
      {#if $settings.questions.showResultsLink}
        <Button
          href={$getRoute(Route.Results)}
          disabled={$resultsAvailable ? null : true}
          variant="responsive-icon"
          icon="results"
          text={$t('actionLabels.results')} />
      {/if}
      {#if videoProps}
        <Button
          on:click={() => toggleTranscript()}
          variant="responsive-icon"
          icon={mode === 'video' ? 'videoOff' : 'video'}
          text={mode === 'video'
            ? $t('components.video.showTranscript')
            : $t('components.video.showVideo')} />
      {/if}
    </svelte:fragment>

    <div slot="video">
      {#if videoProps}
        <Video
          bind:atEnd
          bind:mode
          bind:reload
          bind:toggleTranscript
          hideControls={['transcript']}
          {...videoProps} />
      {/if}
    </div>

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
        on:previous={gotoPreviousQuestion}
        on:delete={deleteAnswer}
        on:next={gotoNextQuestion}
        on:skip={gotoNextQuestion} />
    </svelte:fragment>
  </BasicPage>
{/if}
