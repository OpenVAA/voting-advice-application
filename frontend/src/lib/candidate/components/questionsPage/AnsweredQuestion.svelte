<script lang="ts">
  import {Button} from '$lib/components/button';
  import {Expander} from '$lib/components/expander';
  import {LikertResponseButtons} from '$lib/components/questions';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {CategoryTag} from '$lib/components/categoryTag';
  import {QuestionOpenAnswer} from '$lib/components/questions';
  import {getContext} from 'svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import type {RenderQuestionProps} from './Question.type';
  import {translate} from '$lib/i18n/utils';

  type $$Props = RenderQuestionProps;

  export let question: $$Props['question'];
  export let categoryQuestions: $$Props['categoryQuestions'];

  const {opinionAnswers, questionsLocked} = getContext<CandidateContext>('candidate');
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

{#if $opinionAnswers?.[question.id]}
  {@const answer = $opinionAnswers[question.id]}
  <div class="pb-20 pt-20">
    <CategoryTag category={question.category} />

    <Expander title={question.text} variant="question">
      {question.info}
    </Expander>

    <div class="pt-10">
      <!-- This gives empty form label error from Wave Extension for every empty dot, but fix should come from LikertResponseButton -->

      {#if typeof answer.value === 'number' || answer.value == null}
        <LikertResponseButtons
          name={question.id}
          mode="display"
          options={question.values?.map(({key, label}) => ({
            key,
            label
          }))}
          selectedKey={answer.value} />
      {/if}

      {#if translate(answer.openAnswer)}
        <div class="pt-10">
          <QuestionOpenAnswer>{translate(answer.openAnswer)}</QuestionOpenAnswer>
        </div>
      {/if}

      <div class="flex justify-center py-20 pb-40">
        <Button
          text={!$questionsLocked
            ? $t('candidateApp.questions.editYourAnswer')
            : $t('candidateApp.questions.viewYourAnswer')}
          href={$getRoute({route: Route.CandAppQuestionEdit, id: question.id})}
          icon={!$questionsLocked ? 'create' : 'show'}
          iconPos="left" />
      </div>
    </div>
    {#if categoryQuestions[categoryQuestions.length - 1] !== question}
      <hr />
    {/if}
  </div>
{/if}
