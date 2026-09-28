<!--@component

# Questions layout

- Display an error if we can't load the questions.
- Set top bar actions and initiate progess.
- Owns question rendering for the `[questionId]` leaf: a
  unified-layout-with-empty-leaf shape mirroring `results/[[electionTab]]/+layout.svelte`. The leaf `[questionId]/+page.svelte` is an empty stub. The intro (`questions/+page.svelte`) and category (`category/[categoryId]/+page.svelte`) siblings render via `{@render children()}`.

## Params (on the `[questionId]` route)

- `questionId`: The `Id` of the question to display. If the value is the one defined by the const `FIRST_QUESTION_ID`, the first question in the `selectedQuestionBlocks` store will be displayed.
- `start`: Optional. Set to a truish value to start answering questions from this question (and category). This will set the session persistent store `firstQuestionId` to the `Id` of the current question, which in turn will reorder the `selectedQuestionBlocks` store. The `firstQuestionId` store will be reset if the `/questions` intro page is visited or the use session is cleared.

## Settings

- `questions.interactiveInfo.enabled`: Whether to display interactive information popup or just a basic info expander.
-->

<script lang="ts">
  import { getCustomData, log } from '@openvaa/app-shared';
  import { isBooleanQuestion, isSingleChoiceQuestion } from '@openvaa/data';
  import { error } from '@sveltejs/kit';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { Hero } from '$lib/components/hero';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Loading } from '$lib/components/loading';
  import {
    OpinionQuestionInput,
    QuestionActions,
    QuestionBasicInfo,
    QuestionExtendedInfoButton
  } from '$lib/components/questions';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getVoterContext } from '$lib/contexts/voter';
  import { QuestionHeading } from '$lib/dynamic-components/questionHeading';
  import { FIRST_QUESTION_ID, parseParams } from '$lib/routes';
  import { DELAY } from '$lib/utils/timing';
  import type { AnyQuestionVariant } from '@openvaa/data';
  import type { Snippet } from 'svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // opinionQuestions + selectedQuestionBlocks are reactive context getters; access via voterCtx.X (live $state).
  const voterCtx = getVoterContext();
  const { answers, getRoute, startEvent, t } = voterCtx;
  // appSettings/dataRoot are reactive accessors — read via voterCtx.X, never destructure.
  const appSettings = $derived(voterCtx.appSettings);
  // dataRoot is identity-stable (#version-bridge): read `voterCtx.dataRoot.<prop>` directly in the tracking scope, never via an intermediate `$derived` alias (stale on cold entry). See CLAUDE.md "Context Destructuring Rule" and the stable-reference alias anti-pattern.
  const { topBarSettings, progress, video } = getLayoutContext();

  let { children }: { children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Edit layout and set progress max
  ////////////////////////////////////////////////////////////////////

  topBarSettings.use({
    progress: 'show',
    actions: {
      // One-time init read — read off voterCtx directly to avoid a reactive-rune init-capture warning.
      results: voterCtx.appSettings.questions.showResultsLink ? 'show' : 'hide'
    }
  });

  $effect(() => {
    progress.max = voterCtx.selectedQuestionBlocks.questions.length + 1;
  });

  ////////////////////////////////////////////////////////////////////
  // Get the current question and update related variables
  ////////////////////////////////////////////////////////////////////

  // Derive question and questionBlock synchronously so they are always up to date when event handlers read them (e.g., handleJump).
  // Using $derived instead of $state + $effect avoids a timing gap where the URL has changed but the state hasn't updated yet.
  //
  // Sibling-route guard: on the intro (`questions/+page.svelte`) and category (`category/[categoryId]/+page.svelte`) routes `page.params.questionId` is `undefined`. EARLY-RETURN `undefined` there so the question UI does not render and no error path fires — the render branch gates on `question && questionBlock` truthiness and falls back to `{@render children?.()}`. The unknown-id `error(404)` is preserved for a real `[questionId]` route with a bad id.
  let question = $derived.by<AnyQuestionVariant | undefined>(() => {
    const questionId = parseParams(page).questionId;
    if (!questionId) return undefined;
    try {
      return questionId === FIRST_QUESTION_ID
        ? voterCtx.selectedQuestionBlocks.blocks[0]?.[0]
        : voterCtx.dataRoot.getQuestion(questionId);
    } catch {
      error(404, `Question with id ${questionId} not found.`);
    }
  });

  let questionBlock = $derived(question ? voterCtx.selectedQuestionBlocks.getByQuestion(question) : undefined);

  // Handle side effects (progress, video, redirect) in a separate effect
  $effect(() => {
    if (!questionBlock) {
      if (question) {
        const questionId = parseParams(page).questionId;
        log.debug(
          `Question with id ${questionId} not found in voterCtx.selectedQuestionBlocks. Rerouting to category selection.`
        );
        goto(getRoute.current('Questions'));
      }
    } else {
      progress.current.set(questionBlock.index + 1);
      // Possibly show video
      if (question) {
        const customData = getCustomData(question);
        if (customData?.video) video.load(customData.video);
      }
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Handle `start` query param
  ////////////////////////////////////////////////////////////////////

  // `onMount`, deliberately. The `start` param is only present on the entry URL of a "start answering from here" deep-link, so the handler must run once per session — exactly what `onMount` on this persistent layout provides. An `afterNavigate` or `$effect` would re-fire on every hop within the questions flow.
  onMount(() => {
    if (!question) return;
    if (page.url.searchParams.get('start')) {
      // Clear any possible selected categories, although there should under normal circumstances be none
      voterCtx.selectedQuestionCategoryIds = [];
      voterCtx.firstQuestionId = question.id;
      startEvent('question_startFrom', { questionId: question.id });
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Anwering and moving between questions
  ////////////////////////////////////////////////////////////////////

  // Kept in the layout script, OUTSIDE any {#key} — survives the variant remount and accumulated answers (voterCtx.answers) survive Q→Q.
  /** Use to disable the response buttons when an answer is set but we're still waiting for the next page to load */
  let disabled = $state(false);

  // Validity surfaced by `OpinionQuestionInput`. Lives OUTSIDE the {#key} so it survives same-type Q→Q reuse (the input is not remounted between two multi-choice questions). Reset to `true` on question-id change so a stale invalid state from the previous question does not linger before the input recomputes; only the multi-choice branch ever sets it false.
  let opinionInputValid = $state(true);
  $effect(() => {
    void question?.id;
    opinionInputValid = true;
  });

  // Bumped on every explicit answer deletion (question-delete button). Combined with `question.type` in the input's {#key} so an explicit delete remounts QuestionChoices, forcing its question-keyed seed to re-read the now-absent answer and visually clear the boxes. Lives OUTSIDE the {#key}.
  let deleteEpoch = $state(0);

  function handleAnswer({ question, value }: { question: AnyQuestionVariant; value?: unknown }): void {
    // Zero selections in a multi-choice question = unanswered: delete the answer rather than persisting an empty array, keeping matching clean and the results-CTA answer count honest.
    if (Array.isArray(value) && value.length === 0) {
      answers.deleteAnswer(question.id);
      return;
    }
    // Out-of-range (non-empty) multi-choice selection = in-progress/unanswered NEVER persist it — an invalid selection must not reach matching.
    // `opinionInputValid` is fresh here because OpinionQuestionInput assigns the bound valid synchronously before bubbling onChange.
    // Delete any previously-persisted answer, but only when one actually exists, so a fresh invalid toggle does not fire a spurious answer_delete tracking event / store churn.
    if (Array.isArray(value) && !opinionInputValid) {
      if (answers.answers[question.id] != null) answers.deleteAnswer(question.id);
      return;
    }
    answers.setAnswer(question.id, value);
    // Auto-advance is instant only for single-choice / boolean inputs. Number
    // (slider) and multipleChoiceCategorical (checkbox) inputs must NOT auto-jump: a per-keystep or per-toggle jump breaks the keyboard exact-value contract and multi-select entirely — the voter proceeds via Next/Skip.
    if (isSingleChoiceQuestion(question) || isBooleanQuestion(question)) {
      disabled = true;
      setTimeout(handleJump, DELAY.md);
    }
  }

  function handleDelete() {
    if (!question) return;
    answers.deleteAnswer(question.id);
    // Bump the remount epoch so QuestionChoices re-seeds from the now-absent answer and the rendered selection visually clears.
    deleteEpoch += 1;
  }

  /**
   * Jump to another question.
   * @param steps - The number of steps to jump. Defaults to `1`, i.e., jump to next.
   */
  function handleJump(steps = 1): void {
    if (!questionBlock) return;
    // Build the new URL based on appSettings and the new index
    const newIndex = questionBlock.index + steps;
    let url: string;
    let noScroll = false;
    // Go back to the questions are main intro if moving back from the first question
    if (newIndex < 0) {
      url = getRoute.current(appSettings.questions.questionsIntro.show ? 'Questions' : 'Intro');
      // Go to results if moving forward from the last question
    } else if (newIndex >= voterCtx.selectedQuestionBlocks.questions.length) {
      url = getRoute.current('Results');
      // Show category intro if moving forward from the first question in a category
    } else {
      const newQuestion = voterCtx.selectedQuestionBlocks.questions[newIndex];
      // Show the next category intro if the next question is the first question in a new category and we're not moving backwards TODO: Handle category showing more centrally, e.g. during onMount of this page, so that sources linking here need to concern themselves with choosing whether to show the category intro. In that case, though, another search param will be necessary that can be used to suppress category intro display.
      if (
        appSettings.questions.categoryIntros?.show &&
        steps > 0 &&
        voterCtx.selectedQuestionBlocks.getByQuestion(newQuestion)?.indexInBlock === 0
      ) {
        url = getRoute.current({ route: 'QuestionCategory', categoryId: newQuestion.category.id });
        // Othwerwise, just go to the new question
      } else {
        url = getRoute.current({ route: 'Question', questionId: newQuestion.id });
        // Disable scrolling when moving between questions for a smoother experience
        noScroll = true;
      }
    }
    goto(url, { noScroll });
    disabled = false;
  }
</script>

{#if voterCtx.opinionQuestions.length > 0}
  {#if question && questionBlock}
    {@const { info, text } = question}
    {@const customData = getCustomData(question)}
    {@const questions = voterCtx.selectedQuestionBlocks.questions}

    <MainContent title={text}>
      {#snippet hero()}
        <figure role="presentation" data-testid="voter-questions-hero" style="view-transition-name: question-hero">
          {#if customData?.hero}
            <Hero content={customData?.hero} />
          {/if}
        </figure>
      {/snippet}

      {#snippet heading()}
        <QuestionHeading
          question={question!}
          questionBlocks={voterCtx.selectedQuestionBlocks}
          data-focus-on-nav
          tabindex={-1}
          style="view-transition-name: question-heading"
          data-testid="voter-questions-heading" />
      {/snippet}

      {#if !customData.video}
        {#if appSettings.questions.interactiveInfo?.enabled && (info || customData.infoSections?.length)}
          <div class="flex items-center justify-center">
            <QuestionExtendedInfoButton
              {question}
              onOpen={() => startEvent('questionExtendedInfo_open')}
              onSectionCollapse={(title) => startEvent('questionExtendedInfo_collapseSection', { title })}
              onSectionExpand={(title) => startEvent('questionExtendedInfo_expandSection', { title })} />
          </div>
        {:else if info}
          <QuestionBasicInfo
            {info}
            onCollapse={() => startEvent('questionInfo_collapse')}
            onExpand={() => startEvent('questionInfo_expand')}
            data-testid="voter-questions-info-button" />
        {/if}
      {/if}

      {#snippet primaryActions()}
        <!-- {#key `${question.type}-${deleteEpoch}`}: remount the variant input at
             a question-type boundary (Likert↔open-text↔slider), NOT per question id — AND on explicit answer deletion (deleteEpoch bump) so QuestionChoices' question-keyed seed re-reads the now-absent answer and visually clears the boxes. A same-type Q→Q run keeps the input mounted (deleteEpoch only bumps on the delete
             button); layout-owned `disabled` $state + voterCtx.answers survive. -->
        {#key `${question.type}-${deleteEpoch}`}
          <OpinionQuestionInput
            question={question!}
            answer={answers.answers[question!.id]}
            bind:valid={opinionInputValid}
            onChange={handleAnswer}
            data-testid="voter-questions-input" />
        {/key}

        <QuestionActions
          answered={answers.answers[question!.id]?.value != null && opinionInputValid}
          {disabled}
          nextLabel={questionBlock!.index === questions.length - 1 &&
          answers.answers[question!.id]?.value != null &&
          opinionInputValid
            ? t('results.title.results')
            : undefined}
          previousLabel={questionBlock!.index === 0 ? t('common.back') : undefined}
          separateSkip={true}
          data-testid="voter-questions-actions"
          onPrevious={() => {
            startEvent('question_previous', { questionIndex: questionBlock?.index });
            handleJump(-1);
          }}
          onDelete={handleDelete}
          onNext={() => {
            startEvent('question_next', { questionIndex: questionBlock?.index });
            handleJump(+1);
          }}
          onSkip={() => {
            startEvent('question_skip', { questionIndex: questionBlock?.index });
            handleJump(+1);
          }} />
      {/snippet}
    </MainContent>
  {:else if parseParams(page).questionId}
    <!-- A real [questionId] route whose `question`/`questionBlock` is still
         resolving (or is being redirected away by the side-effect $effect).
         Match the old leaf's <Loading> fallback rather than the empty leaf stub (which would flash a blank screen). Sibling routes (intro/category —
         no `questionId`) render their own page via {@render children}. -->
    <Loading class="mt-lg" />
  {:else}
    {@render children?.()}
  {/if}
{:else}
  <MainContent title={t('error.noQuestions')}>
    {#snippet hero()}
      <figure role="presentation">
        <HeroEmoji emoji={t('dynamic.error.heroEmoji')} />
      </figure>
    {/snippet}

    {#snippet primaryActions()}
      <Button href={getRoute.current('Results')} text={t('results.title.browse')} variant="main" icon="next" />
      <Button href={getRoute.current('Home')} text={t('common.returnHome')} />
    {/snippet}
  </MainContent>
{/if}
