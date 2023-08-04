<script lang="ts">
  import {_} from 'svelte-i18n';
  import {goto} from '$app/navigation';

  import type {Answer} from './$types';
  import {calculateCandidateCompatibilities} from '$lib/algorithms/calculateCompability';
  import Question from '$lib/components/questions/Question.svelte';

  import {
    currentQuestionId,
    errorInGettingQuestion,
    questionsLoaded,
    answeredQuestions
  } from '$lib/utils/stores';
  import {getQuestion} from './getQuestion';
  import {logDebugError} from '$lib/utils/logger';
  import Spinner from '$lib/components/Spinner.svelte';
  export let data;

  let currentQuestionObject = data?.firstQuestion;
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

  let questionsLoadedForPage;
  let errorHappened;

  errorInGettingQuestion.subscribe((value) => {
    errorHappened = value;
  });

  questionsLoaded.subscribe((value) => {
    questionsLoadedForPage = value;
  });

  // Null values
  currentQuestionId.update((n) => 1);
  answeredQuestions.update(() => []);

  currentQuestionId.subscribe((value) => {
    currentQuestionNumber = value;
  });

  // Get next question from backend
  async function nextQuestion() {
    if (currentQuestionNumber < data.numberOfQuestions) {
      currentQuestionId.update((n) => n + 1);
      currentQuestionObject = await getQuestion(currentQuestionNumber)
        .then((result) => {
          if (result) {
            return result;
          }
        })
        .catch((error) => {
          logDebugError(error);
          errorInGettingQuestion.set(true);
        });
    } else {
      calculateCandidateCompatibilities().then(() => {
        goto('/results');
      });
    }
  }
  // Store question number and answer value in a store
  // TODO: define the detail type in the Likert component and import here
  function answerQuestion(event: CustomEvent) {
    answeredQuestions.update((questions) => [
      ...questions,
      {question: event.detail.number, answer: event.detail.value}
    ]);
    nextQuestion(); // TODO: Placeholder for testing, remove when we have radio buttons
  }
</script>

<svelte:head>
  <title>{$_('questions.questionsTitle')}</title>
</svelte:head>

{#if questionsLoadedForPage}
  <section class="flex h-screen flex-col">
    {#if !errorHappened}
      {#if data.numberOfQuestions > 0}
        {#if currentQuestionObject}
          <main class="grid flex-1 content-center px-3">
            {#key currentQuestionNumber}
              <Question
                number={currentQuestionNumber}
                text={currentQuestionObject?.question}
                options={currentQuestionOptions}
                topic={currentQuestionTopic}
                info={currentQuestionObject?.questionDescription}
                on:change={answerQuestion} />
            {/key}
          </main>
        {/if}
      {:else}
        <p>{$_('questions.noQuestionsFound')}</p>
      {/if}
    {:else}
      <p>{$_('questions.errorInGettingQuestions')}</p>
    {/if}
  </section>
{:else}
  <Spinner />
{/if}
