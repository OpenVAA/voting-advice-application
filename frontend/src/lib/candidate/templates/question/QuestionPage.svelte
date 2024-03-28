<script lang="ts">
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {t} from '$lib/i18n';
  import {addAnswer, updateAnswer} from '$lib/api/candidate';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {LikertResponseButtons, QuestionInfo} from '$lib/components/questions';
  import {BasicPage} from '$lib/templates/basicPage';
  import {MultilangTextInput} from '$candidate/components/textArea';
  import {getContext} from 'svelte';
  import {type CandidateContext} from '$lib/utils/candidateStore';
  import {Warning} from '$lib/components/warning';
  import {Button} from '$lib/components/button';
  import type {QuestionPageProps} from './QuestionPage.type';

  type $$Props = QuestionPageProps;

  export let editMode: $$Props['editMode'] = false;

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

  async function saveAndReturn() {
    await saveToServer();
    goto($getRoute(Route.CandAppQuestions));
  }

  async function saveAndContinue() {
    if (!currentQuestion) {
      return;
    }

    // Save the current answer to the server before navigating
    await saveToServer();

    const nextQuestion = $page.data.questions.find(
      (question) => !answers || !Object.keys(answers).includes(question.id.toString())
    );

    if (!nextQuestion) {
      goto($getRoute(Route.CandAppHome));
      return;
    }
    goto($getRoute({route: Route.CandAppQuestions, id: nextQuestion.id}));
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

        {#if !currentQuestion.editable}
          <Button on:click={() => goto($getRoute(Route.CandAppQuestions))} text="Return" />
        {:else if editMode}
          <div class="flex justify-center">
            <Button
              on:click={saveAndReturn}
              class="mx-6"
              variant="main"
              icon="arrow"
              text="Save and Return" />
            <Button
              on:click={() => goto($getRoute(Route.CandAppQuestions))}
              class="mx-6"
              icon="arrow"
              variant="main"
              text="Cancel" />
          </div>
        {:else}
          <Button
            on:click={saveAndContinue}
            class="mx-8"
            variant="main"
            icon="arrow"
            disabled={!selectedKey}
            text="Save and Continue" />
        {/if}
      </svelte:fragment>
    </BasicPage>
  {/key}
{:else}
  {$t('question.notFound')}
{/if}
