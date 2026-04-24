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
  otherLabel={t('candidateApp.common.candidateAnswerLabel')} />
```
-->

<script lang="ts">
  import { isBooleanQuestion, isSingleChoiceQuestion } from '@openvaa/data';
  import { getComponentContext } from '$lib/contexts/component';
  import { logDebugError } from '$lib/utils/logger';
  import QuestionChoices from './QuestionChoices.svelte';
  import ErrorMessage from '../errorMessage/ErrorMessage.svelte';
  import type { Choice } from '@openvaa/data';
  import type { OpinionQuestionInputProps } from './OpinionQuestionInput.type';

  let {
    question,
    mode = 'answer',
    answer = undefined,
    otherAnswer = undefined,
    otherLabel = undefined,
    onChange,
    ...restProps
  }: OpinionQuestionInputProps = $props();

  if (mode === 'display' && otherAnswer && !otherLabel)
    logDebugError('You should supply an otherLabel when mode is "display" and otherSelected is provided');

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // BooleanQuestion support
  ////////////////////////////////////////////////////////////////////

  // Synthesized pseudo-choices for `BooleanQuestion`. Uses existing i18n keys
  // under `common.answer.*` (verified present in en/fi/sv/da).
  // Order: `no` first matches the ordinal low→high left-to-right convention
  // (see `QuestionChoices.doShowLine` default for booleans).
  const booleanChoices = $derived<Array<Choice>>([
    { id: 'no', label: t('common.answer.no') },
    { id: 'yes', label: t('common.answer.yes') }
  ]);

  // Translate between stored boolean answer value and pseudo-choice id.
  // Answers MUST be stored as boolean (`true`/`false`), never as the strings
  // `'yes'`/`'no'`. The branch's onChange adapter maps `'yes'` → `true` and
  // `'no'` → `false` before bubbling to the parent.
  function booleanToChoiceId(v: unknown): string | null {
    if (v === true) return 'yes';
    if (v === false) return 'no';
    return null;
  }
</script>

<div data-testid="opinion-question-input">
  {#if isSingleChoiceQuestion(question)}
    {@const selectedId = question.ensureValue(answer?.value)}
    {@const otherSelected = question.ensureValue(otherAnswer?.value)}
    <QuestionChoices
      {question}
      {mode}
      {selectedId}
      {otherSelected}
      {otherLabel}
      onChange={onChange ? (d) => onChange({ value: d.value, question: d.question }) : undefined}
      {...restProps} />
  {:else if isBooleanQuestion(question)}
    {@const selectedId = booleanToChoiceId(answer?.value)}
    {@const otherSelected = booleanToChoiceId(otherAnswer?.value)}
    <QuestionChoices
      {question}
      choices={booleanChoices}
      {mode}
      {selectedId}
      {otherSelected}
      {otherLabel}
      onChange={onChange ? (d) => onChange({ value: d.value === 'yes', question: d.question }) : undefined}
      {...restProps} />
  {:else}
    <ErrorMessage inline message={t('error.unsupportedQuestion')} class="text-center" />
  {/if}
</div>
