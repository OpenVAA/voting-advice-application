<script lang="ts">
  import { getContext } from 'svelte';
  import type { RenderQuestionProps } from './Question.type';
  import { Button } from '$lib/components/button';
  import { CategoryTag } from '$lib/components/categoryTag';
  import { Expander } from '$lib/components/expander';
  import { t } from '$lib/i18n';
  import { translate } from '$lib/i18n/utils';
  import type { CandidateContext } from '$lib/utils/candidateStore';
  import { getRoute, Route } from '$lib/utils/navigation';

  type $$Props = RenderQuestionProps;

  export let question: $$Props['question'];
  export let categoryQuestions: $$Props['categoryQuestions'];

  const { questionsLockedStore } = getContext<CandidateContext>('candidate');
  $: questionsLocked = $questionsLockedStore;
</script>

<!--
@component
Renders an unanswered question on the summary page. Consists of the questions title and a button to navigate to the questions page.

-`question`: The question that is rendered. Taken as a mandatory prop
-`categoryQuestions`: All the questions belonging to the same category. Taken as a mandatory prop

### Usage
```tsx
  <UnAnsweredQuestion {question} {categoryQuestions} />
```
-->

<div class="pt-40">
  <CategoryTag category={question.category} />

  <Expander title={translate(question.text)} variant="question" titleClass="text-warning">
    {translate(question.info)}
  </Expander>

  <!-- Navigate to unsanswered question -->
  {#if !questionsLocked}
    <a
      class="flex justify-center py-20 pb-40"
      href={$getRoute({ route: Route.CandAppQuestions, id: question.id })}>
      <Button
        text={$t('candidateApp.questions.answerButton')}
        class="w-full max-w-md bg-base-300" />
    </a>
  {:else}
    <p class="p-10 pb-40">{$t('candidateApp.questions.notAnswered')}</p>
  {/if}
  {#if categoryQuestions[categoryQuestions.length - 1] !== question}
    <hr />
  {/if}
</div>
