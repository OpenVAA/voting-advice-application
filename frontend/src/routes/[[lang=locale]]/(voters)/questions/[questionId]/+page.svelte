<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {logDebugError} from '$lib/utils/logger';
  import {getRoute, Route} from '$lib/utils/navigation';
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

  // Set questionId reactively when the route param changes
  $: {
    questions = data.questions;
    questionId = data.questionId;
    question = questions.find((q) => q.id == questionId);
    if (!question) throw error(404, `No question with id ${questionId}`);
    questionIndex = questions.indexOf(question);
  }

  // Set this in a separate reactive block so that it tracks changes in
  // $answeredQuestions and question
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
        : $getRoute(Route.Questions);
    goto(url);
  }
</script>

{#key question}
  {#if question}
    {@const {id, text, type, values, category, info} = question}
    {@const headingId = `questionHeading-${id}`}
    <BasicPage
      title={text}
      progressMin={0}
      progressMax={questions.length + 1}
      progress={questionIndex + 1}>
      <svelte:fragment slot="banner">
        <Button
          href={$getRoute(Route.Results)}
          disabled={$resultsAvailable ? null : true}
          variant="icon"
          icon="results"
          text={$t('actionLabels.results')} />
        <Button
          href={$getRoute(Route.Help)}
          variant="icon"
          icon="help"
          text={$t('actionLabels.help')} />
      </svelte:fragment>

      <HeadingGroup slot="heading" id={headingId}>
        {#if category}
          <PreHeading><CategoryTag {category} /></PreHeading>
        {/if}
        <h1>{text}</h1>
      </HeadingGroup>

      {#if info && info !== ''}
        <QuestionInfo {info} />
      {/if}

      <svelte:fragment slot="primaryActions">
        {#if type === 'singleChoiceOrdinal'}
          <LikertResponseButtons
            aria-labelledby={headingId}
            name={id}
            options={values}
            {selectedKey}
            on:change={answerQuestion} />
        {:else}
          {$t('error.general')}
        {/if}
        <QuestionActions
          answered={selectedKey != null}
          separateSkip={false}
          on:previous={gotoPreviousQuestion}
          on:delete={deleteAnswer}
          on:next={gotoNextQuestion} />
      </svelte:fragment>
    </BasicPage>
  {/if}
{/key}
