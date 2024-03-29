<script lang="ts">
  import {page} from '$app/stores';
  import {Button} from '$lib/components/button';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Expander} from '$lib/components/expander';
  import LikertResponseButtons from '$lib/components/questions/LikertResponseButtons.svelte';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {translate} from '$lib/i18n/utils/translate';
  import QuestionOpenAnswer from '$lib/components/questions/QuestionOpenAnswer.svelte';
  import {getContext} from 'svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import Icon from '$lib/components/icon/Icon.svelte';
  import {get} from 'svelte/store';
  import Warning from '$lib/components/warning/Warning.svelte';

  const {answersStore, questionsStore} = getContext<CandidateContext>('candidate');
  $: answers = $answersStore;
  let questions = get(questionsStore) ?? [];
  let questionsByCategory: Record<string, Array<QuestionProps>>;
  let dataEditable: boolean;
  let nofUnansweredQuestions: number | undefined;
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
      dataEditable = Object.values(questions)[0].editable;

      loading = true;

      if (answers) {
        nofUnansweredQuestions = Object.entries(questions).length - Object.entries(answers).length;
        loading = false;
        unansweredCategories = Object.keys(questionsByCategory).filter(
          (category) => !questionsByCategory[category].every((question) => answers?.[question.id])
        );
      }
    }
  }

  const firstQuestionUrl = $getRoute({
    route: Route.CandAppQuestions,
    id: $page.data.questions[0].id
  });

  const numQuestions = $page.data.questions.length;
</script>

{#if answers && Object.entries(answers).length === 0}
  <BasicPage title={$t('candidateApp.opinions.title')}>
    <svelte:fragment slot="note">
      <Icon name="tip" />
      {$t('candidateApp.opinions.tip')}
    </svelte:fragment>
    <p class="text-center">
      {$t('candidateApp.opinions.instructions', {numQuestions})}
    </p>

    <Button
      slot="primaryActions"
      href={firstQuestionUrl}
      variant="main"
      icon="next"
      text={$t('candidateApp.opinions.continue')} />
  </BasicPage>
{:else}
  <BasicPage title={$t('candidateApp.allQuestions.title')}>
    <Warning display={!dataEditable} slot="note"
      >{$t('candidateApp.allQuestions.editingAllowedNote')}</Warning>

    <p class="text-center">
      {$t('candidateApp.allQuestions.info')}
    </p>
    {#if nofUnansweredQuestions != 0 && !loading}
      <div class="pb-6 text-center text-warning">
        {$t('candidateApp.allQuestions.warning', {numUnansweredQuestions: nofUnansweredQuestions})}
      </div>
      <div class="flex w-full justify-center pb-40 pt-20">
        <Button
          href={$getRoute({route: Route.CandAppQuestions, id: '1'})}
          text={$t('candidateApp.allQuestions.enterMissingAnswer')}
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
                  <LikertResponseButtons
                    name={question.id}
                    mode="display"
                    options={question.values}
                    selectedKey={answers[question.id].key} />

                  {#if translate(answers[question.id].openAnswer) !== ''}
                    <div class="pt-10">
                      <QuestionOpenAnswer
                        >{translate(answers[question.id].openAnswer)}</QuestionOpenAnswer>
                    </div>
                  {/if}

                  <div class="flex justify-center py-20">
                    <Button
                      text={$t('candidateApp.allQuestions.editYourAnswer')}
                      href={$getRoute({route: Route.CandAppQuestions, id: question.id})}
                      icon="missingIcon"
                      iconPos="left"></Button>
                  </div>
                </div>
                {#if categoryQuestions[categoryQuestions.length - 1] !== question}
                  <hr class="mt-40" />
                {:else}
                  <div class="mb-40" />
                {/if}
              </div>

              <!-- Question not yet answered -->
            {:else}
              <div class="pt-40">
                <div class="text-accent">
                  {question.category}
                </div>

                <Expander title={question.text ?? ''} variant="question" titleClass="text-warning">
                  {question.info}
                </Expander>

                <!-- Navigate to unsanswered question -->
                <a
                  class="flex justify-center py-20"
                  href={$getRoute({route: Route.CandAppQuestions, id: question.id})}>
                  <Button
                    text={$t('candidateApp.allQuestions.answerButton')}
                    class="w-full max-w-md bg-base-300" />
                </a>
                {#if categoryQuestions[categoryQuestions.length - 1] !== question}
                  <hr class="mt-40" />
                {:else}
                  <div class="mb-40" />
                {/if}
              </div>
            {/if}
          {/each}
        </Expander>
      </div>
    {/each}

    <div class="flex w-full justify-center py-40">
      <Button
        text={$t('candidateApp.allQuestions.return')}
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
