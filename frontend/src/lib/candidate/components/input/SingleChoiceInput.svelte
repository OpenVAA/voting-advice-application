<script lang="ts">
  import {Field, FieldGroup} from '$lib/components/common/form';
  import InputContainer from './InputContainer.svelte';

  import type {InputFieldProps} from './InputField.type';

  type $$Props = InputFieldProps<number>;

  export let questionId: $$Props['questionId'];
  export let options: $$Props['options'] = Array<AnswerOption>();
  export let headerText: $$Props['headerText'] = '';
  export let locked: $$Props['locked'] = false;
  export let value: $$Props['value'] = undefined;
  export let onChange: $$Props['onChange'] = undefined;

  let inputValue = value;

  if (!options || options.length === 0) {
    throw new Error(
      `Could not find options for question with id '${questionId ? questionId : 'n/a'}'`
    );
  }
</script>

<!--
@component
A component for a single choice question that can be answered.

### Properties

- `question`: The question object.
- `headerText`: The header text. Defaults to the question's text. Optional.
- `footerText`: The footer text. Defaults to empty string. Optional.
- `locked`: A boolean value that indicates if the questions are locked.
- `value`: The selected value.
- `onChange`: A function that is called when the value changes.

### Usage

```tsx
<SingleChoiceInput
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
      <select
        disabled={locked}
        id={questionId}
        data-testid={questionId}
        class="select select-sm w-full text-right text-primary disabled:border-none disabled:bg-base-100"
        bind:value={inputValue}
        on:change={() => {
          onChange?.({questionId, value: inputValue});
        }}
        style="text-align-last: right; direction: rtl;">
        <option disabled selected value style="display: none;" />
        {#each options as option}
          <option value={option.key}>{option.label}</option>
        {/each}
      </select>
    </InputContainer>
  </Field>
</FieldGroup>
