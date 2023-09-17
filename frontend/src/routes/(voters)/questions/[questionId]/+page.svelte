<script lang="ts">
  import {_} from 'svelte-i18n';
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {questions, answeredQuestions} from '$lib/utils/stores';
  import {logDebugError} from '$lib/utils/logger';
  import {Question, type OnChangeEventDetail} from '$lib/components/questions';

  /**
   * A small delay before moving to the next question.
   * TODO: Make this a global variable used throughout the app.
   */
  const DELAY_M_MS = 350;

  let currentQuestion: QuestionProps | undefined;
  $: currentQuestion = $questions.find((q) => '' + q.id === '' + $page.params.questionId);

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
    if (!currentQuestion) {
      return;
    }
    const currentIndex = $questions.indexOf(currentQuestion);
    if (currentIndex < $questions.length - 1) {
      const nextId = $questions[currentIndex + 1].id;
      setTimeout(() => goto(`/questions/${nextId}`), DELAY_M_MS);
    } else {
      setTimeout(() => goto('/results'), DELAY_M_MS);
    }
  }
</script>

{#if currentQuestion}
  {#key currentQuestion}
    <Question
      id={currentQuestion.id}
      text={currentQuestion.text}
      type={currentQuestion.type}
      options={currentQuestion.options}
      category={currentQuestion.category}
      info={currentQuestion.info}
      on:change={answerQuestion}
      on:skip={skipQuestion} />
  {/key}
{:else}
  {$_('question.notFound')}
{/if}
