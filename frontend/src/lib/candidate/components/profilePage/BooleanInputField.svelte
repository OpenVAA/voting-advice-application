<script lang="ts">
  import Field from '$lib/components/common/form/Field.svelte';
  import FieldGroup from '$lib/components/common/form/FieldGroup.svelte';
  import InputContainer from './InputContainer.svelte';

  export let question: QuestionProps;
  export let disclaimer: string | undefined = '';
  export let questionsLocked: boolean | undefined = false;
  export let checked: AnswePropsValue = false;

  let isChecked = false;
  if (typeof checked === 'boolean') {
    isChecked = checked;
  }

  $: {
    checked = isChecked;
  }
</script>

<!--
@component
A component for rendering a boolean question.

### Bindable variables

- `checked`: A boolean value that indicates if the checkbox is checked or not.

### Properties

- `question`: The question object.
- `disclaimer`: The disclaimer text.
- `questionsLocked`: A boolean value that indicates if the questions are locked.

### Usage

```tsx
<BooleanInputField
  question={question}
  disclaimer="This is a disclaimer"
  questionsLocked={questionsLocked}
  bind:checked={checked} />
```
-->

<FieldGroup>
  <p slot="header" class="small-label mx-6 my-0 p-0 uppercase">
    {question.text}
  </p>
  <Field id={question.id} label={question.text}>
    <InputContainer locked={questionsLocked}>
      {#if !questionsLocked}
        <input
          id={question.id}
          type="checkbox"
          class="toggle toggle-primary mr-8"
          bind:checked={isChecked} />
      {:else}
        <input
          id={question.id}
          disabled
          value="yes"
          class="input input-sm input-ghost flex w-full justify-end pr-2 text-right disabled:border-none disabled:bg-base-100" />
      {/if}
    </InputContainer>
  </Field>
  <p class="mx-6 my-0 p-0 text-sm text-secondary" slot="footer">
    {disclaimer}
  </p>
</FieldGroup>
