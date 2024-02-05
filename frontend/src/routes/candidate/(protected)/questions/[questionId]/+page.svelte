<script lang="ts">
  import {_} from 'svelte-i18n';
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {answerContext} from '$lib/utils/answerStore';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {LikertResponseButtons, QuestionActions, QuestionInfo} from '$lib/components/questions';
  import {BasicPage} from '$lib/templates/basicPage';
  import {addAnswer, updateAnswer, deleteAnswer} from '$lib/api/candidate';
  import {get} from 'svelte/store';
  import {onMount, onDestroy} from 'svelte';

  let saveInterval: NodeJS.Timeout;

  onMount(() => {
    saveInterval = setInterval(() => {
      saveOpenAnswerToLocal();
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(saveInterval);
  });

  const answers = get(answerContext.answers);
  const answerStore = answerContext.answers;
  $: questionId = $page.params.questionId;
  $: likertLocal = `candidate-app-question-${questionId}-likert`;
  $: openAnswerLocal = `candidate-app-question-${questionId}-open`;

  /**
   * A small delay before moving to the next question.
   * TODO: Make this a global variable used throughout the app.
   */
  const DELAY_M_MS = 350;

  let currentQuestion: QuestionProps | undefined;
  $: currentQuestion = $page.data.questions.find(
    (q) => q.id.toString() === $page.params.questionId.toString()
  );

  $: answer = $answerStore[$page.params.questionId];

  let selectedKey: AnswerOption['key'] | null = null;
  $: {
    const likertValue = localStorage.getItem(likertLocal);
    selectedKey = likertValue ? parseInt(likertValue) : answer?.key ?? null;
  }

  let openAnswer = '';

  $: {
    const localOpenAnswer = localStorage.getItem(openAnswerLocal);
    if (localOpenAnswer) {
      setLocalOpenAnswer();
    }
  }

  function setLocalOpenAnswer() {
    openAnswer = localStorage.getItem(openAnswerLocal) ?? '';
  }

  $: answer && setOpenAnswer();
  function setOpenAnswer() {
    if (answer && !localStorage.getItem(openAnswerLocal)) {
      openAnswer = answer.openAnswer;
    }
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

  function removeLocalAnswers() {
    localStorage.removeItem(likertLocal);
    localStorage.removeItem(openAnswerLocal);
  }

  async function saveToServer() {
    const localLikert = localStorage.getItem(likertLocal);

    if (!answer) {
      if (!localLikert) {
        return;
      }
      const response = await addAnswer(questionId, parseInt(localLikert), openAnswer);

      if (!response?.ok) {
        return;
      }

      const data = await response.json();
      const answerId = data.data.id;
      answers[$page.params.questionId] = {
        id: answerId,
        key: parseInt(localLikert),
        openAnswer
      };
    } else {
      let previousLikert = answer.key;
      if (localLikert) {
        previousLikert = parseInt(localLikert);
      }
      const response = await updateAnswer(answer.id, previousLikert, openAnswer);

      if (!response?.ok) {
        return;
      }

      answers[$page.params.questionId] = {
        id: answer.id,
        key: previousLikert,
        openAnswer
      };
    }

    removeLocalAnswers();
    answerContext.answers.set(answers);
  }

  async function removeAnswer() {
    if (!answer) {
      selectedKey = null;
      openAnswer = '';
      removeLocalAnswers();
      return;
    }

    const response = await deleteAnswer(answer.id);

    if (!response?.ok) {
      return;
    }

    selectedKey = null;
    openAnswer = '';
    removeLocalAnswers();

    delete answers[$page.params.questionId];
    answerContext.answers.set(answers);
  }

  // Skip to next question
  // TODO: Later we might want to add an explicit note that this question was skipped
  // TODO: This needs to take into account as well whether the question is already answered
  function skipQuestion() {
    gotoNextQuestion();
  }

  async function gotoNextQuestion() {
    if (!currentQuestion) {
      return;
    }
    await saveToServer();
    openAnswer = '';
    const currentIndex = $page.data.questions.indexOf(currentQuestion);
    if (currentIndex < $page.data.questions.length - 1) {
      const nextId = $page.data.questions[currentIndex + 1].id;
      const currentUrl = $page.url.pathname.replace(/\/$/, '');
      const nextQuestionUrl = `${currentUrl.substring(0, currentUrl.lastIndexOf('/'))}/${nextId}`;
      setTimeout(() => goto(nextQuestionUrl), DELAY_M_MS);
    } else {
      setTimeout(() => goto('/candidate'), DELAY_M_MS);
    }
  }

  async function goToPreviousQuestion() {
    if (!currentQuestion) {
      return;
    }
    await saveToServer();
    openAnswer = '';
    const currentIndex = $page.data.questions.indexOf(currentQuestion);
    if (currentIndex > 0) {
      const previousId = $page.data.questions[currentIndex - 1].id;
      const currentUrl = $page.url.pathname.replace(/\/$/, '');
      const previousQuestionUrl = `${currentUrl.substring(
        0,
        currentUrl.lastIndexOf('/')
      )}/${previousId}`;
      setTimeout(() => goto(previousQuestionUrl), DELAY_M_MS);
    } else {
      setTimeout(() => goto('/candidate'), DELAY_M_MS);
    }
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
