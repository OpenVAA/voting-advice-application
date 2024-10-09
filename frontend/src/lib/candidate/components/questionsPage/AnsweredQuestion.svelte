<script lang="ts">
  import {Button} from '$lib/components/button';
  import {Expander} from '$lib/components/expander';
  import {LikertResponseButtons} from '$lib/components/questions';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {CategoryTag} from '$lib/components/categoryTag';
  import {QuestionOpenAnswer} from '$lib/components/questions';
  import {getContext} from 'svelte';
  import type {CandidateContext} from '$lib/utils/candidateContext';
  import type {RenderQuestionProps} from './Question.type';
  import {translate} from '$lib/i18n/utils';

  type $$Props = RenderQuestionProps;

  export let question: $$Props['question'];
  export let categoryQuestions: $$Props['categoryQuestions'];

  const {opinionAnswers, answersLocked} = getContext<CandidateContext>('candidate');
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

      {#if typeof answer.value === 'number'}
        <LikertResponseButtons
          name={question.id}
          mode="display"
          options={question.values?.map(({key, label}) => ({
            key,
            label
          }))}
          selectedKey={answer.value} />
      {:else}
        <p class="text-center text-error">
          {$t('candidateApp.questions.error.invalidAnswer', {questionId: question.id})}
        </p>
      {/if}

      {#if translate(answer.openAnswer)}
        <div class="pt-10">
          <QuestionOpenAnswer>{translate(answer.openAnswer)}</QuestionOpenAnswer>
        </div>
      {/if}

      <div class="flex justify-center py-20 pb-40">
        <Button
          text={!$answersLocked
            ? $t('candidateApp.questions.editAnswer')
            : $t('candidateApp.questions.viewAnswer')}
          href={$getRoute({route: Route.CandAppQuestionEdit, id: question.id})}
          icon={!$answersLocked ? 'create' : 'show'}
          iconPos="left" />
      </div>
    </div>
    {#if categoryQuestions[categoryQuestions.length - 1] !== question}
      <hr />
    {/if}
  </div>
{:else}
  <p class="text-center text-error">
    {$t('candidateApp.questions.error.answerNotFound', {questionId: question.id})}
  </p>
{/if}
