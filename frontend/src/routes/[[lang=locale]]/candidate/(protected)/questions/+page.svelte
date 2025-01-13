<script lang="ts">
  import { getContext } from 'svelte';
  import { AnsweredQuestion, UnAnsweredQuestion } from '$lib/candidate/components/questionsPage';
  import { Button } from '$lib/components/button';
  import { Expander } from '$lib/components/expander';
  import { Icon } from '$lib/components/icon';
  import { Warning } from '$lib/components/warning';
  import { t } from '$lib/i18n';
  import { settings } from '$lib/legacy-stores';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import Layout from '../../../Layout.svelte';
  import type { CandidateContext } from '$lib/utils/legacy-candidateContext';

  const {
    opinionQuestions,
    opinionAnswers,
    answersLocked,
    unansweredRequiredInfoQuestions,
    unansweredOpinionQuestions
  } = getContext<CandidateContext>('candidate');

  let questionsByCategory: Record<string, Array<LegacyQuestionProps>>;

  let loading = true;
  let unansweredCategories = Array<string>();

  // The url of the first question where the user is navigated to after the start page.
  const firstQuestionUrl = $getRoute({
    route: ROUTE.CandAppQuestions,
    id: $unansweredOpinionQuestions?.[0]?.id
  });

  $: {
    if ($opinionQuestions) {
      questionsByCategory = $opinionQuestions.reduce(
        (acc, question) => {
          if (!question.category) {
            return acc;
          }
          const category = question.category.name;

          if (acc[category]) {
            acc[category].push(question);
          } else {
            acc[category] = [question];
          }
          return acc;
        },
        {} as NonNullable<typeof questionsByCategory>
      );
    }
  }

  $: {
    if ($opinionQuestions) {
      loading = true;

      if ($opinionAnswers) {
        loading = false;
        if (questionsByCategory) {
          unansweredCategories = Object.keys(questionsByCategory).filter(
            (category) => !questionsByCategory?.[category].every((question) => $opinionAnswers?.[question.id])
          );
        }
      }
    }
  }

  // The number of questions to be answered.
  $: numQuestions = $opinionQuestions ? Object.keys($opinionQuestions).length : 0;
  $: start = !!$opinionAnswers && !$answersLocked && Object.keys($opinionAnswers).length === 0;
  $: nextUnansweredQuestion = $opinionQuestions?.find((question) => !$opinionAnswers?.[question.id]);
</script>

<Layout title={start ? $t('candidateApp.questions.start') : $t('candidateApp.questions.title')}>
  <svelte:fragment slot="note">
    {#if start}
      <div class="mt-xl text-center text-secondary" role="note">
        <Icon name="tip" />
        {$t('candidateApp.questions.tip')}
      </div>
    {:else}
      <div class="mt-xl text-center text-secondary" role="note">
        <Warning display={!!$answersLocked}>
          <p>{$t('candidateApp.common.editingNotAllowed')}</p>
          {#if $unansweredRequiredInfoQuestions?.length !== 0 || ($settings.entities?.hideIfMissingAnswers?.candidate && $unansweredOpinionQuestions?.length !== 0)}
            <p>{$t('candidateApp.common.isHiddenBecauseMissing')}</p>
          {/if}
        </Warning>
      </div>
    {/if}
  </svelte:fragment>

  {#if start}
    <p class="text-center">
      {$t('candidateApp.questions.intro.ingress', { numQuestions })}
    </p>
    <Button slot="primaryActions" href={firstQuestionUrl} variant="main" icon="next" text={$t('common.continue')} />
  {:else}
    <p class="pb-20 text-center">
      {$t('candidateApp.questions.ingress')}
    </p>
    {#if $unansweredOpinionQuestions?.length !== 0 && !loading && !$answersLocked}
      <div class="pb-6 text-center text-warning">
        {$t('candidateApp.questions.unansweredWarning', {
          numUnansweredQuestions: $unansweredOpinionQuestions?.length
        })}
        {#if $settings.entities?.hideIfMissingAnswers?.candidate}
          {$t('candidateApp.common.willBeHiddenIfMissing')}
        {/if}
      </div>
      <div class="flex w-full justify-center pb-40 pt-20">
        <Button
          href={$getRoute({ route: ROUTE.CandAppQuestions, id: nextUnansweredQuestion?.id })}
          text={$t('candidateApp.questions.enterMissingAnswer')}
          variant="main"
          icon="next" />
      </div>
    {/if}

    {#each Object.entries(questionsByCategory) as [category, categoryQuestions]}
      <div class="edgetoedge-x">
        <Expander
          title={category || ''}
          variant="category"
          defaultExpanded={unansweredCategories.includes(category ?? '')}>
          <div class="px-lg">
            {#each categoryQuestions as question}
              {#if $opinionAnswers?.[question.id]}
                <AnsweredQuestion {question} {categoryQuestions} />
              {:else}
                <UnAnsweredQuestion {question} {categoryQuestions} />
              {/if}
            {/each}
          </div>
        </Expander>
      </div>
    {/each}

    <div class="flex w-full justify-center py-40">
      <Button text={$t('common.return')} variant="main" href={$getRoute({ route: ROUTE.CandAppHome })} />
    </div>
  {/if}
</Layout>

<style>
  /* Hotfix for making the expander span the whole width of the page */
  .edgetoedge-x {
    padding-left: 0;
    padding-right: 0;
  }
</style>
