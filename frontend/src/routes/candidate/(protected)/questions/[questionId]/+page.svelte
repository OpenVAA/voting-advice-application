<script lang="ts">
  import {_} from 'svelte-i18n';
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {answerContext} from '$lib/utils/answerStore';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {LikertResponseButtons, QuestionActions, QuestionInfo} from '$lib/components/questions';
  import {BasicPage} from '$lib/templates/basicPage';
  import {addAnswer, updateAnswer, deleteAnswer} from '$lib/api/candidate';
  import {onMount, onDestroy} from 'svelte';
  import {candidateAppRoute} from '$lib/utils/routes';

  const SAVE_INTERVAL_MS = 1000;

  // Open answer is saved periodically to local storage
  let saveInterval: NodeJS.Timeout;
  onMount(() => {
    saveInterval = setInterval(() => {
      saveOpenAnswerToLocal();
    }, SAVE_INTERVAL_MS);
  });

  onDestroy(() => {
    clearInterval(saveInterval);
  });

  const store = answerContext.answers;
  $: answerStore = $store;

  $: questionId = $page.params.questionId;

  // Local storage keys, depend on the question id
  $: likertLocal = `candidate-app-question-${questionId}-likert`;
  $: openAnswerLocal = `candidate-app-question-${questionId}-open`;

  let currentQuestion: QuestionProps | undefined;
  $: currentQuestion = $page.data.questions.find((q) => q.id.toString() === questionId.toString());

  $: answer = answerStore[questionId]; // null if not answered

  let selectedKey: AnswerOption['key'] | null;

  // Set the selected key on page load, local storage takes precedence
  $: {
    const likertValue = localStorage.getItem(likertLocal);
    if (likertValue) {
      selectedKey = parseInt(likertValue);
    } else {
      selectedKey = answer?.key ?? null;
    }

    setOpenAnswer();
  }

  let openAnswer = '';

  // Set open answer from local storage and answer store if available, local storage takes precedence
  function setOpenAnswer() {
    if (answer && !localStorage.getItem(openAnswerLocal)) {
      openAnswer = answer.openAnswer;
      return;
    }
    openAnswer = localStorage.getItem(openAnswerLocal) ?? '';
  }

  function saveLikertToLocal({detail}: CustomEvent) {
    selectedKey = detail.value;
    localStorage.setItem(likertLocal, detail.value);
  }

  function saveOpenAnswerToLocal() {
    if (openAnswer === '' || answer?.openAnswer === openAnswer) {
      localStorage.removeItem(openAnswerLocal);
      return;
    }

    localStorage.setItem(openAnswerLocal, openAnswer);
  }

  function removeLocalAnswerToQuestion() {
    localStorage.removeItem(likertLocal);
    localStorage.removeItem(openAnswerLocal);
  }

  let errorMessage = '';
  let errorTimeout: NodeJS.Timeout;

  function showError(message: string) {
    errorMessage = message;
    clearTimeout(errorTimeout);
    errorTimeout = setTimeout(() => {
      errorMessage = '';
    }, 5000);
  }

  async function saveToServer() {
    const localLikert = localStorage.getItem(likertLocal);

    if (!answer) {
      // New answer

      // Likert is required for an answer to be saved
      if (!localLikert) {
        return;
      }
      const response = await addAnswer(questionId, parseInt(localLikert), openAnswer);

      if (!response?.ok) {
        showError($_('candidateApp.opinions.answerSaveError'));
        return;
      }

      const data = await response.json();
      const answerId = data.data.id;

      answerStore[questionId] = {
        id: answerId,
        key: parseInt(localLikert),
        openAnswer
      };
    } else {
      // Existing answer

      let previousLikert = answer.key;

      // A local likert value takes precedence over the server value
      if (localLikert) {
        previousLikert = parseInt(localLikert);
      }

      const response = await updateAnswer(answer.id, previousLikert, openAnswer);
      if (!response?.ok) {
        showError($_('candidateApp.opinions.answerSaveError'));
        return;
      }

      answerStore[questionId] = {
        id: answer.id,
        key: previousLikert,
        openAnswer
      };
    }

    openAnswer = '';
    removeLocalAnswerToQuestion();
    answerContext.answers.set(answerStore);
  }

  async function removeAnswer() {
    if (!answer) {
      // No answer in database, only local answers need to be removed
      selectedKey = null;
      openAnswer = '';
      removeLocalAnswerToQuestion();
      return;
    }

    const response = await deleteAnswer(answer.id);
    if (!response?.ok) {
      showError($_('candidateApp.opinions.answerDeleteError'));
      return;
    }

    selectedKey = null;
    openAnswer = '';
    removeLocalAnswerToQuestion();

    delete answerStore[questionId];
    answerContext.answers.set(answerStore);
  }

  // Skip to next question
  // TODO: Later we might want to add an explicit note that this question was skipped
  // TODO: This needs to take into account as well whether the question is already answered
  function skipQuestion() {
    gotoNextQuestion();
  }

  async function navigateToQuestion(indexChange: number, lastPageUrl: string) {
    if (!currentQuestion) {
      return;
    }

    // Check if all questions have been answered (before answer to current question is saved)
    const allAnsweredBefore = $page.data.questions.every((question) =>
      Object.keys(answerStore).includes(question.id.toString())
    );

    // Save the current answer to the server before navigating
    await saveToServer();

    // Check if all questions have been answered (after answer is saved)
    // If the last answer was filled now, go to page with congratulatory message
    const allAnsweredAfter = $page.data.questions.every((question) =>
      Object.keys(answerStore).includes(question.id.toString())
    );
    if (!allAnsweredBefore && allAnsweredAfter) {
      goto(`${candidateAppRoute}/questions/done`);
      return;
    }

    const currentIndex = $page.data.questions.indexOf(currentQuestion);
    const newIndex = currentIndex + indexChange;

    if (newIndex >= 0 && newIndex < $page.data.questions.length) {
      goto(`${candidateAppRoute}/questions/${$page.data.questions[newIndex].id}`);
    } else {
      goto(lastPageUrl);
    }
  }

  async function gotoNextQuestion() {
    await navigateToQuestion(1, candidateAppRoute);
  }

  async function goToPreviousQuestion() {
    await navigateToQuestion(-1, candidateAppRoute);
  }
</script>

{#if currentQuestion}
  {#key currentQuestion}
    <BasicPage title={currentQuestion.text}>
      <HeadingGroup slot="heading" id="hgroup-{currentQuestion.id}">
        {#if currentQuestion.category && currentQuestion.category !== ''}
          <!-- TODO: Set color based on category -->
          <PreHeading class="text-accent">{currentQuestion.category}</PreHeading>
        {/if}
        <h1>{currentQuestion.text}</h1>
      </HeadingGroup>

      {#if currentQuestion.info && currentQuestion.info !== ''}
        <QuestionInfo info={currentQuestion.info} />
      {/if}

      <svelte:fragment slot="primaryActions">
        {#if currentQuestion.type === 'Likert'}
          <LikertResponseButtons
            aria-labelledby="hgroup-{currentQuestion.id}"
            name={currentQuestion.id}
            options={currentQuestion.options}
            {selectedKey}
            on:change={saveLikertToLocal} />
        {:else}
          {$_('error.general')}
        {/if}

        <div class="m-12 w-full items-start">
          <label for="openAnswer" class="text-m uppercase"
            >{$_('candidateApp.opinions.commentOnThisIssue')}
          </label>
          <textarea
            bind:value={openAnswer}
            on:focusout={saveOpenAnswerToLocal}
            disabled={!selectedKey}
            id="openAnswer"
            rows="4"
            class="textarea textarea-primary w-full" />
        </div>

        {#if errorMessage}
          <p class="text-error">{errorMessage}</p>
        {/if}

        <QuestionActions
          answered={selectedKey !== null}
          separateSkip={false}
          on:previous={goToPreviousQuestion}
          on:delete={removeAnswer}
          on:next={gotoNextQuestion} />
      </svelte:fragment>
    </BasicPage>
  {/key}
{:else}
  {$_('question.notFound')}
{/if}
