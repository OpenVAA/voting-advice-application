<!--
@component A convenience wrapper for `Input` which fills in the necessary properties based on the info `Question` and possible `Answer` passed.

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
  import { getCustomData, isLocalizedString, log } from '@openvaa/app-shared';
  import { DateQuestion, isChoiceQuestion, isMultipleChoiceQuestion, QUESTION_TYPE } from '@openvaa/data';
  import { Input } from '.';
  import type { QuestionType } from '@openvaa/data';
  import type { InputProps } from '.';
  import type { QuestionInputProps } from './QuestionInput.type';

  let { question, answer, disableMultilingual, onChange, ...restProps }: QuestionInputProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Define Input properties
  ////////////////////////////////////////////////////////////////////

  const INPUT_TYPES: Record<QuestionType, InputProps['type']> = {
    [QUESTION_TYPE.Text]: 'text',
    [QUESTION_TYPE.Number]: 'number',
    [QUESTION_TYPE.Boolean]: 'boolean',
    [QUESTION_TYPE.Image]: 'image',
    [QUESTION_TYPE.Date]: 'date',
    [QUESTION_TYPE.SingleChoiceOrdinal]: 'select',
    [QUESTION_TYPE.SingleChoiceCategorical]: 'select',
    [QUESTION_TYPE.MultipleChoiceCategorical]: 'select-multiple',
    [QUESTION_TYPE.MultipleText]: 'multiple-text'
  } as const;

  // Doc declares question/answer/disableMultilingual non-reactive, but we still derive so Svelte 5 sees the prop reads as reactive edges.
  // Validation runs as an $effect so the warnings re-fire on prop change.
  $effect(() => {
    if (question instanceof DateQuestion && question.format)
      log.debug(`Date formats are not supported yet by QuestionInput. Question id: ${question.id}.`);
  });

  const customData = $derived(getCustomData(question));

  const type = $derived.by<InputProps['type']>(() => {
    let t = INPUT_TYPES[question.type];
    if (question.type === QUESTION_TYPE.Text && question.subtype === 'link') t = 'url';
    // reason: placed BEFORE longText + !disableMultilingual blocks so 'email' falls through unchanged (those blocks only remap 'text'/'textarea').
    if (question.type === QUESTION_TYPE.Text && question.subtype === 'email') t = 'email';
    if (customData.longText) {
      if (t === 'text') t = 'textarea';
      else if (t === 'text-multilingual') t = 'textarea-multilingual';
    }
    if (!disableMultilingual && !customData.disableMultilingual) {
      if (t === 'text') t = 'text-multilingual';
      else if (t === 'textarea') t = 'textarea-multilingual';
      // A multi-text row list is promoted on the same condition as the other text kinds, which is what makes "each text item behaves like a normal multilingual text item" structural rather than aspirational.
      else if (t === 'multiple-text') t = 'multiple-text-multilingual';
    }
    return t;
  });

  const inputProps = $derived.by<InputProps>(() => {
    const { id, info, name: label } = question;
    const { fillingInfo, locked, maxlength, minItems, maxItems } = customData;
    const baseProps = {
      type,
      id,
      label,
      locked,
      maxlength,
      // Locked questions cannot be required
      required: !locked && question.required,
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
    } else if (type.startsWith('multiple-text')) {
      // The row list takes its floor and ceiling from the same `customData` keys as the other per-question knobs.
      props = { ...baseProps, minItems, maxItems } as InputProps;
    } else {
      props = baseProps as InputProps;
    }

    // Check that the answer value is valid, but we can't use `Question.ensureAnswer` for multilingual inputs
    let value = answer?.value;
    if (value != null) {
      if (type === 'multiple-text-multilingual') {
        // A multilingual row list holds one localized string per row. `ensureValue` rejects those for exactly the reason it rejects a plain multilingual text answer, so the check is by shape here too. Plain strings are admitted and read as the displayed locale by the row list, which is what keeps answers written before this kind existed readable.
        value =
          Array.isArray(value) && value.every((v) => typeof v === 'string' || isLocalizedString(v)) ? value : undefined;
      } else if (type.endsWith('-multilingual')) {
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

  // Combine props with type assertion to avoid "union too complex" TS error on the 14-way InputProps union
  const allProps = $derived({ ...inputProps, ...restProps, onChange: handleChange } as InputProps);
</script>

<Input {...allProps} />
