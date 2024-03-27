<script lang="ts">
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {t} from '$lib/i18n';
  import {addAnswer, updateAnswer, deleteAnswer} from '$lib/api/candidate';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {LikertResponseButtons, QuestionActions, QuestionInfo} from '$lib/components/questions';
  import {BasicPage} from '$lib/templates/basicPage';
  import {MultilangTextInput} from '$candidate/components/textArea';
  import {getContext} from 'svelte';
  import {type CandidateContext} from '$lib/utils/candidateStore';
  import Warning from '$lib/components/warning/Warning.svelte';
  const {answersStore} = getContext<CandidateContext>('candidate');
  $: answers = $answersStore;

  $: questionId = $page.params.questionId;

  // Local storage keys, depend on the question id
  $: likertLocal = `candidate-app-question-${questionId}-likert`;
  $: openAnswerLocal = `candidate-app-question-${questionId}-open`;

  let currentQuestion: QuestionProps | undefined;
  $: currentQuestion = $page.data.questions.find((q) => q.id.toString() === questionId.toString());

  $: answer = answers?.[questionId]; // null if not answered

  let openAnswerTextArea: MultilangTextInput; // Used to clear the local storage from the parent component
  let openAnswer: LocalizedString = {};

  let selectedKey: AnswerOption['key'] | null;

  // Set the selected key on page load, local storage takes precedence
  $: {
    const likertValue = localStorage.getItem(likertLocal);
    if (likertValue) {
      selectedKey = parseInt(likertValue);
    } else {
      selectedKey = answer?.key ?? null;
    }
  }

  function saveLikertToLocal({detail}: CustomEvent) {
    selectedKey = detail.value;
    localStorage.setItem(likertLocal, detail.value);
  }

  function removeLocalAnswerToQuestion() {
    localStorage.removeItem(likertLocal);
    openAnswerTextArea.deleteLocal();
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
        showError($t('candidateApp.opinions.answerSaveError'));
        return;
      }

      const data = await response.json();
      const answerId = data.data.id;

      if (answers) {
        answers[questionId] = {
          id: answerId,
          key: parseInt(localLikert),
          openAnswer
        };
      }
    } else {
      // Existing answer

      let previousLikert = answer.key;

      // A local likert value takes precedence over the server value
      if (localLikert) {
        previousLikert = parseInt(localLikert);
      }

      const response = await updateAnswer(answer.id, previousLikert, openAnswer);
      if (!response?.ok) {
        showError($t('candidateApp.opinions.answerSaveError'));
        return;
      }

      if (answers) {
        answers[questionId] = {
          id: answer.id,
          key: previousLikert,
          openAnswer
        };
      }
    }

    removeLocalAnswerToQuestion();
    openAnswer = {};
    answersStore.set(answers);
  }

  async function removeAnswer() {
    if (!answer) {
      // No answer in database, only local answers need to be removed
      selectedKey = null;
      openAnswer = {};
      removeLocalAnswerToQuestion();
      return;
    }

    const response = await deleteAnswer(answer.id);
    if (!response?.ok) {
      showError($t('candidateApp.opinions.answerDeleteError'));
      return;
    }

    selectedKey = null;
    openAnswer = {};
    removeLocalAnswerToQuestion();

    delete answers?.[questionId];
    answersStore.set(answers);
  }

  async function navigateToQuestion(indexChange: number, urlAfterLastQuestion: string) {
    if (!currentQuestion) {
      return;
    }

    // Check if all questions have been answered (before answer to current question is saved)
    const allAnsweredBefore = $page.data.questions.every(
      (question) => answers && Object.keys(answers).includes(question.id.toString())
    );

    // Save the current answer to the server before navigating
    await saveToServer();

    // Check if all questions have been answered (after answer is saved)
    // If the last answer was filled now, go to page with congratulatory message
    const allAnsweredAfter = $page.data.questions.every(
      (question) => answers && Object.keys(answers).includes(question.id.toString())
    );
    if (!allAnsweredBefore && allAnsweredAfter) {
      goto($getRoute(Route.CandAppReady));
      return;
    }

    const currentIndex = $page.data.questions.indexOf(currentQuestion);
    const newIndex = currentIndex + indexChange;

    if (newIndex >= 0 && newIndex < $page.data.questions.length) {
      goto($getRoute({route: Route.CandAppQuestions, id: $page.data.questions[newIndex].id}));
    } else {
      goto(urlAfterLastQuestion);
    }
  }

  async function gotoNextQuestion() {
    await navigateToQuestion(1, $getRoute(Route.CandAppSummary));
  }

  async function goToPreviousQuestion() {
    await navigateToQuestion(-1, $getRoute(Route.CandAppQuestions));
  }
</script>

{#if currentQuestion}
  {#key currentQuestion}
    <BasicPage title={currentQuestion.text} class="bg-base-200">
      <Warning display={!currentQuestion.editable} slot="note"
        >{$t('questions.cannotEditWarning')}</Warning>

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
        {#if currentQuestion.type === 'singleChoiceOrdinal'}
          <LikertResponseButtons
            aria-labelledby="hgroup-{currentQuestion.id}"
            name={currentQuestion.id}
            options={currentQuestion.values}
            mode={currentQuestion.editable ? 'answer' : 'display'}
            {selectedKey}
            on:change={saveLikertToLocal} />
        {:else}
          {$t('error.general')}
        {/if}

        <MultilangTextInput
          id="openAnswer"
          headerText={$t('candidateApp.opinions.commentOnThisIssue')}
          localStorageId={openAnswerLocal}
          previouslySavedMultilang={answer?.openAnswer ?? undefined}
          disabled={!selectedKey}
          locked={!currentQuestion.editable}
          placeholder="—"
          bind:multilangText={openAnswer}
          bind:this={openAnswerTextArea} />

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
  {$t('question.notFound')}
{/if}
