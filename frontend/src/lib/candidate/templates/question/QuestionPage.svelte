<script lang="ts">
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {t} from '$lib/i18n';
  import {getContext} from 'svelte';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {addAnswer, updateAnswer} from '$lib/api/candidate';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Warning} from '$lib/components/warning';
  import {Button} from '$lib/components/button';
  import {LikertResponseButtons, QuestionInfo} from '$lib/components/questions';
  import {MultilangTextInput} from '$candidate/components/textArea';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import type {QuestionPageProps} from './QuestionPage.type';

  type $$Props = QuestionPageProps;
  export let editMode: $$Props['editMode'] = false;

  const {answersStore, questionsStore} = getContext<CandidateContext>('candidate');

  $: answers = $answersStore;
  $: questions = $questionsStore;

  $: questionId = $page.params.questionId;

  // Local storage keys, depend on the question id
  $: likertLocal = `candidate-app-question-${questionId}-likert`;
  $: openAnswerLocal = `candidate-app-question-${questionId}-open`;

  $: currentQuestion = questions?.[questionId];
  $: answer = answers?.[questionId]; // undefined if not answered

  let openAnswerTextArea: MultilangTextInput; // Used to clear the local storage from the parent component
  let openAnswer: LocalizedString = {};

  let selectedKey: AnswerOption['key'] | undefined;

  // Set the selected key on page load, local storage takes precedence
  $: {
    const likertValue = localStorage.getItem(likertLocal);
    selectedKey = likertValue ? parseInt(likertValue) : answer?.key;
  }

  const saveLikertToLocal = ({detail}: CustomEvent) => {
    selectedKey = detail.value;
    localStorage.setItem(likertLocal, detail.value);
  };

  const removeLocalAnswerToQuestion = () => {
    localStorage.removeItem(likertLocal);
    openAnswerTextArea.deleteLocal();
    openAnswer = {};
  };

  let errorMessage = '';
  let errorTimeout: NodeJS.Timeout;

  const showError = (message: string) => {
    errorMessage = message;
    clearTimeout(errorTimeout);
    errorTimeout = setTimeout(() => {
      errorMessage = '';
    }, 5000);
  };

  const saveToServer = async () => {
    if (!answer) {
      // New answer

      // Likert is required for an answer to be saved
      if (!selectedKey) {
        return;
      }

      const response = await addAnswer(questionId, selectedKey, openAnswer);
      if (!response?.ok) {
        showError($t('candidateApp.opinions.answerSaveError'));
        return;
      }

      const data = await response.json();
      const answerId = data.data.id;
      updateAnswerStore(answerId, selectedKey, openAnswer);
    } else {
      // Editing existing answer

      const likertAnswer = selectedKey ?? answer.key;
      const response = await updateAnswer(answer.id, likertAnswer, openAnswer);
      if (!response?.ok) {
        showError($t('candidateApp.opinions.answerSaveError'));
        return;
      }

      updateAnswerStore(answer.id, likertAnswer, openAnswer);
    }

    removeLocalAnswerToQuestion();
  };

  const updateAnswerStore = (
    answerId: string,
    key: AnswerOption['key'],
    openAnswer: LocalizedString
  ) => {
    if (answers) {
      answers[questionId] = {
        id: answerId,
        key,
        openAnswer
      };
      answersStore.set(answers);
    }
  };

  const saveAndReturn = async () => {
    await saveToServer();
    goto($getRoute(Route.CandAppQuestions));
  };

  const saveAndContinue = async () => {
    if (!questions || !currentQuestion) {
      return;
    }

    await saveToServer();

    const nextUnansweredQuestion = Object.values(questions).find(
      (question) => !answers?.[question.id]
    );

    if (!nextUnansweredQuestion) {
      // All questions answered
      goto($getRoute(Route.CandAppHome));
      return;
    }
    goto($getRoute({route: Route.CandAppQuestions, id: nextUnansweredQuestion.id}));
  };
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

        {#if !currentQuestion.editable}
          <Button
            on:click={() => goto($getRoute(Route.CandAppQuestions))}
            variant="main"
            text={$t('candidateApp.questions.return')} />
        {:else if editMode}
          <div class="flex justify-center">
            <Button
              on:click={saveAndReturn}
              class="mx-6"
              variant="main"
              text={$t('candidateApp.questions.saveAndReturn')} />
            <Button
              on:click={() => goto($getRoute(Route.CandAppQuestions))}
              class="mx-6"
              variant="main"
              text={$t('candidateApp.questions.cancel')} />
          </div>
        {:else}
          <Button
            on:click={saveAndContinue}
            variant="main"
            icon="next"
            disabled={!selectedKey}
            text={$t('candidateApp.questions.saveAndContinue')} />
        {/if}
      </svelte:fragment>
    </BasicPage>
  {/key}
{:else}
  {$t('question.notFound')}
{/if}
