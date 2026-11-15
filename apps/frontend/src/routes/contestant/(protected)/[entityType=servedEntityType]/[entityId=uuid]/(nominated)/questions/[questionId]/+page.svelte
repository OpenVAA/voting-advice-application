<!--@component

# Contestant app question page

Display a question for answering, or for display while answers are locked.

The Save button stores the answer and leads on: to the first opinion question that is still unanswered while one remains; once the save has answered the last unanswered one, to the entity's first incomplete task or, with none, to the entity's home; and back to the questions list after an edit of an answered question when none is unanswered. Its label says which before the save. A save that fails stays on the page and says so.

## Params

- `questionId`: The `Id` of the question to display.

## Settings

- `questions.showCategoryTags`: Whether to show category tags for questions.
- `contestantApp.questions.hideVideo`: Whether to hide video content for questions.
- `contestantApp.questions.hideHero`: Whether to hide hero content for questions.
-->

<script lang="ts">
  import { getCustomData, log } from '@openvaa/app-shared';
  import { isEmptyValue } from '@openvaa/data';
  import { error } from '@sveltejs/kit';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { NotEditableNote } from '$contestant/components/notEditableNote';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Hero } from '$lib/components/hero';
  import { Input } from '$lib/components/input';
  import { Loading } from '$lib/components/loading';
  import { PreventNavigation } from '$lib/components/preventNavigation';
  import { OpinionQuestionInput, QuestionBasicInfo } from '$lib/components/questions';
  import { hasNomination, questionSaveTarget, taskStateOf } from '$lib/contestant/tasks';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { QuestionHeading } from '$lib/dynamic-components/questionHeading';
  import { parseParams } from '$lib/routes';
  import type { LocalizedAnswer } from '@openvaa/app-shared';
  import type { AnyQuestionVariant } from '@openvaa/data';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Stable references (functions, stores, objects with internal getters): destructure-safe.
  const contestantCtx = getContestantContext();
  const { getRoute, t, userData } = contestantCtx;
  // appSettings/dataRoot are reactive accessors — read via contestantCtx.X, never destructure.
  const appSettings = $derived(contestantCtx.appSettings);
  // dataRoot is identity-stable (#version-bridge): read `contestantCtx.dataRoot.<prop>` directly in the tracking scope, never via an intermediate `$derived` alias (stale on cold entry). See CLAUDE.md "Context Destructuring Rule" and the stable-reference alias anti-pattern.
  // Reactive accessors ($state / $derived backed): read via contestantCtx.X. Aliased through $derived for template readability — see CLAUDE.md "Context Destructuring Rule".
  const answersLocked = $derived(contestantCtx.answersLocked);
  const questionBlocks = $derived(contestantCtx.questionBlocks);
  const { pageStyles, video } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // State variables
  ////////////////////////////////////////////////////////////////////

  let bypassPreventNavigation = $state(false);
  let errorMessage = $state<string | undefined>(undefined);
  let status = $state<ActionStatus>('loading');
  // Validity surfaced by `OpinionQuestionInput`. The `{#key question.id}` remount around the input resets it per question; only the multi-choice branch ever sets it false (selection outside min/max). ANDed into `canSubmit` so Save is gated while a multi-choice selection is out of range.
  let answerValid = $state(true);

  ////////////////////////////////////////////////////////////////////
  // Get the current question
  ////////////////////////////////////////////////////////////////////

  let questionData = $derived.by(() => {
    const questionId = parseParams(page).questionId;
    if (!questionId) error(500, 'No questionId provided.');
    try {
      const q = contestantCtx.dataRoot.getQuestion(questionId);
      const cd = getCustomData(q);
      return { question: q, customData: cd };
    } catch {
      error(404, `Question with id ${questionId} not found.`);
    }
  });

  let question = $derived(questionData!.question);
  let customData = $derived(questionData!.customData);

  $effect(() => {
    const cd = questionData!.customData;
    status = 'idle';
    if (!appSettings.contestantApp.questions.hideVideo && cd?.video) {
      video.load(cd.video);
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Where the save leads
  ////////////////////////////////////////////////////////////////////

  /** Whether this question has no saved answer. A save changes that, so `handleSubmit` copies it into `wasUnanswered` before it saves. */
  const unanswered = $derived(contestantCtx.unansweredOpinionQuestions.some((q) => q.id === question.id));

  /**
   * Where a save would lead, for the label: asked of the entity's task state as it will be once this question's draft is saved — this question answered, and the first unanswered question the first other than this one. Nothing is decided from a draft while the saved state is not known.
   */
  const prospectiveTarget = $derived.by(() => {
    const saved = contestantCtx.taskState;
    const facts = { wasUnanswered: unanswered };
    if (!saved.known) return questionSaveTarget(saved, facts);
    const stillUnanswered = contestantCtx.unansweredOpinionQuestions.filter((q) => q.id !== question.id);
    const unansweredRequiredInfoCount = contestantCtx.unansweredRequiredInfoQuestions.length;
    // The profile is not edited on this page, so it stays as the saved state has it: one that is incomplete although every required info question is answered lacks a required name.
    const profileIncomplete = saved.tasks.some((task) => task.id === 'profile' && task.status === 'incomplete');
    return questionSaveTarget(
      taskStateOf({
        // A known state is one whose entity is known and, where the entity has a nomination, whose question lists are loaded.
        entityKnown: true,
        hasNomination: hasNomination(contestantCtx.nominations),
        questionsReady: true,
        unansweredRequiredInfoCount,
        requiredNameMissing: profileIncomplete && unansweredRequiredInfoCount === 0,
        opinionCount: contestantCtx.opinionQuestions.length,
        unansweredOpinionCount: stillUnanswered.length,
        firstUnansweredOpinionId: stillUnanswered[0]?.id
      }),
      facts
    );
  });

  ////////////////////////////////////////////////////////////////////
  // Check if the form is dirty or empty and define button labels
  ////////////////////////////////////////////////////////////////////

  let canSubmit = $derived(
    status !== 'loading' && !isEmptyValue(userData.current?.entity.answers?.[question.id]?.value) && answerValid
  );

  let submitLabel = $derived.by(() => {
    if (prospectiveTarget.continues) return t('common.saveAndContinue');
    return userData.hasUnsaved ? t('common.saveAndReturn') : t('common.return');
  });

  // The label is return when loading, bc saving isn't cancellable anymore
  let cancelLabel = $derived(status === 'loading' || !userData.hasUnsaved ? t('common.return') : t('common.cancel'));

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
      log.debug('handleValueChange: questionId mismatch');
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
    if (answersLocked) {
      status = 'error';
      errorMessage = t('contestantApp.common.editingNotAllowed');
      log.debug('[Contestant app question page]: setAnswer called when answersLocked');
      return;
    }
    if (value == null && info == null) {
      status = 'error';
      // Internal empty-payload guard (programmer error) — not a lock condition, so use the generic save-failure message rather than "editing not allowed".
      errorMessage = t('contestantApp.error.saveFailed');
      log.debug('[Contestant app question page]: setAnswer called with no value nor info');
      return;
    }
    const answer: Partial<LocalizedAnswer> = userData.current?.entity.answers?.[question.id] ?? {};
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
      errorMessage = t('contestantApp.error.saveFailed');
      log.debug('[Contestant app question page]: handleSubmit called when canSubmit is false');
      return;
    }
    status = 'loading';
    // Read before the save: the save takes this question out of the unanswered ones, so the state read after it cannot tell.
    const wasUnanswered = unanswered;
    const result = await userData.save().catch((e) => {
      log.error(`Error saving userData: ${e?.message}`);
      return undefined;
    });
    if (result?.type !== 'success') {
      status = 'error';
      errorMessage = t('contestantApp.error.saveFailed');
      return;
    }
    status = 'success';
    // The target is asked only now, of the state the save left.
    goto(getRoute.current(questionSaveTarget(contestantCtx.taskState, { wasUnanswered }).route));
  }

  /**
   * Handle cancel button click.
   */
  function handleCancel(): void {
    bypassPreventNavigation = true;
    userData.resetUnsaved();
    goto(getRoute.current('ContestantAppQuestions')).then(() => (bypassPreventNavigation = false));
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

  pageStyles.use({ drawer: { background: 'bg-base-200' } });
</script>

{#if question}
  {@const { info, text } = question}
  {@const customData = getCustomData(question)}
  {@const answer = userData.current?.entity.answers?.[question.id]}

  <!-- {#key}: keep — remount drops in-progress draft state from the prior question (form input refs, OpinionQuestionInput internal $state) when the URL navigates question N → N+1. Without it, draft state from the prior question would leak into the next form on navigation. -->
  {#key question.id}
    <PreventNavigation
      active={() => !bypassPreventNavigation && userData.hasUnsaved && !answersLocked}
      onConfirm={handleNavigationConfirm} />

    <MainContent title={text}>
      {#snippet note()}
        {#if answersLocked}
          <NotEditableNote reason="answersLocked" data-testid="contestant-answers-locked-warning" />
        {/if}
      {/snippet}

      {#snippet hero()}
        <figure role="presentation" data-testid="contestant-questions-hero" style="view-transition-name: question-hero">
          {#if !appSettings.contestantApp.questions.hideHero && customData?.hero}
            <Hero content={customData.hero} />
          {/if}
        </figure>
      {/snippet}

      {#snippet heading()}
        <QuestionHeading
          {question}
          {questionBlocks}
          onShadedBg
          data-focus-on-nav
          tabindex={-1}
          style="view-transition-name: question-heading" />
      {/snippet}

      {#if !(appSettings.contestantApp.questions.hideVideo && customData.video) && info && info !== ''}
        <QuestionBasicInfo {info} />
      {/if}

      {#snippet primaryActions()}
        <div class="gap-lg grid w-full justify-items-center">
          <!-- Question answer proper -->

          <OpinionQuestionInput
            {question}
            {answer}
            mode={answersLocked ? 'display' : 'answer'}
            onShadedBg
            bind:valid={answerValid}
            onChange={handleValueChange}
            data-testid="contestant-questions-answer" />

          <!-- Open answer -->

          {#if customData.allowOpen}
            <!-- Honor the per-question `disableMultilingual` opt-out on the
                 open-answer comment, mirroring QuestionInput.svelte:73 (which gates info-question inputs). Without this the comment always rendered the multilingual translations toggle, ignoring the
                 opt-out that info questions respect. -->
            <Input
              type={customData.disableMultilingual ? 'textarea' : 'textarea-multilingual'}
              label={t('contestantApp.questions.openAnswerPrompt')}
              value={answer?.info}
              disabled={!canSubmit}
              locked={answersLocked}
              placeholder={canSubmit ? '' : t('contestantApp.questions.answerQuestionFirst')}
              onShadedBg
              onChange={handleInfoChange}
              data-testid="contestant-questions-comment" />
          {/if}

          <!-- Error message -->

          {#if status === 'error'}
            <ErrorMessage inline message={errorMessage} class="mb-lg mt-md" />
          {/if}

          <!-- Submit or cancel -->

          <div class="grid w-full justify-items-center">
            {#if !answersLocked}
              <Button
                text={submitLabel}
                onclick={handleSubmit}
                disabled={!canSubmit}
                loading={status === 'loading'}
                loadingText={t('common.saving')}
                type="submit"
                id="submitButton"
                variant="main"
                icon="next"
                data-testid="contestant-questions-save" />
              <Button
                text={cancelLabel}
                onclick={handleCancel}
                color="warning"
                data-testid="contestant-questions-cancel" />
            {:else}
              <Button
                text={t('common.return')}
                href={getRoute.current('ContestantAppQuestions')}
                variant="main"
                data-testid="contestant-questions-return" />
            {/if}
          </div>
        </div>
      {/snippet}
    </MainContent>
  {/key}
{:else}
  <Loading class="mt-lg" />
{/if}
