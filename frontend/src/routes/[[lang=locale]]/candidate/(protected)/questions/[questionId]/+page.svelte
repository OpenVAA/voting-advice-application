<!--@component

# Candidate app question page

Display a question for answering or for dispalay if `$answersLocked` is `true`.

## Params

- `questionId`: The `Id` of the question to display.

## Settings

- `questions.showCategoryTags`: Whether to show category tags for questions.
-->

<script lang="ts">
  import { type CustomData, getCustomData, type LocalizedAnswer } from '@openvaa/app-shared';
  import { type AnyQuestionVariant, Election, isEmptyValue } from '@openvaa/data';
  import { error } from '@sveltejs/kit';
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Input } from '$lib/components/input';
  import { Loading } from '$lib/components/loading';
  import { PreventNavigation } from '$lib/components/preventNavigation';
  import { OpinionQuestionInput, QuestionBasicInfo } from '$lib/components/questions';
  import { Warning } from '$lib/components/warning';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { QuestionHeading } from '$lib/dynamic-components/questionHeading';
  import { logDebugError } from '$lib/utils/logger';
  import { parseParams } from '$lib/utils/route';
  import MainContent from '../../../../MainContent.svelte';
  import type { Id } from '@openvaa/core';
  import { Hero } from '$lib/components/hero';
  import { Icon } from '$lib/components/icon';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { CategoryTag } from '$lib/components/categoryTag';
  import ElectionTag from '$lib/components/electionTag/ElectionTag.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const {
    answersLocked,
    dataRoot,
    getRoute,
    questionBlocks,
    selectedElections,
    unansweredOpinionQuestions,
    t,
    userData
  } = getCandidateContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // State variables
  ////////////////////////////////////////////////////////////////////

  const { hasUnsaved } = userData;

  let bypassPreventNavigation = false;
  let cancelLabel: string;
  let canSubmit: boolean;
  let customData: CustomData['Question'];
  let errorMessage: string | undefined;
  let isElectionNoteRead = false;
  let isLastUnanswered: boolean;
  let nextQuestionId: Id | undefined;
  let previousElectionIds = '';
  let question: AnyQuestionVariant;
  let shouldShowElectionNote = false;
  let status: ActionStatus = 'loading';
  let submitLabel: string;
  let submitRoute: string;

  ////////////////////////////////////////////////////////////////////
  // Get the current and next question
  ////////////////////////////////////////////////////////////////////

  $: {
    // Get question
    const questionId = parseParams($page).questionId;
    if (!questionId) error(500, 'No questionId provided.');
    try {
      question = $dataRoot.getQuestion(questionId);
      customData = getCustomData(question);
      nextQuestionId = getNextQuestionId(question);
      if ($selectedElections.length > 1) {
        // Possibly show election note if elections have changed
        const electionIds = question.category.elections
          .toSorted()
          .map((e) => e.id)
          .join(',');
        shouldShowElectionNote = previousElectionIds !== electionIds;
        isElectionNoteRead = false;
        previousElectionIds = electionIds;
      }
      status = 'idle';
    } catch {
      error(404, `Question with id ${questionId} not found.`);
    }
    isLastUnanswered = getIsLastUnanswered();
  }

  /**
   * A non-reactive utility set the isLastUnanswered flag, which we use to route to the Home page after answering the last one.
   */
  function getIsLastUnanswered(): boolean {
    return $unansweredOpinionQuestions.length === 1;
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
  // Check if the form is dirty or empty and define button labels
  ////////////////////////////////////////////////////////////////////

  $: canSubmit = status !== 'loading' && !isEmptyValue($userData?.candidate.answers?.[question.id]?.value);

  $: if (nextQuestionId) {
    submitRoute = $getRoute({ route: 'CandAppQuestion', questionId: nextQuestionId });
    submitLabel = $t('common.saveAndContinue');
  } else if (isLastUnanswered) {
    submitRoute = $getRoute('CandAppHome');
    submitLabel = $t('common.saveAndContinue');
  } else {
    submitRoute = $getRoute('CandAppQuestions');
    submitLabel = $hasUnsaved ? $t('common.saveAndReturn') : $t('common.return');
  }

  // The label is return when loading, bc saving isn't cancellable anymore
  $: cancelLabel = status === 'loading' || !$hasUnsaved ? $t('common.return') : $t('common.cancel');

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
    goto(submitRoute);
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

{#if question}
  {@const { info, text } = question}
  {@const customData = getCustomData(question)}
  {@const answer = $userData?.candidate.answers?.[question.id]}

  {#key question.id}
    <PreventNavigation
      active={() => !bypassPreventNavigation && $hasUnsaved && !$answersLocked}
      onConfirm={handleNavigationConfirm} />

    {#if shouldShowElectionNote && !isElectionNoteRead}
      {@const electionNames = question.category.elections.map((e) => e.shortName).join(', ')}
      <MainContent title={electionNames}>
        <HeadingGroup slot="heading" class="relative">
          <h1>
            {#each question.category.elections as election}
              <ElectionTag {election} class="text-xl" />
            {/each}
          </h1>
        </HeadingGroup>

        <p class="ingress text-center">
          {#if question.category.elections.length === $selectedElections.length}
            {$t('candidateApp.questions.relatedElectionsAll')}
          {:else}
            {$t('candidateApp.questions.relatedElectionsSome', {
              electionNames
            })}
          {/if}
        </p>

        <Button
          slot="primaryActions"
          text={$t('common.continue')}
          on:click={() => (isElectionNoteRead = true)}
          variant="main" />
      </MainContent>
    {:else}
      <MainContent title={text}>
        <svelte:fragment slot="note">
          {#if $answersLocked}
            <Warning>
              {$t('candidateApp.common.editingNotAllowed')}
            </Warning>
          {/if}
        </svelte:fragment>

        <figure role="presentation" slot="hero">
          {#if customData?.hero}
            <Hero content={customData?.hero} />
          {/if}
        </figure>

        <QuestionHeading slot="heading" {question} questionBlocks={$questionBlocks} onShadedBg />

        {#if info && info !== ''}
          <QuestionBasicInfo {info} />
        {/if}

        <div slot="primaryActions" class="gap-lg grid w-full justify-items-center">
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
              placeholder={canSubmit ? '' : $t('candidateApp.questions.answerQuestionFirst')}
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
                loading={status === 'loading'}
                loadingText={$t('common.saving')}
                type="submit"
                id="submitButton"
                variant="main"
                icon="next" />
              <Button text={cancelLabel} on:click={handleCancel} color="warning" />
            {:else}
              <Button text={$t('common.return')} href={$getRoute('CandAppQuestions')} variant="main" />
            {/if}
          </div>
        </div>
      </MainContent>
    {/if}
  {/key}
{:else}
  <Loading class="mt-lg" />
{/if}
