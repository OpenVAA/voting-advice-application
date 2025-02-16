<!--
@component
A convenience wrapper for `Input` which fills in the necessary properties based on the info `Question` and possible `Answer` passed.

NB. To show opinion `Question`s, use the `OpinionQuestionInput` component in `$lib/components/questions`.

### Properties

- `question`: The `Question` for which to show the input. Not reactive.
- `answer`: The `Answer` object to the question. Not reactive.
- `disableMultilingual`:  If `true`, text inputs will not be multilingual. @default `false`
- Any properties of `Input`, except `choices`, `ordered` and `type`. Note that `label`, `id` and `info` are prefilled but may be overridden.

### Callbacks

- `onChange`: Event handler triggered when the value changes with the new `value`.

### Usage

```tsx
<QuestionInput {question} onChange={(v) => console.info(v)} />
```
-->

<script lang="ts">
  import { getCustomData, isLocalizedString } from '@openvaa/app-shared';
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
  export let disableMultilingual: $$Props['disableMultilingual'] = undefined;
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
  const customData = getCustomData(question);

  let type = INPUT_TYPES[question.type];
  if (question.type === QUESTION_TYPE.Text && question.subtype === 'link') 
    type = 'url';

  // Apply customData modifiers
  if (customData.longText) {
    if (type === 'text') type = 'textarea';
    else if (type === 'text-multilingual') type = 'textarea-multilingual';
  }

  // Apply multilingual support if not disabled
  if (!disableMultilingual && !customData.disableMultilingual) {
    if (type === 'text') type = 'text-multilingual';
    else if (type === 'textarea') type = 'textarea-multilingual';
  }

  const { id, info, name: label } = question;
  const { fillingInfo, locked, maxlength, required } = customData;
  const baseProps = {
    type,
    id,
    label,
    locked,
    maxlength,
    // Locked questions cannot be required
    required: required == null ? undefined : !locked && required,
    info: fillingInfo ?? info
  };

  if (question instanceof ChoiceQuestion) {
    const options = question.choices;
    inputProps = {
      ...baseProps,
      options,
      ordered: question instanceof MultipleChoiceQuestion ? true : undefined
    } as InputProps;
  } else {
    inputProps = baseProps;
  }

  // Check that the answer value is valid, but we can't use `Question.ensureAnswer` for multilingual inputs
  let value = answer?.value;
  if (value != null) {
    if (type.endsWith('-multilingual')) {
      value = isLocalizedString(value) || typeof value === 'string' ? value : undefined;
    } else {
      value = question.ensureValue(value);
    }
    // `DateQuestion`s have their values as `Date`s
    if (value instanceof Date) value = value.toISOString().split('T')[0];
    inputProps.value = value as InputProps['value'];
  }

  ////////////////////////////////////////////////////////////////////
  // Callback
  ////////////////////////////////////////////////////////////////////

  function handleChange(value: unknown): void {
    onChange?.({ value, question });
  }
</script>

<Input {...inputProps} {...$$restProps} onChange={handleChange} />
