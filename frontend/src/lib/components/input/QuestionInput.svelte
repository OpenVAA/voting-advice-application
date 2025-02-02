<!--
@component
A convenience wrapper for `Input` which fills in the necessary properties based on the info `Question` and possible `Answer` passed.

NB. To show opinion `Question`s, use the `OpinionQuestionInput` component in `$lib/components/questions`.

### Properties

- `question`: The `Question` for which to show the input. Not reactive.
- `answer`: The `Answer` object to the question. Not reactive.
- Any properties of `Input`, except `choices`, `ordered` and `type`. Note that `label`, `id` and `info` are prefilled but may be overridden.

### Callbacks

- `onChange`: Event handler triggered when the value changes with the new `value`.

### Usage

```tsx
<QuestionInput {question} onChange={(v) => console.info(v)} />
```
-->

<script lang="ts">
  import {
    ChoiceQuestion,
    DateQuestion,
    MultipleChoiceQuestion,
    QUESTION_TYPE,
    type QuestionType
  } from '@openvaa/data';
  import { logDebugError } from '$lib/utils/logger';
  import { Input, type InputProps } from '.';
  import type { QuestionInputProps } from './QuestionInput.type';

  type $$Props = QuestionInputProps;

  export let question: $$Props['question'];
  export let answer: $$Props['answer'] = undefined;
  export let onChange: $$Props['onChange'] = undefined;

  // TODO: Implement
  if (question.type === QUESTION_TYPE.MultipleText)
    throw new Error(`MultipleTextQuestions are not yet supported by QuestionInput. Question id: ${question.id}.`);
  if (question instanceof DateQuestion && question.format)
    logDebugError(`Date formats are not supported yet by QuestionInput. Question id: ${question.id}.`);

  ////////////////////////////////////////////////////////////////////
  // Define Input properties
  ////////////////////////////////////////////////////////////////////

  const INPUT_TYPES: Record<Exclude<QuestionType, typeof QUESTION_TYPE.MultipleText>, InputProps['type']> = {
    [QUESTION_TYPE.Text]: 'text',
    [QUESTION_TYPE.Number]: 'number',
    [QUESTION_TYPE.Boolean]: 'boolean',
    [QUESTION_TYPE.Image]: 'image',
    [QUESTION_TYPE.Date]: 'date',
    [QUESTION_TYPE.SingleChoiceOrdinal]: 'select',
    [QUESTION_TYPE.SingleChoiceCategorical]: 'select',
    [QUESTION_TYPE.MultipleChoiceCategorical]: 'select-multiple'
  } as const;

  let inputProps: InputProps;

  const type = INPUT_TYPES[question.type];
  const { id, info, name: label } = question;
  const { fillingInfo } = customData;

  if (question instanceof ChoiceQuestion) {
    const options = question.choices;
    inputProps = {
      type,
      id,
      label,
      info: fillingInfo ?? info,
      options,
      ordered: question instanceof MultipleChoiceQuestion ? true : undefined
    } as InputProps;
  } else {
    inputProps = { type, id, label, info };
  }

  const value = question.ensureAnswer(answer)?.value;
  if (value != null) {
    inputProps.value = value instanceof Date ? value.toISOString().split('T')[0] : value;
  }

  ////////////////////////////////////////////////////////////////////
  // Callback
  ////////////////////////////////////////////////////////////////////

  function handleChange(value: unknown): void {
    onChange?.({ value, question });
  }
</script>

<Input {...inputProps} {...$$restProps} onChange={handleChange} />
