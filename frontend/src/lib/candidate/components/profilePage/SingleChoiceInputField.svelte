<script lang="ts">
  import Field from '$lib/components/common/form/Field.svelte';
  import InputContainer from './InputContainer.svelte';

  export let question: QuestionProps;
  export let questionsLocked: boolean | undefined;
  export let value: AnswePropsValue;
</script>

<!--
@component
A component for rendering a single choice question.

### Bindable variables

- `value`: The selected value.

### Properties

- `question`: The question object.
- `questionsLocked`: A boolean value that indicates if the questions are locked.

### Usage

```tsx
<SingleChoiceInputField
  question={question}
  questionsLocked={questionsLocked}
  bind:value={value} />
```
-->

<Field id={question.id} label={question.text}>
  <InputContainer locked={questionsLocked}>
    <select
      disabled={questionsLocked}
      id={question.id}
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
