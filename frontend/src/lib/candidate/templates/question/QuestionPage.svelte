<script lang="ts">
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {getContext} from 'svelte';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {addAnswer, updateAnswer} from '$lib/api/candidate';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Button} from '$lib/components/button';
  import {CategoryTag} from '$lib/components/categoryTag';
  import {LikertResponseButtons, QuestionInfo} from '$lib/components/questions';
  import {MultilangTextInput} from '$candidate/components/textArea';
  import {Warning} from '$lib/components/warning';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import type {QuestionPageProps} from './QuestionPage.type';

  type $$Props = QuestionPageProps;
  export let currentQuestion: $$Props['currentQuestion'];
  export let questions: $$Props['questions'];
  export let editMode: $$Props['editMode'] = false;

  const {opinionAnswers, progress, questionsLocked, unansweredOpinionQuestions} =
    getContext<CandidateContext>('candidate');

  $: answer = $opinionAnswers?.[questionId]; // undefined if not answered

  $: questionId = currentQuestion.id;

  // Local storage keys, depend on the question id
  $: likertLocal = `candidate-app-question-${questionId}-likert`;
  $: openAnswerLocal = `candidate-app-question-${questionId}-open`;

  let openAnswerTextArea: MultilangTextInput; // Used to clear the local storage from the parent component
  let openAnswer: LocalizedString = {};

  let selectedKey: AnswerOption['key'] | undefined;

  // Set the selected key on page load, local storage takes precedence
  $: {
    const likertValue = localStorage.getItem(likertLocal);
    selectedKey = likertValue ? parseInt(likertValue) : answer?.value;
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
        showError($t('candidateApp.questions.answerSaveError'));
        return;
      }

      const data = await response.json();
      const answerId = data.data.id;
      updateAnswerStore(answerId, selectedKey, openAnswer);
    } else {
      // Editing existing answer

      const likertAnswer = selectedKey ?? answer.value;
      const response = await updateAnswer(answer.id, likertAnswer, openAnswer);
      if (!response?.ok) {
        showError($t('candidateApp.questions.answerSaveError'));
        return;
      }

      updateAnswerStore(answer.id, likertAnswer, openAnswer);
    }

    removeLocalAnswerToQuestion();
  };

  const updateAnswerStore = (
    answerId: string,
    value: AnswerProps['value'],
    openAnswer: LocalizedString
  ) => {
    if ($opinionAnswers) {
      $opinionAnswers[questionId] = {
        id: String(answerId),
        value: value,
        openAnswer
      };
    }
  };

  const saveAndReturn = async () => {
    await saveToServer();
    goto($getRoute(Route.CandAppQuestions));
  };

  const saveAndContinue = async () => {
    await saveToServer();

    if ($unansweredOpinionQuestions && $unansweredOpinionQuestions.length === 0) {
      // All questions answered
      goto($getRoute(Route.CandAppHome));
      return;
    }
    const nextUnansweredQuestion = ($unansweredOpinionQuestions ?? [])[0].id;
    goto($getRoute({route: Route.CandAppQuestions, id: nextUnansweredQuestion}));
  };

  const cancelAndReturn = () => {
    removeLocalAnswerToQuestion();
    goto($getRoute(Route.CandAppQuestions));
  };

  $: category = currentQuestion.category;
  $: info = currentQuestion.info;
  $: options = currentQuestion.values?.map(({key, label}) => ({
    key,
    label: label
  }));
</script>

<!--
@component
Display the page for answering a single question.
In addition to the question, includes a Likert scale and a text area for commenting.

### Properties
- `currentQuestion` (required): The question to display.
- `questions` (required): Array of all questions.
- `editMode` (optional): Whether the page is in edit mode. Changes the buttons displayed.

### Usage
```tsx
<QuestionPage {currentQuestion} {questions} />
```

-->

{#key currentQuestion}
  <BasicPage
    title={currentQuestion.text}
    class="bg-base-200"
    progress={$progress?.progress}
    progressMax={$progress?.max}>
    <Warning display={!!$questionsLocked} slot="note">{$t('questions.cannotEditWarning')}</Warning>

    <HeadingGroup slot="heading" id="hgroup-{questionId}">
      {#if category}
        <PreHeading><CategoryTag {category} /></PreHeading>
      {/if}
      <h1>{currentQuestion.text}</h1>
    </HeadingGroup>

    {#if info && info !== ''}
      <QuestionInfo {info} />
    {/if}

    <svelte:fragment slot="primaryActions">
      {#if currentQuestion.type === 'singleChoiceOrdinal'}
        <LikertResponseButtons
          aria-labelledby="hgroup-{questionId}"
          name={questionId}
          mode={!$questionsLocked ? 'answer' : 'display'}
          {options}
          {selectedKey}
          on:change={saveLikertToLocal} />
      {:else}
        {$t('error.general')}
      {/if}

      <MultilangTextInput
        id="openAnswer"
        headerText={$t('candidateApp.questions.commentOnThisIssue')}
        localStorageId={openAnswerLocal}
        previouslySavedMultilang={answer?.openAnswer ?? undefined}
        disabled={!selectedKey}
        locked={!!$questionsLocked}
        placeholder="—"
        bind:multilangText={openAnswer}
        bind:this={openAnswerTextArea} />

      {#if errorMessage}
        <p class="text-error">{errorMessage}</p>
      {/if}

      {#if !!$questionsLocked}
        <Button
          on:click={() => goto($getRoute(Route.CandAppQuestions))}
          variant="main"
          text={$t('candidateApp.questions.return')} />
      {:else if editMode}
        <div class="grid w-full grid-cols-[1fr] justify-items-center">
          <Button
            on:click={saveAndReturn}
            variant="main"
            text={$t('candidateApp.questions.saveAndReturn')} />
          <Button
            on:click={cancelAndReturn}
            color="warning"
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
