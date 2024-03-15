<script lang="ts">
  import {Button} from '$lib/components/button';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Expander} from '$lib/components/expander';
  import {locale, t} from '$lib/i18n';
  import {translate} from '$lib/i18n/utils';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {getContext} from 'svelte';
  import {get} from 'svelte/store';
  import {Warning} from '$lib/components/warning';
  import {
    QuestionsStartPage,
    AnsweredQuestion,
    UnAnsweredQuestion
  } from '$lib/candidate/components/questionsPage';
  import type {Question} from '$lib/types/candidateAttributes';
  import type {CandidateContext} from '$lib/utils/candidateStore';

  const {
    basicInfoFilledStore,
    opinionQuestionsFilledStore,
    nofUnansweredOpinionQuestionsStore,
    questionsStore,
    answersStore,
    progressStore,
    questionsLockedStore
  } = getContext<CandidateContext>('candidate');

  $: questionsLocked = $questionsLockedStore;

  let questions = get(questionsStore) ?? [];

  let opinionQuestionsLeft: number | undefined;
  nofUnansweredOpinionQuestionsStore?.subscribe((value) => {
    opinionQuestionsLeft = value;
  });

  let opinionQuestionsFilled: boolean | undefined;
  opinionQuestionsFilledStore?.subscribe((value) => {
    opinionQuestionsFilled = value;
  });

  let basicInfoFilled: boolean | undefined;
  basicInfoFilledStore?.subscribe((value) => {
    basicInfoFilled = value;
  });

  $: answers = $answersStore;

  let questionsByCategory: Record<string, Array<Question>>;

  let loading = true;
  let unansweredCategories: Array<string> | undefined;

  $: questionsByCategory = Object.values(questions).reduce(
    (acc, question) => {
      if (!question.category) {
        return acc;
      }
      const category = question.category.name;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(question);
      return acc;
    },
    {} as typeof questionsByCategory
  );

  $: {
    if (questions) {
      loading = true;

      if (answers) {
        loading = false;
        unansweredCategories = Object.keys(questionsByCategory).filter(
          (category) => !questionsByCategory[category].every((question) => answers?.[question.id])
        );
      }
    }
  }

  $: nextUnansweredQuestion = Object.values(questions).find((question) => !answers?.[question.id]);
</script>

{#if answers && !questionsLocked && Object.entries(answers).length === 0}
  <QuestionsStartPage />
{:else}
  <BasicPage
    title={$t('candidateApp.questions.title')}
    progress={$progressStore?.progress}
    progressMax={$progressStore?.max}>
    <Warning display={!!questionsLocked} slot="note">
      <p>{$t('candidateApp.questions.editingAllowedNote')}</p>
      {#if !opinionQuestionsFilled || !basicInfoFilled}
        <p>{$t('candidateApp.homePage.editingNotAllowedPartiallyFilled')}</p>
      {/if}
    </Warning>

    <p class="pb-20 text-center">
      {$t('candidateApp.questions.info')}
    </p>
    {#if opinionQuestionsLeft != 0 && !loading && !questionsLocked}
      <div class="pb-6 text-center text-warning">
        {$t('candidateApp.questions.warning', {numUnansweredQuestions: opinionQuestionsLeft})}
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
          defaultExpanded={unansweredCategories?.includes(category ?? '')}>
          {#each categoryQuestions as question}
            {#if answers?.[question.id]}
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
        text={$t('candidateApp.questions.return')}
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
