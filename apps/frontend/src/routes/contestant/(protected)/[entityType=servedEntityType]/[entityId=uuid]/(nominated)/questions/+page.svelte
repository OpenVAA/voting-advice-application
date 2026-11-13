<!--@component

# Contestant app questions intro page

Shows the opinion questions the entity the user edits is asked, for answering.

### Settings

- `entities.hideIfMissingAnswers`: Affects message shown. The key read is that of the selected entity's type.
-->

<script lang="ts">
  import { isLocalizedString } from '@openvaa/app-shared';
  import { isEmptyValue } from '@openvaa/data';
  import { NotEditableNote } from '$contestant/components/notEditableNote';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import ElectionTag from '$lib/components/electionTag/ElectionTag.svelte';
  import { Expander } from '$lib/components/expander';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { Icon } from '$lib/components/icon';
  import { OpinionQuestionInput, QuestionOpenAnswer } from '$lib/components/questions';
  import { SuccessMessage } from '$lib/components/successMessage';
  import { questionsResumeRoute } from '$lib/contestant/tasks';
  import { isHiddenIfMissingAnswers } from '$lib/contestant/utils/hideIfMissingAnswers';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getElectionsToShow } from '$lib/utils/questions';
  import type { Answer, AnyQuestionVariant } from '@openvaa/data';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Read the reactive context getters via contestantCtx.X.
  const contestantCtx = getContestantContext();
  const { getRoute, t, translate, userData } = contestantCtx;
  // appSettings is a reactive accessor — read via contestantCtx.X, never destructure.
  const appSettings = $derived(contestantCtx.appSettings);
  /** Whether the entity being edited is hidden from voters while it has unanswered opinion questions. */
  const hiddenIfMissingAnswers = $derived(
    isHiddenIfMissingAnswers({ entityType: contestantCtx.selectedEntity?.type, appSettings })
  );

  ////////////////////////////////////////////////////////////////////
  // Choose page variant to show
  ////////////////////////////////////////////////////////////////////

  let completion = $derived<'empty' | 'partial' | 'full'>(
    contestantCtx.unansweredOpinionQuestions.length === 0
      ? 'full'
      : contestantCtx.unansweredOpinionQuestions.length === contestantCtx.opinionQuestions.length
        ? 'empty'
        : 'partial'
  );

  /** The first unanswered opinion question, where the start and continue buttons lead. Nothing while no question is unanswered or the entity's task state is not known. */
  const resumeRoute = $derived(questionsResumeRoute(contestantCtx.taskState));

  ////////////////////////////////////////////////////////////////////
  // Handle answers
  ////////////////////////////////////////////////////////////////////

  /**
   * A utility for getting the saved answer for a given question, translating it if necessary, because the saved answers are `LocalizedAnswer`s.
   * NB. This makes answers non-reactive.
   */
  function getSavedAnswer(question: AnyQuestionVariant): Answer | undefined {
    const localizedAnswer = userData.savedEntityData?.answers?.[question.id];
    // Use the canonical emptiness predicate, not a truthiness test (which would discard a saved `false`) nor a bare null check, so this stays consistent with contestantContext's completion gating. `isEmptyValue(undefined)` is `true`, so the first clause already covers a missing `localizedAnswer`; the second is unreachable at runtime and exists only to narrow the type, since the predicate returns a plain `boolean`.
    if (isEmptyValue(localizedAnswer?.value) || localizedAnswer == null) return undefined;
    const { value, info } = localizedAnswer;
    const answer = {
      value: isLocalizedString(value) ? translate(value) : value,
      info: isLocalizedString(info) ? translate(info) : info
    };
    return question.ensureAnswer(answer);
  }
</script>

<MainContent title={completion === 'empty' ? t('contestantApp.questions.start') : t('contestantApp.questions.title')}>
  <!-- Tip or notification -->

  {#snippet note()}
    {#if completion === 'empty' && !contestantCtx.answersLocked}
      <Icon name="tip" />
      {t('contestantApp.questions.tip')}
    {/if}
    {#if contestantCtx.answersLocked}
      <NotEditableNote reason="answersLocked" data-testid="contestant-answers-locked-warning">
        {#if contestantCtx.unansweredRequiredInfoQuestions?.length !== 0 || (hiddenIfMissingAnswers && contestantCtx.unansweredOpinionQuestions?.length !== 0)}
          {t('contestantApp.common.isHiddenBecauseMissing')}
        {/if}
      </NotEditableNote>
    {:else if contestantCtx.profileComplete}
      <SuccessMessage inline message={t('contestantApp.common.fullyCompleted')} />
    {/if}
  {/snippet}

  {#if completion === 'empty' && !contestantCtx.answersLocked}
    <!-- Page content when no answers have yet been given -->

    <div class="mb-lg gap-md grid justify-items-center" data-testid="contestant-questions-intro">
      <p class="text-center">
        {t('contestantApp.questions.ingress.empty', { numQuestions: contestantCtx.opinionQuestions.length })}
      </p>
      {#if resumeRoute}
        <Button
          href={getRoute.current(resumeRoute)}
          variant="main"
          icon="next"
          text={t('common.continue')}
          data-testid="contestant-questions-start" />
      {/if}
    </div>
  {:else}
    <!-- Page content when some or all answers have been given -->

    <div class="mb-lg gap-md grid justify-items-center" data-testid="contestant-questions-intro">
      <p class="text-center">
        {completion === 'partial'
          ? t('contestantApp.questions.ingress.partial')
          : t('contestantApp.questions.ingress.default')}
      </p>
      {#if completion !== 'full' && !contestantCtx.answersLocked}
        <div class="text-warning text-center" data-testid="contestant-questions-progress">
          {t('contestantApp.questions.unansweredWarning', {
            numUnansweredQuestions: contestantCtx.unansweredOpinionQuestions?.length
          })}
          {#if hiddenIfMissingAnswers}
            {t('contestantApp.common.willBeHiddenIfMissing')}
          {/if}
        </div>
        <!-- Shortcut to the first unanswered question -->
        {#if resumeRoute}
          <Button
            href={getRoute.current(resumeRoute)}
            text={t('contestantApp.questions.enterMissingAnswers')}
            variant="main"
            icon="next"
            data-testid="contestant-questions-continue" />
        {/if}
      {/if}
    </div>

    <div class="edgetoedge-x mt-lg gap-xs grid !px-0" data-testid="contestant-questions-list">
      {#each contestantCtx.questionBlocks.blocks.filter((b) => b.length) as questions}
        {@const category = questions[0].category}
        <Expander
          title={category.name}
          variant="category"
          defaultExpanded={contestantCtx.unansweredOpinionQuestions.some((q) => q.category.id === category.id)}
          class="match-w-xl:rounded-md"
          data-testid="contestant-questions-category-expander">
          <div class="gap-xxl p-lg grid">
            {#each questions as question}
              {@const { id, text } = question}
              {@const elections = getElectionsToShow({ question, elections: contestantCtx.selectedElections })}
              {@const answer = getSavedAnswer(question)}

              <div
                class="gap-lg before:border-md relative grid before:absolute before:top-[-1.8rem] before:right-0 before:left-0 before:content-[''] first:before:content-none"
                data-testid="contestant-questions-card">
                <HeadingGroup class="text-center">
                  {#if appSettings.elections.showElectionTags && elections.length}
                    <PreHeading>
                      {#each elections as election}
                        <ElectionTag {election} />
                      {/each}
                    </PreHeading>
                  {/if}
                  <h3>{text}</h3>
                </HeadingGroup>

                <!-- Only show the answering choices if the question has been answered -->
                {#if answer != null}
                  <OpinionQuestionInput {question} mode="display" {answer} />
                  {#if answer?.info}
                    <QuestionOpenAnswer content={answer.info} />
                  {/if}
                {/if}

                <Button
                  text={contestantCtx.answersLocked
                    ? t('contestantApp.questions.viewAnswer')
                    : answer == null
                      ? t('contestantApp.questions.answerQuestion')
                      : t('contestantApp.questions.editAnswer')}
                  href={getRoute.current({ route: 'ContestantAppQuestion', questionId: id })}
                  icon={contestantCtx.answersLocked ? 'show' : 'create'}
                  variant={answer == null ? 'main' : undefined}
                  iconPos="left"
                  class="!w-auto place-self-center"
                  data-testid="contestant-questions-card-action" />
              </div>
            {/each}
          </div>
        </Expander>
      {/each}
    </div>

    <div class="flex w-full justify-center py-40">
      <Button
        text={t('common.home')}
        variant={completion === 'full' ? 'main' : 'prominent'}
        icon="previous"
        iconPos="left"
        href={getRoute.current('ContestantAppEntityHome')}
        data-testid="contestant-questions-home" />
    </div>
  {/if}
</MainContent>
