<script>
  import {_} from 'svelte-i18n';
  import {goto} from '$app/navigation';
  import {currentQuestionId, answeredQuestions} from '../../utils/stores';
  import {calculateCandidateCompatibilities} from '../../candidateRanking/calculateCompatibility';
  import {getQuestion} from './getQuestion';
  export let data;

  let currentQuestionObject = data?.firstQuestion;
  let currentQuestionNumber = 1;

  // Null values
  currentQuestionId.update((n) => 1);
  answeredQuestions.update((n) => []);

  currentQuestionId.subscribe((value) => {
    currentQuestionNumber = value;
  });

  // Get next question from backend
  async function nextQuestion() {
    if (currentQuestionNumber < data.numberOfQuestions) {
      currentQuestionId.update((n) => n + 1);
      currentQuestionObject = await getQuestion(currentQuestionNumber).then((result) => {
        return result;
      });
    } else {
      calculateCandidateCompatibilities().then(() => {
        goto('/results');
      });
    }
  }

  // Store question number and answer value in a store
  function answerQuestion(answer) {
    answeredQuestions.update((questions) => [
      ...questions,
      {question: currentQuestionNumber, answer: answer}
    ]);
    nextQuestion(); // TODO: Placeholder for testing, remove when we have radio buttons
  }
</script>

{#if data.numberOfQuestions > 0}
  {#if currentQuestionObject}
    <p>{currentQuestionNumber}/{data.numberOfQuestions}</p>
    <br />
    <h2 class="text-xl font-bold">{currentQuestionObject?.question}</h2>
    {#if currentQuestionObject?.questionDescription}
      <i>{currentQuestionObject?.questionDescription}</i>
    {/if}
    <br />
    <br />
    <!-- TODO: Don't hardcode number of answer options in the future -->

    <button on:click={() => answerQuestion(0)} aria-label={$_('questions.scale.stronglyDisagree')}
      >{$_('questions.scale.stronglyDisagree')}</button>
    -
    <button on:click={() => answerQuestion(1)} aria-label={$_('questions.scale.disagree')}
      >{$_('questions.scale.disagree')}</button>
    -
    <button on:click={() => answerQuestion(2)} aria-label={$_('questions.scale.agree')}
      >{$_('questions.scale.agree')}</button>
    -
    <button on:click={() => answerQuestion(3)} aria-label={$_('questions.scale.stronglyAgree')}
      >{$_('questions.scale.stronglyAgree')}</button>

    <hr />
    <br />
    <button
      on:click={() => nextQuestion()}
      aria-label={$_('questions.nextQuestion')}
      class="font-semibold">
      {$_('questions.nextQuestion')}</button>
    <br />
    <a href="/results" class="font-semibold">{$_('questions.goToResults')}</a>
  {:else}
    <p>Question loading</p>
  {/if}
{:else}
  <p>{$_('questions.noQuestionsFound')}</p>
{/if}
