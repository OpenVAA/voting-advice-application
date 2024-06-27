<script lang="ts">
  import {Button} from '$lib/components/button';
  import {Expander} from '$lib/components/expander';
  import {LikertResponseButtons} from '$lib/components/questions';
  import {t, locale} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {translate} from '$lib/i18n/utils/translate';
  import {CategoryTag} from '$lib/components/categoryTag';
  import {QuestionOpenAnswer} from '$lib/components/questions';
  import {getContext} from 'svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import type {RenderQuestionProps} from './Question.type';

  type $$Props = RenderQuestionProps;

  export let question: $$Props['question'];
  export let categoryQuestions: $$Props['categoryQuestions'];

  const {opinionAnswerStore: answersStore, questionsLockedStore} =
    getContext<CandidateContext>('candidate');

  $: questionsLocked = $questionsLockedStore;

  $: answers = $answersStore;
</script>

<!--
@component
Renders an answered question on the summary page. Consists of the questions title, likert responses,
open answers and a button to navigate to the questions page.

-`question`: The question that is rendered. Taken as a mandatory prop
-`categoryQuestions`: All the questions belonging to the same category. Taken as a mandatory prop

### Usage
```tsx
  <AnsweredQuestion {question} {categoryQuestions} />
```
-->

{#if answers?.[question.id]}
  <div class="pb-20 pt-20">
    <CategoryTag category={question.category} />

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
          text={!questionsLocked
            ? $t('candidateApp.questions.editYourAnswer')
            : $t('candidateApp.questions.viewYourAnswer')}
          href={$getRoute({route: Route.CandAppQuestionEdit, id: question.id})}
          icon={!questionsLocked ? 'create' : 'show'}
          iconPos="left" />
      </div>
    </div>
    {#if categoryQuestions[categoryQuestions.length - 1] !== question}
      <hr />
    {/if}
  </div>
{/if}
