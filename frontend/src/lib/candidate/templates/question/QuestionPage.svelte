<script lang="ts">
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { MultilangTextInput } from '$candidate/components/textArea';
  import { addAnswer, updateAnswer } from '$lib/legacy-api/candidate';
  import { Button } from '$lib/components/button';
  import { CategoryTag } from '$lib/components/categoryTag';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { LikertResponseButtons, QuestionInfo } from '$lib/components/questions';
  import { Warning } from '$lib/components/warning';
  import { t } from '$lib/i18n';
  import { BasicPage } from '$lib/templates/basicPage';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import type { CandidateContext } from '$lib/utils/legacy-candidateContext';
  import type { CandidateAnswer } from '$types/legacy-candidateAttributes';
  import type { QuestionPageProps } from './QuestionPage.type';

  type $$Props = QuestionPageProps;
  export let currentQuestion: $$Props['currentQuestion'];
  export let editMode: $$Props['editMode'] = false;

  let answer: CandidateAnswer | undefined;
  let category: LegacyQuestionCategoryProps;
  let info: string | undefined;
  let likertLocal: string;
  let openAnswer: LocalizedString = {};
  let openAnswerLocal: string;
  let openAnswerTextArea: MultilangTextInput; // Used to clear the local storage from the parent component
  let options: Array<LegacyAnswerOption>;
  let questionId: string;
  let questionIndex: number | undefined;
  let selectedKey: LegacyAnswerOption['key'] | undefined;

  const { opinionAnswers, progress, answersLocked, opinionQuestions, unansweredOpinionQuestions } =
    getContext<CandidateContext>('candidate');

  $: {
    questionId = currentQuestion.id;
    questionIndex = $opinionQuestions?.findIndex((q) => q === currentQuestion);
    if (questionIndex === -1) questionIndex = undefined;
    // Set the selected key on page load, local storage takes precedence
    likertLocal = `candidate-app-question-${questionId}-likert`;
    openAnswerLocal = `candidate-app-question-${questionId}-open`;
    const localValue = localStorage.getItem(likertLocal);
    if (localValue != null) {
      const intValue = typeof localValue === 'number' ? localValue : parseInt(`${localValue}`);
      if (`${intValue}` !== `${localValue}` || !Number.isInteger(intValue))
        throw new Error(`Likert question answer value is not an integer: ${localValue}`);
      answer = undefined;
      selectedKey = intValue;
    } else {
      answer = $opinionAnswers?.[questionId]; // undefined if not answered
      selectedKey = answer ? parseInt(`${answer.value}`) : undefined;
    }
    category = currentQuestion.category;
    info = currentQuestion.info;
    options = currentQuestion.values ?? [];
  }

  function saveLikertToLocal({ detail }: CustomEvent) {
    selectedKey = detail.value;
    localStorage.setItem(likertLocal, detail.value);
  }

  function removeLocalAnswerToQuestion() {
    localStorage.removeItem(likertLocal);
    openAnswerTextArea.deleteLocal();
    openAnswer = {};
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
  }

  function updateAnswerStore(answerId: string, value: LegacyAnswerProps['value'], openAnswer: LocalizedString) {
    if ($opinionAnswers) {
      $opinionAnswers[questionId] = {
        id: String(answerId),
        value: value,
        openAnswer
      };
    }
  }

  async function saveAndReturn() {
    await saveToServer();
    goto($getRoute(ROUTE.CandAppQuestions));
  }

  async function saveAndContinue() {
    await saveToServer();

    if ($unansweredOpinionQuestions?.length === 0) {
      // All questions answered
      goto($getRoute(ROUTE.CandAppHome));
      return;
    }
    const nextUnansweredQuestion = $unansweredOpinionQuestions?.[0]?.id;
    goto($getRoute({ route: ROUTE.CandAppQuestions, id: nextUnansweredQuestion }));
  }

  function cancelAndReturn() {
    removeLocalAnswerToQuestion();
    goto($getRoute(ROUTE.CandAppQuestions));
  }
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
    <Warning display={!!$answersLocked} slot="note">{$t('candidateApp.common.editingNotAllowed')}</Warning>

    <HeadingGroup slot="heading" id="hgroup-{questionId}">
      <PreHeading>
        {#if questionIndex != null && $opinionQuestions}
          <!-- Index of question within all questions -->
          {#if !category}
            {$t('common.question')}
          {/if}
          <span class="text-secondary">{questionIndex + 1}/{$opinionQuestions.length}</span>
        {/if}
        {#if category}
          <CategoryTag {category} />
        {/if}
      </PreHeading>
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
          mode={!$answersLocked ? 'answer' : 'display'}
          {options}
          {selectedKey}
          on:change={saveLikertToLocal} />
      {:else}
        {$t('error.general')}
      {/if}

      <MultilangTextInput
        id="openAnswer"
        headerText={$t('candidateApp.questions.openAnswerPrompt')}
        localStorageId={openAnswerLocal}
        previouslySavedMultilang={answer?.openAnswer ?? undefined}
        disabled={!selectedKey}
        locked={!!$answersLocked}
        placeholder="—"
        bind:multilangText={openAnswer}
        bind:this={openAnswerTextArea} />

      {#if errorMessage}
        <p class="text-error">{errorMessage}</p>
      {/if}

      {#if !!$answersLocked}
        <Button on:click={() => goto($getRoute(ROUTE.CandAppQuestions))} variant="main" text={$t('common.return')} />
      {:else if editMode}
        <div class="grid w-full grid-cols-[1fr] justify-items-center">
          <Button on:click={saveAndReturn} variant="main" text={$t('common.saveAndReturn')} />
          <Button on:click={cancelAndReturn} color="warning" text={$t('common.cancel')} />
        </div>
      {:else}
        <Button
          on:click={saveAndContinue}
          variant="main"
          icon="next"
          disabled={!selectedKey}
          text={$t('common.saveAndContinue')} />
      {/if}
    </svelte:fragment>
  </BasicPage>
{/key}
