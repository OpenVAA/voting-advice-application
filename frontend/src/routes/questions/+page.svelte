<script>
  import {_} from 'svelte-i18n';
  import {goto} from '$app/navigation';
  import {currentQuestion, answeredQuestions} from '../../utils/stores';
  import {getQuestion, getNumberOfQuestions} from '../../api/getQuestion';
  import {calculateCandidateCompatibilities} from '../../candidateRanking/calculateCompatibility';
  import LikertScaleAnsweringButtons from '../../components/questions/LikertScaleAnsweringButtons.svelte';
  export let data;

  let currentQuestionNumber = 1;
  let currentQuestionText = getQuestion(currentQuestionNumber);

  // Null values
  currentQuestion.update(() => 1);
  answeredQuestions.update(() => []);

  currentQuestion.subscribe((value) => {
    currentQuestionNumber = value;
  });

  // Store question number and answer value in a store
  function answerQuestion(answer) {
    answeredQuestions.update((questions) => [
      ...questions,
      {question: currentQuestionNumber, answer: answer}
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
      <a class="text-primary">{$_('questions.previous')}</a>
      <div class="flex-auto">
        <h2 class="flex justify-center text-xl font-bold max-md:hidden">Your opinions</h2>
      </div>
      <a class="text-primary">{$_('questions.skip')}</a>
    </div>
    <div class="flex justify-center">
      Sample theme 1 | Sample theme 2 | Sample theme 3 | Sample theme 4
    </div>
  </section>

  <section class="grid flex-1 content-center px-3">
    <div class="flex-auto">
      <div class="flex justify-center pb-3">Example theme</div>
      <div class="flex justify-center pb-8 text-center text-2xl font-bold">
        {currentQuestionText}
      </div>
      <div class="flex justify-center pb-8">
        <!--        TODO: Check question type here-->
        <LikertScaleAnsweringButtons onClick={answerQuestion} />
      </div>
      <div class="flex justify-center font-semibold text-primary">
        <a>Read More About This Issue</a>
      </div>
    </div>
  </section>

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
