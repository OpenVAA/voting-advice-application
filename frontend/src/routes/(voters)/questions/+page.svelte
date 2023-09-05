<script lang="ts">
  import {_} from 'svelte-i18n';
  import {goto} from '$app/navigation';

  import type {Answer} from '$types/answer.type';
  import {currentQuestion, answeredQuestions} from '$lib/utils/stores';
  import {getQuestion, getNumberOfQuestions} from '$lib/api/getQuestion';
  import {calculateCandidateCompatibilities} from '$lib/algorithms/calculateCompability';
  import Question from '$lib/components/questions/Question.svelte';

  export let data;

  let currentQuestionNumber = 1;
  // TODO: Get all of these from the Question object
  let currentQuestionText = getQuestion(currentQuestionNumber);
  let currentQuestionOptions = [
    {value: 1, label: $_('questions.scale.fullyDisagree')},
    {value: 2, label: $_('questions.scale.disagree')},
    // {value: 3, label: $_('questions.scale.neutral')},
    {value: 4, label: $_('questions.scale.agree')},
    {value: 5, label: $_('questions.scale.fullyAgree')}
  ];
  let currentQuestionTopic = 'Environment';
  let currentQuestionInfo =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incidid.';

  // Null values
  currentQuestion.update(() => 1);
  answeredQuestions.update(() => [] as Answer[]);

  currentQuestion.subscribe((value) => {
    currentQuestionNumber = value;
  });

  // Store question number and answer value in a store
  // TODO: define the detail type in the Likert component and import here
  function answerQuestion(event: CustomEvent) {
    answeredQuestions.update((questions) => [
      ...questions,
      {question: event.detail.number, answer: event.detail.value}
    ]);
    // TODO: Placeholder for testing, remove when we have radio buttons
    if (currentQuestionNumber < getNumberOfQuestions()) {
      currentQuestion.update((n) => n + 1);
      currentQuestionText = getQuestion(currentQuestionNumber);
    } else {
      calculateCandidateCompatibilities().then(() => {
        goto('/results');
      });
    }
  }
</script>

<svelte:head>
  <title>{$_('questions.questionsTitle')}</title>
</svelte:head>

<div class="flex h-full flex-col items-center justify-center">
  <div class="max-w-xl">
    {#key currentQuestionNumber}
      <Question
        number={currentQuestionNumber}
        text={currentQuestionText}
        options={currentQuestionOptions}
        topic={currentQuestionTopic}
        info={currentQuestionInfo}
        on:change={answerQuestion} />
    {/key}
  </div>
</div>
