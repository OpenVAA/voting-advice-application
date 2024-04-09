<script lang="ts">
  import {Button} from '$lib/components/button';
  import {Expander} from '$lib/components/expander';
  import {LikertResponseButtons} from '$lib/components/questions';
  import {t, locale} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {translate} from '$lib/i18n/utils/translate';
  import {QuestionOpenAnswer} from '$lib/components/questions';
  import {getContext} from 'svelte';
  import {get} from 'svelte/store';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import type {RenderQuestionProps} from './Question.type';

  type $$Props = RenderQuestionProps;

  export let question: $$Props['question'];
  export let categoryQuestions: $$Props['categoryQuestions'];

  const {answersStore, questionsStore} = getContext<CandidateContext>('candidate');

  let dataEditable: boolean;

  let questions = get(questionsStore) ?? [];

  if (questions) {
    //TODO: use store when store is implemented
    dataEditable = Object.values(questions)[0].editable;
  }

  $: answers = $answersStore;

  const getAnsweredButtonText = () => {
    if (dataEditable) {
      return {
        text: $t('candidateApp.questions.editYourAnswer'),
        icon: 'missingIcon'
      };
    }
    return {
      text: $t('candidateApp.questions.viewYourAnswer'),
      icon: 'show'
    };
  };
</script>

{#if answers?.[question.id]}
  <div class="pb-20 pt-20">
    <div class="text-accent">
      {translate(question.category)}
    </div>

    <Expander title={translate(question.text)} variant="question">
      {translate(question.info)}
    </Expander>

    <div class="pt-10">
      <!-- This gives empty form label error from Wave Extension for every empty dot, but fix should come from LikertResponseButton -->
      <LikertResponseButtons
        name={question.id}
        mode="display"
        options={question.values?.map(({key, label}) => ({
          key,
          label: translate(label, $locale)
        }))}
        selectedKey={answers[question.id].key} />

      {#if translate(answers[question.id].openAnswer) !== ''}
        <div class="pt-10">
          <QuestionOpenAnswer>{translate(answers[question.id].openAnswer)}</QuestionOpenAnswer>
        </div>
      {/if}

      <div class="flex justify-center py-20 pb-40">
        <Button
          text={getAnsweredButtonText().text}
          href={$getRoute({route: Route.CandAppQuestionEdit, id: question.id})}
          icon={getAnsweredButtonText().icon}
          iconPos="left" />
      </div>
    </div>
    {#if categoryQuestions[categoryQuestions.length - 1] !== question}
      <hr />
    {/if}
  </div>
{/if}