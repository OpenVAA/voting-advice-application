<script lang="ts">
  import {_} from 'svelte-i18n';
  import {goto} from '$app/navigation';
  import type {PageData} from './$types';
  import {allQuestions, currentQuestionIndex, answeredQuestions} from '$lib/utils/stores';
  import {logDebugError} from '$lib/utils/logger';
  import {Question, type OnChangeEventDetail, type QuestionProps} from '$lib/components/questions';

  export let data: PageData;
  /**
   * A small delay before moving to the next question.
   * TODO: Make this a global variable used throughout the app.
   */
  const DELAY_M_MS = 350;

  if (data?.questions) {
    $allQuestions = data.questions;
  } else {
    throw new Error('Could not load data!');
  }

  let currentQuestion: QuestionProps;
  $: currentQuestion = $allQuestions[$currentQuestionIndex];

  // Store question id and answer value in a store
  function answerQuestion(event: CustomEvent) {
    const detail = event.detail as OnChangeEventDetail;
    answeredQuestions.update((answers) => [
      ...answers,
      {questionId: detail.id, answer: detail.value}
    ]);
    logDebugError(
      `Answered question ${detail.id} with value ${detail.value}. Store length: ${$answeredQuestions.length}.`
    );
    gotoNextQuestion();
  }

  // Skip to next question
  function skipQuestion() {
    gotoNextQuestion();
  }

  function gotoNextQuestion() {
    setTimeout(() => {
      if ($currentQuestionIndex < $allQuestions.length - 1) {
        $currentQuestionIndex += 1;
      } else {
        goto('/results');
      }
    }, DELAY_M_MS);
  }
</script>

<svelte:head>
  <title>{$_('questions.questionsTitle')}</title>
</svelte:head>

<section class="flex h-screen flex-col">
  <main class="grid flex-1 content-center px-3">
    {#key currentQuestion}
      <Question
        id={currentQuestion.id}
        text={currentQuestion.text}
        options={currentQuestion.options}
        category={currentQuestion.category}
        info={currentQuestion.info}
        on:change={answerQuestion}
        on:skip={skipQuestion} />
    {/key}
  </main>
</section>
