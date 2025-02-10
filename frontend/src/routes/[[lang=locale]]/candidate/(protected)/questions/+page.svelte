<!--@component

# Candidate app questions intro page

Shows the opinion questions for the candidate to answer.

### Settings

- `entities.hideIfMissingAnswers.candidate`: Affects message shown.
-->

<script lang="ts">
  import { isLocalizedString } from '@openvaa/app-shared';
  import { Button } from '$lib/components/button';
  import ElectionTag from '$lib/components/electionTag/ElectionTag.svelte';
  import { Expander } from '$lib/components/expander';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { Icon } from '$lib/components/icon';
  import { OpinionQuestionInput, QuestionOpenAnswer } from '$lib/components/questions';
  import { SuccessMessage } from '$lib/components/successMessage';
  import { Warning } from '$lib/components/warning';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getElectionsToShow } from '$lib/utils/questions';
  import MainContent from '../../../MainContent.svelte';
  import type { Answer, AnyQuestionVariant } from '@openvaa/data';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const {
    answersLocked,
    appSettings,
    getRoute,
    opinionQuestions,
    profileComplete,
    questionBlocks,
    unansweredRequiredInfoQuestions,
    unansweredOpinionQuestions,
    t,
    translate,
    userData
  } = getCandidateContext();
  const { savedCandidateData } = userData;

  ////////////////////////////////////////////////////////////////////
  // Choose page variant to show
  ////////////////////////////////////////////////////////////////////

  let completion: 'empty' | 'partial' | 'full';
  $: completion =
    $unansweredOpinionQuestions.length === 0
      ? 'full'
      : $unansweredOpinionQuestions.length === $opinionQuestions.length
        ? 'empty'
        : 'partial';

  ////////////////////////////////////////////////////////////////////
  // Handle answers
  ////////////////////////////////////////////////////////////////////

  /**
   * A utility for getting the saved answer for a given question, translating it if necessary, because the saved answers are `LocalizedAnswer`s.
   * NB. This makes answers non-reactive.
   */
  function getSavedAnswer(question: AnyQuestionVariant): Answer | undefined {
    const localizedAnswer = $savedCandidateData?.answers?.[question.id];
    if (!localizedAnswer?.value) return undefined;
    const { value, info } = localizedAnswer;
    const answer = {
      value: isLocalizedString(value) ? translate(value) : value,
      info: isLocalizedString(info) ? translate(info) : info
    };
    return question.ensureAnswer(answer);
  }
</script>

<MainContent title={completion === 'empty' ? $t('candidateApp.questions.start') : $t('candidateApp.questions.title')}>
  <!-- Tip or notification -->

  <svelte:fragment slot="note">
    {#if completion === 'empty' && !$answersLocked}
      <Icon name="tip" />
      {$t('candidateApp.questions.tip')}
    {/if}
    {#if $answersLocked}
      <Warning>
        {$t('candidateApp.common.editingNotAllowed')}
        {#if $unansweredRequiredInfoQuestions?.length !== 0 || ($appSettings.entities?.hideIfMissingAnswers?.candidate && $unansweredOpinionQuestions?.length !== 0)}
          {$t('candidateApp.common.isHiddenBecauseMissing')}
        {/if}
      </Warning>
    {:else if $profileComplete}
      <SuccessMessage inline message={$t('candidateApp.common.fullyCompleted')} />
    {/if}
  </svelte:fragment>

  {#if completion === 'empty' && !$answersLocked}
    <!-- Page content when no answers have yet been given -->

    <div class="mb-lg grid justify-items-center gap-md">
      <p class="text-center">
        {$t('candidateApp.questions.ingress.empty', { numQuestions: $opinionQuestions.length })}
      </p>
      <Button
        slot="primaryActions"
        href={$getRoute({ route: 'CandAppQuestion', questionId: $unansweredOpinionQuestions[0]?.id })}
        variant="main"
        icon="next"
        text={$t('common.continue')} />
    </div>
  {:else}
    <!-- Page content when some or all answers have been given -->

    <div class="mb-lg grid justify-items-center gap-md">
      <p class="text-center">
        {completion === 'partial'
          ? $t('candidateApp.questions.ingress.partial')
          : $t('candidateApp.questions.ingress.default')}
      </p>
      {#if completion !== 'full' && !$answersLocked}
        <div class="text-center text-warning">
          {$t('candidateApp.questions.unansweredWarning', {
            numUnansweredQuestions: $unansweredOpinionQuestions?.length
          })}
          {#if $appSettings.entities?.hideIfMissingAnswers?.candidate}
            {$t('candidateApp.common.willBeHiddenIfMissing')}
          {/if}
        </div>
        <!-- Shortcut to the next unanswered question -->
        <Button
          href={$getRoute({ route: 'CandAppQuestion', questionId: $unansweredOpinionQuestions[0]?.id })}
          text={$t('candidateApp.questions.enterMissingAnswers')}
          variant="main"
          icon="next" />
      {/if}
    </div>

    <div class="edgetoedge-x mt-lg grid gap-xs !px-0">
      {#each $questionBlocks.blocks.filter((b) => b.length) as questions}
        {@const category = questions[0].category}
        <Expander
          title={category.name}
          variant="category"
          defaultExpanded={$unansweredOpinionQuestions.some((q) => q.category.id === category.id)}
          class="match-w-xl:rounded-md">
          <div class="grid gap-xxl p-lg">
            {#each questions as question}
              {@const { id, text } = question}
              {@const elections = getElectionsToShow(question)}
              {@const answer = getSavedAnswer(question)}

              <div class="grid-line-x grid gap-lg">
                <HeadingGroup class="text-center">
                  {#if elections.length}
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
                  text={$answersLocked
                    ? $t('candidateApp.questions.viewAnswer')
                    : answer == null
                      ? $t('candidateApp.questions.answerQuestion')
                      : $t('candidateApp.questions.editAnswer')}
                  href={$getRoute({ route: 'CandAppQuestion', questionId: id })}
                  icon={$answersLocked ? 'show' : 'create'}
                  variant={answer == null ? 'main' : undefined}
                  iconPos="left"
                  class="!w-auto place-self-center" />
              </div>
            {/each}
          </div>
        </Expander>
      {/each}
    </div>

    <div class="flex w-full justify-center py-40">
      <Button
        text={$t('common.home')}
        variant={completion === 'full' ? 'main' : 'prominent'}
        icon="previous"
        iconPos="left"
        href={$getRoute('CandAppHome')} />
    </div>
  {/if}
</MainContent>

<style lang="postcss">
  /**
   * Add a line between grid rows. Apply to grid cells.
   * NB: before: is a valid Tailwind prefix.
   */
  .grid-line-x {
    @apply relative before:absolute before:left-0 before:right-0 before:top-[-1.8rem] before:border-md before:content-[''] first:before:content-none;
  }
</style>
