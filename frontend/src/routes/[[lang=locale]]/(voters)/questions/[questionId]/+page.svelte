<script lang="ts">
  import { onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { CategoryTag } from '$lib/components/categoryTag';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { Loading } from '$lib/components/loading';
  import {
    LikertResponseButtons,
    type LikertResponseButtonsEventDetail,
    QuestionActions,
    QuestionInfo
  } from '$lib/components/questions';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { t } from '$lib/i18n';
  import {
    answeredQuestions,
    deleteVoterAnswer,
    opinionQuestionCategories,
    opinionQuestions,
    settings,
    setVoterAnswer
  } from '$lib/legacy-stores';
  import { startEvent } from '$lib/utils/legacy-analytics/track';
  import { logDebugError } from '$lib/utils/logger';
  import { FIRST_QUESTION_ID, getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import Layout from '../../../../Layout.svelte';
  import { getQuestionsContext } from '../questions.context';
  import { filterAndSortQuestions } from '../questions.utils';
  import type { PageData } from './$types';
  //import {type VideoMode, Video} from '$lib/components/video';

  /**
   * A page for displaying a single opinion question or a question category intro.
   * TODO:
   * - Split this into parts so that it can be more easily used in the Candidate App
   * - Especially separate the category intro and the question display
   * - Refactor the update logic which now happens inside `updateQuestion`, possibly to a different stream that filters and orders the available questions and another one dependent on that and the `questionId` route param that selects the question to display.
   */

  export let data: PageData;

  /**
   * A small delay before moving to the next question.
   * TODO: Make this a global variable used throughout the app.
   */
  const DELAY_M_MS = 350;

  let { questionId } = data;
  const { setQuestionAsFirst } = data;
  const { firstQuestionId, selectedCategories } = getQuestionsContext();

  const { progress } = getLayoutContext(onDestroy);

  /** Use to disable the response buttons when an answer is set but we're still waiting for the next page to load */
  let disabled = false;
  let question: QuestionProps | undefined;
  let questions: Array<QuestionProps>;
  let questionIndex: number;
  let selectedKey: AnswerOption['key'] | undefined;

  // Variables related to possible video content
  // let atEnd: boolean;
  // let mode: VideoMode;
  // let reload: (props: CustomVideoProps) => void;
  // let toggleTranscript: (show?: boolean) => void;
  // let videoProps: CustomVideoProps | undefined;

  // 1. HANDLE setQuestionAsFirst

  // Handle the possible `setQuestionAsFirst` query param (only on initial page load), see `./+page.ts`
  if (setQuestionAsFirst && questionId != null && questionId !== FIRST_QUESTION_ID) {
    $firstQuestionId = questionId;
    // Also, clear any possible selected categories, although there should under normal circumstances be none
    $selectedCategories = null;
    startEvent('question_startFrom', { questionId: questionId });
  }

  // 2. SORT AND FILTER QUESTIONS

  // Make reactive to locale changes propagated to $opinionQuestions
  // NB. We need to include $opinionQuestionCategories as in order to get enriched category objects, which is quite hacky but again will be fixed when the `vaa-data` module is available.
  $: {
    // Svelte does not track variables within future context
    $firstQuestionId; // eslint-disable-line @typescript-eslint/no-unused-expressions
    $selectedCategories; // eslint-disable-line @typescript-eslint/no-unused-expressions
    Promise.all([$opinionQuestions, $opinionQuestionCategories]).then(
      ([qq]) => (questions = filterAndSortQuestions(qq, $firstQuestionId, $selectedCategories))
    );
  }

  // 3. UPDATE CURRENT QUESTION

  // Set questionId and prepare question data reactively when the route param or question data (mainly on locale change) changes
  // NB. Because `questions` is (currently) derived from `page` it will update every time `data.questionId` changes, and in practice we could only call `updateQuestion` when it changes. We'll, however, trigger the update by changes from both to not lose the updates if `opinionQuestions` is derived otherwise in the future. Even though it's called twice, `updateQuestion` will not perform any updates if the question hasn't actually changed.
  $: updateQuestion(data.questionId, questions);

  // Set this in a separate reactive block so that it tracks changes in $answeredQuestions and question
  $: if (question) {
    selectedKey = $answeredQuestions[question.id]?.value as AnswerOption['key'] | undefined;
  }

  /**
   * Update the current question and related variables.
   */
  function updateQuestion(newQuestionId: string, questions: Array<QuestionProps>) {
    if (!questions?.length) return;

    // Save the current question so that we only rebuild the page if the question has actually changed either due to being a different one or a locale change
    const previousQuestion = question;
    questionId = newQuestionId === FIRST_QUESTION_ID ? questions[0].id : newQuestionId;
    question = questions.find((q) => q.id == questionId);
    if (!question) {
      logDebugError(`No question with id ${questionId}. Resetting session stores…`);
      $firstQuestionId = null;
      $selectedCategories = null;
      if (newQuestionId !== FIRST_QUESTION_ID && browser) return goto($getRoute(ROUTE.Questions));
      return;
    }

    // Update the index because we need it in the goto-functions
    questionIndex = questions.indexOf(question);
    progress.current.set(questionIndex + 1);

    // Only perform updates if the question has actually changed
    if (question !== previousQuestion) {
      // Enable buttons
      disabled = false;
      // Track whether the previous question has video content
      // const previousHadVideo = videoProps != null;
      // Check if this question has video content
      //videoProps = getVideoProps(question);
      // We need to call reload if we're reusing the Video component
      /* if (previousHadVideo && videoProps) {
        reload(videoProps);
      } */
    }
  }

  /** Save voter answer in a store and go to next question */
  function answerQuestion({ detail }: CustomEvent<LikertResponseButtonsEventDetail>) {
    disabled = true;
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
   * Go to the next or previous question, category intro, or to results or the intro page if this was the last or first question
   */
  function jumpQuestion(steps: number) {
    if (!questions) return;
    const newIndex = questionIndex + steps;
    let url: string;
    let noScroll = false;
    if (newIndex < 0) {
      url = $getRoute($settings.questions.questionsIntro.show ? ROUTE.Questions : ROUTE.Intro);
    } else if (newIndex >= questions.length) {
      url = $getRoute(ROUTE.Results);
    } else if (
      $settings.questions.categoryIntros?.show &&
      steps > 0 && // Show category intro only when moving forward
      getIndexInCategory(questions[newIndex]) === 0 // And for the first question in the category
    ) {
      url = $getRoute({ route: ROUTE.QuestionCategory, id: questions[newIndex].category.id });
    } else {
      url = $getRoute({ route: ROUTE.Question, id: questions[newIndex].id });
      // Disable scrolling when moving between questions for a smoother experience
      noScroll = true;
    }
    goto(url, { noScroll });
  }

  /**
   * Get the possible video props for a question.
   * @param question The question object
   * @returns The video props or `undefined` if the question has no video content
   */
  /* function getVideoProps(question: QuestionProps): CustomVideoProps | undefined {
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

  /**
   * Get the index of the question within its category taking into account possible reordering due to `firstQuestionId`.
   */
  function getIndexInCategory(question: QuestionProps) {
    const catId = question.category.id;
    const catQuestions = questions.filter((q) => q.category.id === catId);
    const index = catQuestions.indexOf(question);
    if (index == null) {
      logDebugError(`No index found for question ${question.id} in category ${catId}.`);
      return -1;
    }
    return index;
  }
</script>

<svelte:head>
  <title>{question ? question.text : $t('questions.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

{#if !(questions?.length && question)}
  <Loading class="mt-lg" />
{:else}
  {@const { id, text, type, values, category, info, customData } = question}
  {@const headingId = `questionHeading-${id}`}

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
      <HeadingGroup id={headingId} class="relative">
        <PreHeading>
          {#if $settings.questions.showCategoryTags && category}
            <CategoryTag {category} />
            <!-- Index of question within category -->
            {#if category.questions}
              {@const index = getIndexInCategory(question)}
              {#if index > -1}
                <span class="text-secondary">{index + 1}/{category.questions.length}</span>
              {/if}
            {/if}
          {:else}
            <!-- Index of question within all questions -->
            {$t('common.question')}
            <span class="text-secondary">{questionIndex + 1}/{questions.length}</span>
          {/if}
        </PreHeading>

        <!-- class={videoProps ? 'my-0 text-lg sm:my-md sm:text-xl' : ''} -->
        <h1>{text}</h1>
      </HeadingGroup>
    </svelte:fragment>

    <!-- !videoProps && -->
    {#if info && info !== ''}
      <QuestionInfo {info} />
    {/if}

    <svelte:fragment slot="primaryActions">
      {#if type === 'singleChoiceOrdinal'}
        <!-- onShadedBg={videoProps != null} -->
        <LikertResponseButtons
          aria-labelledby={headingId}
          {disabled}
          name={id}
          options={values}
          {selectedKey}
          variant={customData?.vertical ? 'vertical' : undefined}
          on:change={answerQuestion} />
      {:else}
        {$t('error.unsupportedQuestion')}
      {/if}
      <QuestionActions
        answered={selectedKey != null}
        {disabled}
        nextLabel={questionIndex === questions.length - 1 && selectedKey != null
          ? $t('results.title.results')
          : undefined}
        previousLabel={questionIndex === 0 ? $t('common.back') : undefined}
        separateSkip={true}
        on:previous={() => {
          startEvent('question_previous', { questionIndex });
          jumpQuestion(-1);
        }}
        on:delete={deleteAnswer}
        on:next={() => {
          startEvent('question_next', { questionIndex });
          jumpQuestion(+1);
        }}
        on:skip={() => {
          startEvent('question_skip', { questionIndex });
          jumpQuestion(+1);
        }} />
    </svelte:fragment>
  </Layout>
{/if}
