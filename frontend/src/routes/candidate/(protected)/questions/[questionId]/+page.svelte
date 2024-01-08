<script lang="ts">
  import {_} from 'svelte-i18n';
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {answeredQuestions} from '$lib/utils/stores';
  import {logDebugError} from '$lib/utils/logger';
  import {Question} from '$lib/components/questions';
  import BasicPage from '$lib/templates/basicPage/BasicPage.svelte';
  import {text} from 'svelte/internal';

  /**
   * A small delay before moving to the next question.
   * TODO: Make this a global variable used throughout the app.
   */
  const DELAY_M_MS = 350;

  let currentQuestion: QuestionProps | undefined;
  $: currentQuestion = $page.data.questions.find((q) => '' + q.id === '' + $page.params.questionId);

  // Store question id and answer value in a store
  function answerQuestion({detail}: CustomEvent) {
    $answeredQuestions[detail.id] = detail.value;
    logDebugError(
      `Answered question ${detail.id} with value ${detail.value}. Store length: ${
        Object.values($answeredQuestions).length
      }.`
    );
    gotoNextQuestion();
  }

  // Skip to next question
  // TODO: Later we might want to add an explicit note that this question was skipped
  // TODO: This needs to take into account as well whether the question is already answered
  function skipQuestion() {
    gotoNextQuestion();
  }

  function gotoNextQuestion() {
    if (!currentQuestion) {
      return;
    }
    const currentIndex = $page.data.questions.indexOf(currentQuestion);
    if (currentIndex < $page.data.questions.length - 1) {
      const nextId = $page.data.questions[currentIndex + 1].id;
      setTimeout(() => goto(`/questions/${nextId}`), DELAY_M_MS);
    } else {
      setTimeout(() => goto('/results'), DELAY_M_MS);
    }
  }
</script>

{#if currentQuestion}
  {#key currentQuestion}
    <BasicPage title={currentQuestion.text}>
      <svelte:fragment slot="heading" />
      <Question
        id={currentQuestion.id}
        text={currentQuestion.text}
        type={currentQuestion.type}
        options={currentQuestion.options}
        category={currentQuestion.category}
        info={currentQuestion.info}
        on:change={answerQuestion}
        on:skip={skipQuestion} />
    </BasicPage>
  {/key}
{:else}
  {$_('question.notFound')}
{/if}
