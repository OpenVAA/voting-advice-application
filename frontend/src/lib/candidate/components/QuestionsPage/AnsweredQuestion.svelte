<script lang="ts">
  import {Button} from '$lib/components/button';
  import {Expander} from '$lib/components/expander';
  import LikertResponseButtons from '$lib/components/questions/LikertResponseButtons.svelte';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {translate} from '$lib/i18n/utils/translate';
  import QuestionOpenAnswer from '$lib/components/questions/QuestionOpenAnswer.svelte';
  import {getContext} from 'svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import type {RenderQuestionProps} from './Question.type';
  import {get} from 'svelte/store';

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
          <QuestionOpenAnswer>{translate(answers[question.id].openAnswer)}</QuestionOpenAnswer>
        </div>
      {/if}

      <div class="flex justify-center py-20 pb-40">
        <Button
          text={getAnsweredButtonText().text}
          href={$getRoute({route: Route.CandAppQuestions, id: question.id})}
          icon={getAnsweredButtonText().icon}
          iconPos="left"></Button>
      </div>
    </div>
    {#if categoryQuestions[categoryQuestions.length - 1] !== question}
      <hr />
    {/if}
  </div>
{/if}
