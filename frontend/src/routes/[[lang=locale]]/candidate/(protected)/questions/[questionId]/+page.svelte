<!--@component

# Candidate app question page

Display a question for answering or for dispalay if `$answersLocked` is `true`.

## Params

- `questionId`: The `Id` of the question to display.

## Settings

- `questions.showCategoryTags`: Whether to show category tags for questions.
-->

<script lang="ts">
  import { type AnyQuestionVariant, isEmptyValue } from '@openvaa/data';
  import { error } from '@sveltejs/kit';
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Input } from '$lib/components/input';
  import { Loading } from '$lib/components/loading';
  import { PreventNavigation } from '$lib/components/preventNavigation';
  import { OpinionQuestionInput, QuestionInfo } from '$lib/components/questions';
  import { Warning } from '$lib/components/warning';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { QuestionHeading } from '$lib/dynamic-components/questionHeading';
  import { logDebugError } from '$lib/utils/logger';
  import { parseParams } from '$lib/utils/route';
  import MainContent from '../../../../MainContent.svelte';
  import type { CustomData, LocalizedAnswer } from '@openvaa/app-shared';
  import type { Id } from '@openvaa/core';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { answersLocked, dataRoot, getRoute, questionBlocks, unansweredOpinionQuestions, t, userData } =
    getCandidateContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // State variables
  ////////////////////////////////////////////////////////////////////

  const { hasUnsaved } = userData;

  let bypassPreventNavigation = false;
  let canSubmit: boolean;
  let customData: CustomData['Question'];
  let errorMessage: string | undefined;
  let nextQuestionId: Id | undefined;
  let question: AnyQuestionVariant;
  let status: ActionStatus = 'loading';
  let submitLabel: string;

  ////////////////////////////////////////////////////////////////////
  // Get the current and next question
  ////////////////////////////////////////////////////////////////////

  $: {
    // Get question
    const questionId = parseParams($page).questionId;
    if (!questionId) error(500, 'No questionId provided.');
    try {
      question = $dataRoot.getQuestion(questionId);
      customData = question.customData;
      nextQuestionId = getNextQuestionId(question);
      status = 'idle';
    } catch {
      error(404, `Question with id ${questionId} not found.`);
    }
  }

  /**
   * Returns the next unanswered question’s id. Wrapped in a function to not track `unansweredOpinionQuestions`.
   */
  function getNextQuestionId(question: AnyQuestionVariant): Id | undefined {
    const index = $unansweredOpinionQuestions.findIndex((q) => q.id === question.id);
    return index != null && index < $unansweredOpinionQuestions.length - 1
      ? $unansweredOpinionQuestions[index + 1]?.id
      : undefined;
  }

  ////////////////////////////////////////////////////////////////////
  // Check if the form is dirty or empty and define submit label
  ////////////////////////////////////////////////////////////////////

  $: canSubmit = status !== 'loading' && !isEmptyValue($userData?.candidate.answers?.[question.id]?.value);

  $: submitLabel = !$hasUnsaved
    ? $t('common.continue')
    : nextQuestionId == null
      ? $t('common.saveAndReturn')
      : $t('common.saveAndContinue');

  ////////////////////////////////////////////////////////////////////
  // Handle saving answers
  ////////////////////////////////////////////////////////////////////

  /**
   * Handle `OpinionQuestionInput` value changes.
   */
  function handleValueChange({
    value,
    question: inputQuestion
  }: {
    value: unknown;
    question: AnyQuestionVariant;
  }): void {
    if (inputQuestion.id !== question.id) {
      status = 'error';
      errorMessage = undefined;
      logDebugError('handleValueChange: questionId mismatch');
      return;
    }
    console.info('sdasd');
    setAnswer({ value });
  }

  /**
   * Handle the open-answer `Input` value changes.
   */
  function handleInfoChange(info: unknown): void {
    // We can be sure of the value type but it cannot be properly typed in `Input.type`
    setAnswer({ info: info as LocalizedString });
  }

  /**
   * Merge info or value with the existing answer.
   */
  function setAnswer({ value, info }: { value?: unknown; info?: LocalizedString }): void {
    if ($answersLocked) {
      status = 'error';
      errorMessage = $t('candidateApp.common.editingNotAllowed');
      logDebugError('[Candidate app question page]: setAnswer called when answersLocked');
      return;
    }
    if (value == null && info == null) {
      status = 'error';
      errorMessage = $t('candidateApp.common.editingNotAllowed');
      logDebugError('[Candidate app question page]: setAnswer called with no value nor info');
      return;
    }
    const answer: Partial<LocalizedAnswer> = $userData?.candidate.answers?.[question.id] ?? {};
    if (customData.allowOpen && info) answer.info = info;
    if (value != null) answer.value = value as LocalizedAnswer['value'];
    userData.setAnswer(question.id, answer as LocalizedAnswer);
    status = 'idle';
  }

  /**
   * Handle the submit button click.
   */
  async function handleSubmit(): Promise<void> {
    if (!canSubmit) {
      status = 'error';
      errorMessage = $t('candidateApp.error.saveFailed');
      logDebugError('[Candidate app question page]: handleSubmit called when canSubmit is false');
      return;
    }
    status = 'loading';
    // Request email to be sent in the backend
    const result = await userData.save().catch((e) => {
      logDebugError(`Error saving userData: ${e?.message}`);
      return undefined;
    });
    if (result?.type !== 'success') {
      status = 'error';
      errorMessage = $t('candidateApp.error.saveFailed');
      return;
    }
    status = 'success';
    goto(
      nextQuestionId == null
        ? $getRoute('CandAppQuestions')
        : $getRoute({ route: 'CandAppQuestion', questionId: nextQuestionId })
    );
  }

  /**
   * Handle cancel button click.
   */
  function handleCancel(): void {
    bypassPreventNavigation = true;
    userData.resetUnsaved();
    goto($getRoute('CandAppQuestions')).then(() => (bypassPreventNavigation = false));
  }

  /**
   * Reset saved answers when leaving the page.
   */
  function handleNavigationConfirm(): void {
    userData.resetUnsaved();
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-200' } });
</script>

{#if status !== 'loading' && question}
  {@const { info, text } = question}
  {@const answer = $userData?.candidate.answers?.[question.id]}
  {#key question.id}
    <PreventNavigation
      active={() => !bypassPreventNavigation && $hasUnsaved && !$answersLocked}
      onConfirm={handleNavigationConfirm} />

    <MainContent title={text}>
      <svelte:fragment slot="note">
        {#if $answersLocked}
          <Warning>
            {$t('candidateApp.common.editingNotAllowed')}
          </Warning>
        {/if}
      </svelte:fragment>

      <QuestionHeading {question} questionBlocks={$questionBlocks} slot="heading" />

      {#if info && info !== ''}
        <QuestionInfo {info} />
      {/if}

      <div slot="primaryActions" class="grid w-full justify-items-center gap-lg">
        <!-- Question answer proper -->

        <OpinionQuestionInput
          {question}
          {answer}
          mode={$answersLocked ? 'display' : 'answer'}
          onShadedBg
          onChange={handleValueChange} />

        <!-- Open answer -->

        {#if customData.allowOpen}
          <Input
            type="textarea-multilingual"
            label={$t('candidateApp.questions.openAnswerPrompt')}
            value={answer?.info}
            disabled={!canSubmit}
            locked={$answersLocked}
            placeholder="—"
            onShadedBg
            onChange={handleInfoChange} />
        {/if}

        <!-- Error message -->

        {#if status === 'error'}
          <ErrorMessage inline message={errorMessage} class="mb-lg mt-md" />
        {/if}

        <!-- Submit or cancel -->

        <div class="grid w-full justify-items-center">
          {#if !$answersLocked}
            <Button
              text={submitLabel}
              on:click={handleSubmit}
              disabled={!canSubmit}
              type="submit"
              id="submitButton"
              variant="main"
              icon="next" />

            <Button text={$t('common.cancel')} on:click={handleCancel} color="warning" />
          {:else}
            <Button text={$t('common.return')} href={$getRoute('CandAppQuestions')} variant="main" />
          {/if}
        </div>
      </div>
    </MainContent>
  {/key}
{:else}
  <Loading class="mt-lg" />
{/if}
