<script lang="ts">
  import Field from '$lib/components/common/form/Field.svelte';
  import InputContainer from './InputContainer.svelte';

  export let question: QuestionProps;
  export let questionsLocked: boolean | undefined;

  const dateMin = '1800-01-01';
  const dateMax = new Date().toISOString().split('T')[0];

  export let value: AnswePropsValue = '';

  //ensure that the date is in the correct format
  if (value && typeof value === 'string') {
    value = value.slice(0, 10);
  }
</script>

<!--
@component
A component for rendering a Date question.

### Bindable variables

- `value`: A boolean value that indicates the date that has been selected.

### Properties

- `question`: The question object.
- `inputClass`: A class that defines input styles.
- `questionsLocked`: A boolean value that indicates if the questions are locked.

### Usage

```tsx
<DateInputField
  question={question}
  questionsLocked={questionsLocked}
  bind:value={value} />
```
-->

<Field id={question.id} label={question.text}>
  <InputContainer locked={questionsLocked}>
    <div
      class="input input-sm input-ghost flex w-full justify-end pr-2 text-right disabled:border-none disabled:bg-base-100">
      <input
        disabled={questionsLocked}
        class="dark:bg-black"
        type="date"
        min={dateMin}
        max={dateMax}
        id={question.id}
        bind:value />
    </div>
  </InputContainer>
</Field>
