<script lang="ts">
  import Field from '$lib/components/common/form/Field.svelte';
  import FieldGroup from '$lib/components/common/form/FieldGroup.svelte';
  import InputContainer from './InputContainer.svelte';
  import type {inputFieldProps} from './InputField.type';

  type $$Props = inputFieldProps;

  export let question: $$Props['question'];
  export let footerText: $$Props['footerText'] = '';
  export let headerText: $$Props['headerText'] = question.text;
  export let questionsLocked: $$Props['questionsLocked'] = false;
  export let value: $$Props['value'] = '';

  const dateMin = '1800-01-01';
  const dateMax = new Date().toISOString().split('T')[0];

  //ensure that the date is in the correct format
  if (value && typeof value === 'string') {
    value = value.slice(0, 10);
  }
</script>

<!--
@component
A component for a date question that can be answered.

### Bindable variables

- `value`: A boolean value that indicates the date that has been selected.

### Properties

- `question`: The question object.
- `headerText`: The header text. Defaults to the question's text. Optional.
- `footerText`: The footer text. Defaults to empty string. Optional.
- `questionsLocked`: A boolean value that indicates if the questions are locked.

### Usage

```tsx
<DateInputField
  question={question}
  questionsLocked={questionsLocked}
  bind:value={value} />
```
-->

<FieldGroup>
  <p slot="header" class="small-label mx-6 my-0 p-0 uppercase">
    {headerText}
  </p>
  <Field id={question.id} label={question.text}>
    <InputContainer locked={questionsLocked}>
      <div class="w-full">
        <input
          disabled={questionsLocked}
          class="input input-sm input-ghost flex w-full justify-end pr-12 text-right disabled:border-none disabled:bg-transparent"
          type="date"
          min={dateMin}
          max={dateMax}
          id={question.id}
          bind:value />
      </div>
    </InputContainer>
  </Field>
</FieldGroup>
