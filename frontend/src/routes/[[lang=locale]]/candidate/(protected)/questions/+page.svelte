<script lang="ts">
  import {Button} from '$lib/components/button';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Expander} from '$lib/components/expander';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {getContext} from 'svelte';
  import {Warning} from '$lib/components/warning';
  import {
    QuestionsStartPage,
    AnsweredQuestion,
    UnAnsweredQuestion
  } from '$lib/candidate/components/questionsPage';
  import type {CandidateContext} from '$lib/utils/candidateContext';

  const {
    opinionQuestions,
    opinionAnswers,
    progress,
    questionsLocked,
    unansweredRequiredInfoQuestions,
    unansweredOpinionQuestions
  } = getContext<CandidateContext>('candidate');

  let questionsByCategory: Record<string, Array<QuestionProps>>;

  let loading = true;
  let unansweredCategories = Array<string>();

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
            (category) =>
              !questionsByCategory?.[category].every((question) => $opinionAnswers?.[question.id])
          );
        }
      }
    }
  }

  $: nextUnansweredQuestion = $opinionQuestions?.find(
    (question) => !$opinionAnswers?.[question.id]
  );
</script>

{#if $opinionAnswers && !$questionsLocked && Object.keys($opinionAnswers).length === 0}
  <QuestionsStartPage />
{:else}
  <BasicPage
    title={$t('candidateApp.questions.title')}
    progress={$progress?.progress}
    progressMax={$progress?.max}>
    <Warning display={!!$questionsLocked} slot="note">
      <p>{$t('candidateApp.common.editingNotAllowed')}</p>
      {#if $unansweredOpinionQuestions?.length !== 0 || $unansweredRequiredInfoQuestions?.length !== 0}
        <p>{$t('candidateApp.common.editingNotAllowedPartiallyFilled')}</p>
      {/if}
    </Warning>

    <p class="pb-20 text-center">
      {$t('candidateApp.questions.ingress')}
    </p>
    {#if $unansweredOpinionQuestions?.length !== 0 && !loading && !$questionsLocked}
      <div class="pb-6 text-center text-warning">
        {$t('candidateApp.questions.unansweredWarning', {
          numUnansweredQuestions: $unansweredOpinionQuestions?.length
        })}
      </div>
      <div class="flex w-full justify-center pb-40 pt-20">
        <Button
          href={$getRoute({route: Route.CandAppQuestions, id: nextUnansweredQuestion?.id})}
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
          {#each categoryQuestions as question}
            {#if $opinionAnswers?.[question.id]}
              <AnsweredQuestion {question} {categoryQuestions} />
            {:else}
              <UnAnsweredQuestion {question} {categoryQuestions} />
            {/if}
          {/each}
        </Expander>
      </div>
    {/each}

    <div class="flex w-full justify-center py-40">
      <Button
        text={$t('common.return')}
        variant="main"
        href={$getRoute({route: Route.CandAppHome})} />
    </div>
  </BasicPage>
{/if}

<style>
  /* Hotfix for making the expander span the whole width of the page */
  .edgetoedge-x {
    padding-left: 0;
    padding-right: 0;
  }
</style>
