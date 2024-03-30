<script lang="ts">
  import {Button} from '$lib/components/button';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Expander} from '$lib/components/expander';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {getContext} from 'svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import {get} from 'svelte/store';
  import Warning from '$lib/components/warning/Warning.svelte';
  import QuestionsStartPage from '$lib/candidate/components/QuestionsPage/QuestionsStartPage.svelte';
  import AnsweredQuestion from '$lib/candidate/components/QuestionsPage/AnsweredQuestion.svelte';
  import UnAnsweredQuestion from '$lib/candidate/components/QuestionsPage/UnAnsweredQuestion.svelte';

  const {
    basicInfoFilledStore,
    opinionQuestionsFilledStore,
    nofUnansweredOpinionQuestionsStore,
    questionsStore,
    answersStore
  } = getContext<CandidateContext>('candidate');

  let dataEditable: boolean;

  let questions = get(questionsStore) ?? [];

  if (questions) {
    //TODO: use store when store is implemented
    dataEditable = Object.values(questions)[0].editable;
  }

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

  //TODO refactor to use stores and break into components

  $: answers = $answersStore;

  let questionsByCategory: Record<string, Array<QuestionProps>>;

  let loading = true;
  let unansweredCategories: Array<string> | undefined;

  $: questionsByCategory = Object.values(questions).reduce(
    (acc, question) => {
      if (!question.category) {
        return acc;
      }
      if (!acc[question.category]) {
        acc[question.category] = [];
      }
      acc[question.category].push(question);
      return acc;
    },
    {} as typeof questionsByCategory
  );

  $: {
    if (questions) {
      //TODO:  use store when store is implemented
      dataEditable = Object.values(questions)[0].editable;

      loading = true;

      if (answers) {
        loading = false;
        unansweredCategories = Object.keys(questionsByCategory).filter(
          (category) => !questionsByCategory[category].every((question) => answers?.[question.id])
        );
      }
    }
  }
</script>

{#if answers && Object.entries(answers).length === 0}
  <QuestionsStartPage />
{:else}
  <BasicPage title={$t('candidateApp.questions.title')}>
    <Warning display={!dataEditable} slot="note">
      <p>{$t('candidateApp.questions.editingAllowedNote')}</p>
      {#if !opinionQuestionsFilled || !basicInfoFilled}
        <p>{$t('candidateApp.homePage.editingNotAllowedPartiallyFilled')}</p>
      {/if}
    </Warning>

    <p class="pb-20 text-center">
      {$t('candidateApp.questions.info')}
    </p>
    {#if opinionQuestionsLeft != 0 && !loading && dataEditable}
      <div class="pb-6 text-center text-warning">
        {$t('candidateApp.questions.warning', {numUnansweredQuestions: opinionQuestionsLeft})}
      </div>
      <div class="flex w-full justify-center pb-40 pt-20">
        <Button
          href={$getRoute({route: Route.CandAppQuestions, id: '1'})}
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
