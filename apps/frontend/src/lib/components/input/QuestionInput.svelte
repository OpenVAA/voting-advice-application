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
  import { DateQuestion, isChoiceQuestion, isMultipleChoiceQuestion, QUESTION_TYPE } from '@openvaa/data';
  import { logDebugError } from '$lib/utils/logger';
  import { Input } from '.';
  import type { QuestionType } from '@openvaa/data';
  import type { InputProps } from '.';
  import type { QuestionInputProps } from './QuestionInput.type';

  let { question, answer, disableMultilingual, onChange, ...restProps }: QuestionInputProps = $props();

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

  // Doc declares question/answer/disableMultilingual non-reactive, but
  // we still derive so Svelte 5 sees the prop reads as reactive edges.
  // Validation runs as an $effect so the warnings re-fire on prop change.
  $effect(() => {
    if (question.type === QUESTION_TYPE.MultipleText)
      throw new Error(`MultipleTextQuestions are not yet supported by QuestionInput. Question id: ${question.id}.`);
    if (question instanceof DateQuestion && question.format)
      logDebugError(`Date formats are not supported yet by QuestionInput. Question id: ${question.id}.`);
  });

  const customData = $derived(getCustomData(question));

  const type = $derived.by<InputProps['type']>(() => {
    let t = INPUT_TYPES[question.type];
    if (question.type === QUESTION_TYPE.Text && question.subtype === 'link') t = 'url';
    if (customData.longText) {
      if (t === 'text') t = 'textarea';
      else if (t === 'text-multilingual') t = 'textarea-multilingual';
    }
    if (!disableMultilingual && !customData.disableMultilingual) {
      if (t === 'text') t = 'text-multilingual';
      else if (t === 'textarea') t = 'textarea-multilingual';
    }
    return t;
  });

  const inputProps = $derived.by<InputProps>(() => {
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

    let props: InputProps;
    if (isChoiceQuestion(question)) {
      const options = question.choices;
      props = {
        ...baseProps,
        options,
        ordered: isMultipleChoiceQuestion(question) ? true : undefined
      } as InputProps;
    } else {
      props = baseProps as InputProps;
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
      props.value = value as InputProps['value'];
    }
    return props;
  });

  ////////////////////////////////////////////////////////////////////
  // Callback
  ////////////////////////////////////////////////////////////////////

  function handleChange(value: unknown): void {
    onChange?.({ value, question });
  }

  // Combine props with type assertion to avoid "union too complex" TS error on the 10-way InputProps union
  const allProps = $derived({ ...inputProps, ...restProps, onChange: handleChange } as InputProps);
</script>

<Input {...allProps} />
