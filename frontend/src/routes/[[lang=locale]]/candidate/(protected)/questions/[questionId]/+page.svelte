<script lang="ts">
  import { getContext, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { MultilangTextInput } from '$candidate/components/textArea';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { CategoryTag } from '$lib/components/legacy/categoryTag';
  import { LikertResponseButtons, QuestionInfo } from '$lib/components/legacy/questions';
  import { Warning } from '$lib/components/warning';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { t } from '$lib/i18n';
  import { addAnswer, updateAnswer } from '$lib/legacy-api/candidate';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import Layout from '../../../../Layout.svelte';
  import type { CandidateContext } from '$lib/utils/legacy-candidateContext';
  import type { CandidateAnswer } from '$types/legacy-candidateAttributes';
  import type { PageData } from './$types';

  export let data: PageData;
  const { editMode } = data;

  const { pageStyles } = getLayoutContext(onDestroy);
  pageStyles.push({ drawer: { background: 'bg-base-200' } });

  const { opinionAnswers, answersLocked, opinionQuestions, unansweredOpinionQuestions } =
    getContext<CandidateContext>('candidate');

  let answer: CandidateAnswer | undefined;
  let category: LegacyQuestionCategoryProps;
  let info: string | undefined;
  let openAnswer: LocalizedString = {};
  let openAnswerTextArea: MultilangTextInput; // Used to clear the local storage from the parent component
  let options: Array<LegacyAnswerOption>;
  let currentQuestion: LegacyQuestionProps;
  let questionIndex: number | undefined;
  let selectedKey: LegacyAnswerOption['key'] | undefined;
  let likertLocal: string;
  let openAnswerLocal: string;

  $: questionId = $page.params.questionId;
  $: {
    $opinionQuestions?.some((question, index) => {
      if (question.id === questionId) {
        currentQuestion = question;
        questionIndex = index;
        category = question.category;
        info = question.info;
        options = question.values ?? [];
        return true;
      }
      return false;
    });

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

<Layout title={currentQuestion?.text || ''}>
  <div class="mt-xl text-center text-secondary" role="note" slot="note">
    <Warning display={!!$answersLocked}>{$t('candidateApp.common.editingNotAllowed')}</Warning>
  </div>

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
    <h1>{currentQuestion?.text}</h1>
  </HeadingGroup>

  {#if info && info !== ''}
    <QuestionInfo {info} />
  {/if}

  <svelte:fragment slot="primaryActions">
    {#if currentQuestion?.type === 'singleChoiceOrdinal'}
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
</Layout>
