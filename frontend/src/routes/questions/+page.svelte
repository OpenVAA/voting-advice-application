<script lang="ts">
  import {_} from 'svelte-i18n';
  import {goto} from '$app/navigation';
  import type {Answer} from '../../types/answer.type';

  import {currentQuestion, answeredQuestions} from '../../utils/stores';
  import {getQuestion, getNumberOfQuestions} from '../../api/getQuestion';
  import {calculateCandidateCompatibilities} from '../../candidateRanking/calculateCompatibility';
  import Question from '../../components/questions/Question.svelte';
  export let data;

  let currentQuestionNumber = 1;
  let currentQuestionText = getQuestion(currentQuestionNumber);
  // TODO: Get these from the Question object
  let currentQuestionOptions = [
    {value: 1, label: $_('questions.scale.fullyDisagree')},
    {value: 2, label: $_('questions.scale.disagree')},
    {value: 3, label: $_('questions.scale.neutral')},
    {value: 4, label: $_('questions.scale.agree')},
    {value: 5, label: $_('questions.scale.fullyAgree')}
  ];

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

<section class="flex h-screen flex-col">
  <section class="bg-secondary pb-3 pt-3 max-md:px-3 md:px-10">
    <div class="flex pb-3">
      <a href="#1" class="text-primary">{$_('questions.previous')}</a>
      <div class="flex-auto">
        <h2 class="flex justify-center text-xl font-bold max-md:hidden">Your opinions</h2>
      </div>
      <a href="#1" class="text-primary">{$_('questions.skip')}</a>
    </div>
    <div class="flex justify-center">
      Sample theme 1 | Sample theme 2 | Sample theme 3 | Sample theme 4
    </div>
  </section>

  <Question
    number={currentQuestionNumber}
    text={currentQuestionText}
    options={currentQuestionOptions}
    on:change={answerQuestion} />

  <section>
    <div
      class="bg-secondary md:card md:float-right md:my-8 md:mr-8 md:w-96 md:overflow-clip md:drop-shadow-xl">
      <div class="w-full rounded-full">
        <div
          class="rounded-full bg-primary p-0.5 leading-none"
          style="width: {((currentQuestionNumber - 1) / getNumberOfQuestions()) * 100}%" />
      </div>
      <div class="card-body items-center text-center">
        {currentQuestionNumber - 1}/{getNumberOfQuestions()} statements answered <br />
        <a href="/results" class="font-semibold text-primary">{$_('questions.jumpToResults')}</a>
      </div>
    </div>
  </section>
</section>
