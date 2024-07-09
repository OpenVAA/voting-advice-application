<script lang="ts">
  import Field from '$lib/components/common/form/Field.svelte';
  import InputContainer from './InputContainer.svelte';

  export let question: QuestionProps;
  export let selectClass: string;
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
- `selectClass`: A class that defines select styles.
- `questionsLocked`: A boolean value that indicates if the questions are locked.

### Usage

```tsx
<SingleChoiceInputField
  question={question}
  selectClass="text-lg"
  questionsLocked={questionsLocked}
  bind:value={value} />
```
-->

<Field>
  <label
    for={question.id}
    class="label-sm label pointer-events-none mx-6 my-2 whitespace-nowrap text-secondary">
    {question.text}
  </label>
  <InputContainer locked={questionsLocked}>
    <select
      disabled={questionsLocked}
      id={question.id}
      class={selectClass}
      bind:value
      style="text-align-last: right; direction: rtl;">
      <option disabled selected value style="display: none;" />
      {#each question.values ?? [] as option}
        <option value={option.key}>{option.label}</option>
      {/each}
    </select>
  </InputContainer>
</Field>
