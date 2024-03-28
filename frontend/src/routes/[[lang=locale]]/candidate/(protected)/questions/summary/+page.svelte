<script lang="ts">
  import {page} from '$app/stores';
  import {Button} from '$lib/components/button';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Expander} from '$lib/components/expander';
  import LikertResponseButtons from '$lib/components/questions/LikertResponseButtons.svelte';
  import Icon from '$lib/components/icon/Icon.svelte';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {translate} from '$lib/i18n/utils/translate';
  import QuestionOpenAnswer from '$lib/components/questions/QuestionOpenAnswer.svelte';
  import {getContext} from 'svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';

  const {answersStore} = getContext<CandidateContext>('candidate');
  $: answers = $answersStore;

  let questions: QuestionProps[];
  let questionsByCategory: Record<string, Array<QuestionProps>>;

  $: questions = $page.data.questions;

  $: questionsByCategory = questions.reduce(
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

  let nofUnansweredQuestions = 0;
  let loading = true;
  let unansweredCategories: Array<string> | undefined;
  $: {
    if (answers) {
      nofUnansweredQuestions = questions.length - Object.entries(answers).length;
      loading = false;
      unansweredCategories = Object.keys(questionsByCategory).filter(
        (category) => !questionsByCategory[category].every((question) => answers?.[question.id])
      );
    }
  }
</script>

<BasicPage title={$t('candidateApp.allQuestions.title')}>
  <svelte:fragment slot="note">
    {#if nofUnansweredQuestions != 0 && !loading}
      <div class="text-warning">
        <Icon name="important" />
        {$t('candidateApp.allQuestions.warning', {numUnansweredQuestions: nofUnansweredQuestions})}
      </div>
    {/if}
  </svelte:fragment>

  <p class="text-center">
    {$t('candidateApp.allQuestions.info')}
  </p>

  {#each Object.entries(questionsByCategory) as [category, categoryQuestions]}
    <div class="edgetoedge-x">
      <Expander
        title={category || ''}
        variant="category"
        defaultExpanded={unansweredCategories?.includes(category ?? '')}>
        {#each categoryQuestions as question}
          <!-- Question has been answered -->
          {#if answers?.[question.id]}
            <div class="pb-20 pt-20">
              <div class="text-accent">
                {question.category}
              </div>

              <Expander title={question.text ?? ''} variant="question">
                {question.info}
              </Expander>

              <div class="pt-10">
                <!-- This gives empty form label error from Wave Extension for every empty dot, but fix should come from LikertResponseButton -->
                <a href={$getRoute({route: Route.CandAppQuestionEdit, id: question.id})}>
                  <LikertResponseButtons
                    name={question.id}
                    mode="display"
                    options={question.values}
                    selectedKey={answers[question.id].key} />
                </a>

                {#if answers[question.id].openAnswer}
                  <div class="pt-10">
                    <QuestionOpenAnswer
                      >{translate(answers[question.id].openAnswer)}</QuestionOpenAnswer>
                  </div>
                {/if}
              </div>
            </div>
            <!-- Question not yet answered -->
          {:else}
            <div class="pt-30 pb-20">
              <div class="text-accent">
                {question.category}
              </div>

              <Expander title={question.text ?? ''} variant="question" titleClass="text-warning">
                {question.info}
              </Expander>

              <!-- Navigate to unsanswered question -->
              <a
                class="flex justify-center pt-10"
                href={$getRoute({route: Route.CandAppQuestionEdit, id: question.id})}>
                <Button variant="main" text={$t('candidateApp.allQuestions.answerButton')} />
              </a>
            </div>
          {/if}
        {/each}
      </Expander>
    </div>
  {/each}
</BasicPage>

<style>
  /* Hotfix for making the expander span the whole width of the page */
  .edgetoedge-x {
    padding-left: 0;
    padding-right: 0;
  }
</style>
