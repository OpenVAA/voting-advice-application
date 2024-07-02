<script lang="ts">
  import Field from '$lib/components/common/form/Field.svelte';
  import InputContainer from './InputContainer.svelte';

  export let question: QuestionProps;
  export let labelClass: string;
  export let inputClass: string;
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
- `labelClass`: A class that defines label styles.
- `inputClass`: A class that defines input styles.
- `questionsLocked`: A boolean value that indicates if the questions are locked.

### Usage

```tsx
<RenderDate
  question={question}
  labelClass="text-lg"
  inputClass="text-lg"
  questionsLocked={questionsLocked}
  bind:value={value} />
```
-->

<Field>
  <label for="birthday" class={labelClass}>
    {question.text}
  </label>
  <InputContainer locked={questionsLocked}>
    <div class={inputClass}>
      <input
        disabled={questionsLocked}
        class="dark:bg-black"
        type="date"
        min={dateMin}
        max={dateMax}
        id="birthday"
        bind:value />
    </div>
  </InputContainer>
</Field>
