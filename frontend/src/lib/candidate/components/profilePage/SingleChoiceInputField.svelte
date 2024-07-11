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
  export let value: $$Props['value'];
</script>

<!--
@component
A component for a single choice question that can be answered.

### Bindable variables

- `value`: The selected value.

### Properties

- `question`: The question object.
- `headerText`: The header text. Defaults to the question's text. Optional.
- `footerText`: The footer text. Defaults to empty string. Optional.
- `questionsLocked`: A boolean value that indicates if the questions are locked.

### Usage

```tsx
<SingleChoiceInputField
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
      <select
        disabled={questionsLocked}
        id={question.id}
        data-testid={question.id}
        class="select select-sm w-full text-right text-primary disabled:border-none disabled:bg-base-100"
        bind:value
        style="text-align-last: right; direction: rtl;">
        <option disabled selected value style="display: none;" />
        {#each question.values ?? [] as option}
          <option value={option.key}>{option.label}</option>
        {/each}
      </select>
    </InputContainer>
  </Field>
</FieldGroup>
