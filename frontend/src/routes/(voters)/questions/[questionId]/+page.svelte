<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {_} from 'svelte-i18n';
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {answeredQuestions, resultsAvailable} from '$lib/utils/stores';
  import {logDebugError} from '$lib/utils/logger';
  import {Button} from '$lib/components/button';
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

  const {questions} = data;

  let questionId: string;
  let question: QuestionProps | undefined;
  let questionIndex: number;
  let selectedKey: AnswerOption['key'] | undefined;

  // Set questionId reactively when the route param changes, but only
  // if the id is different so that we don't trigger unnecessary re-renders
  $: if (questionId != data.questionId) {
    questionId = data.questionId;
    question = questions.find((q) => q.id == questionId);
    if (!question) throw error(404, `No question with id ${questionId}`);
    questionIndex = questions.indexOf(question);
  }

  // Set this in a separate reactive block so that it tracks changes in
  // $answeredQuestions and question
  $: if (question) {
    selectedKey = $answeredQuestions[question.id] as AnswerOption['key'] | undefined;
  }

  /** Save voter answer in a store and go to next question */
  function answerQuestion({detail}: CustomEvent<LikertResponseButtonsEventDetail>) {
    $answeredQuestions[detail.id] = detail.value;
    logDebugError(
      `Answered question ${detail.id} with value ${detail.value}. Store length: ${
        Object.values($answeredQuestions).length
      }.`
    );
    gotoNextQuestion();
  }

  /** Delete the voter's answer */
  function deleteAnswer() {
    if (!question) return;
    delete $answeredQuestions[question.id];
    // Reactive update is only triggered through assignment
    $answeredQuestions = $answeredQuestions;
  }

  /** Go to the next question or results if this was the last question */
  function gotoNextQuestion() {
    let url =
      questionIndex < questions.length - 1
        ? `/questions/${questions[questionIndex + 1].id}`
        : '/results';
    setTimeout(() => goto(url), DELAY_M_MS);
  }

  /**
   * Go to the previous question or the questions intro page if this was
   * the first question
   */
  function gotoPreviousQuestion() {
    let url = questionIndex > 0 ? `/questions/${questions[questionIndex - 1].id}` : '/questions';
    setTimeout(() => goto(url), DELAY_M_MS);
  }
</script>

{#key question}
  {#if question}
    {@const {id, text, type, options, category, info} = question}
    {@const headingId = `questionHeading-${id}`}
    <BasicPage
      title={text}
      progressMin={0}
      progressMax={questions.length + 1}
      progress={questionIndex + 1}>
      <svelte:fragment slot="banner">
        <Button
          on:click={() => goto('/results')}
          disabled={$resultsAvailable ? null : true}
          variant="icon"
          icon="results"
          text={$page.data.appLabels.actionLabels.results} />
        <Button
          href="/help"
          variant="icon"
          icon="help"
          text={$page.data.appLabels.actionLabels.help} />
      </svelte:fragment>

      <HeadingGroup slot="heading" id={headingId}>
        {#if category && category !== ''}
          <!-- TODO: Set color based on category -->
          <PreHeading class="text-accent">{category}</PreHeading>
        {/if}
        <h1>{text}</h1>
      </HeadingGroup>

      {#if info && info !== ''}
        <QuestionInfo {info} />
      {/if}

      <svelte:fragment slot="primaryActions">
        {#if type === 'Likert'}
          <LikertResponseButtons
            aria-labelledby={headingId}
            name={id}
            {options}
            {selectedKey}
            on:change={answerQuestion} />
        {:else}
          {$_('error.general')}
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
