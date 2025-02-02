<!--
@component
Display an opinion `Question`'s answering input. Shows an error if the question is of an unsupported type.

NB. The layout differs from the `QuestionInput` component, which is used for info questions.

### Properties

- `question`: The opinion `Question` for which to show the input. Not reactive.
- `answer`: The `Answer` object to the question. Not reactive.
- `mode`: The same component can be used both for answering the questions and displaying answers. @default `'answer'`
- `otherAnswer`:The `Answer` of the other entity in `display` mode. @default undefined
- `otherLabel`: The label for the entity's answer. Be sure to supply this if `otherSelected` is supplied.
- Any properties of `QuestionInput`.

### Usage

```tsx
<OpinionQuestionInput
  {question}
  answer={$voterAnswers[question.id]}
  onChange={answerQuestion} />
<OpinionQuestionInput
  {question}
  mode="display"
  answer={$voterAnswers[question.id]}
  otherAnswer={candidate.getAnswer(question)}
  otherLabel={$t('candidateApp.common.candidateAnswerLabel')} />
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { logDebugError } from '$lib/utils/logger';
  import { SingleChoiceCategoricalQuestion, SingleChoiceOrdinalQuestion } from '@openvaa/data';
  import ErrorMessage from '../errorMessage/ErrorMessage.svelte';
  import type { OpinionQuestionInputProps } from './OpinionQuestionInput.type';
  import QuestionChoices from './QuestionChoices.svelte';

  type $$Props = OpinionQuestionInputProps;

  export let question: $$Props['question'];
  export let mode: $$Props['mode'] = undefined;
  export let answer: $$Props['answer'] = undefined;
  export let otherAnswer: $$Props['otherAnswer'] = undefined;
  export let otherLabel: $$Props['otherLabel'] = undefined;

  $: mode ??= 'answer';

  if (mode === 'display' && otherAnswer && !otherLabel)
    logDebugError('You should supply an otherLabel when mode is "display" and otherSelected is provided');

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();
</script>

{#if question instanceof SingleChoiceOrdinalQuestion 
  || question instanceof SingleChoiceCategoricalQuestion}
  {@const selectedId = question.ensureValue(answer?.value)}
  {@const otherSelected = question.ensureValue(otherAnswer?.value)}
  <QuestionChoices
    {question}
    {mode}
    {selectedId}
    {otherSelected}
    {otherLabel}
    {...$$restProps}/>
{:else}
  <ErrorMessage inline message={$t('error.unsupportedQuestion')} class="text-center"/>
{/if}
