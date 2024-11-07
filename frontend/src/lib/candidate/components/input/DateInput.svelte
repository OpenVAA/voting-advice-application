<script lang="ts">
  import { Field, FieldGroup } from '$lib/components/common/form';
  import InputContainer from './InputContainer.svelte';
  import type { InputFieldProps } from './InputField.type';

  type $$Props = InputFieldProps<string>;

  export let questionId: $$Props['questionId'];
  export let headerText: $$Props['headerText'] = '';
  export let locked: $$Props['locked'] = false;
  export let value: $$Props['value'] = '';
  export let onChange: $$Props['onChange'] = undefined;

  let inputValue = value;

  const dateMin = '1800-01-01';
  const dateMax = new Date().toISOString().split('T')[0];

  //ensure that the date is in the correct format
  if (value && typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      value = date.toISOString().split('T')[0];
    } else {
      // Invalid value, use an empty date
      value = '';
    }
  } else {
    // Invalid value, use an empty date
    value = '';
  }
</script>

<!--
@component
A component for a date question that can be answered.

### Properties

- `question`: The question object.
- `headerText`: The header text. Defaults to the question's text. Optional.
- `footerText`: The footer text. Optional.
- `locked`: A boolean value that indicates if the questions are locked.
- `value`: The selected value.
- `onChange`: A function that is called when the value changes.

### Usage

```tsx
<DateInput
  question={question}
  locked={locked}
  value={value}
  onChange={onChange} />
```
-->

<FieldGroup>
  <p slot="header" class="small-label mx-6 my-0 p-0">
    {headerText}
  </p>
  <Field id={questionId} label={headerText}>
    <InputContainer {locked}>
      <div class="w-full">
        <input
          disabled={locked}
          class="input input-sm input-ghost flex w-full justify-end pr-12 text-right disabled:border-none disabled:bg-transparent"
          type="date"
          min={dateMin}
          max={dateMax}
          id={questionId}
          bind:value={inputValue}
          on:change={() => {
            onChange?.({ questionId, value: inputValue });
          }} />
      </div>
    </InputContainer>
  </Field>
</FieldGroup>
