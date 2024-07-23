<script lang="ts">
  import {Field, FieldGroup} from '$lib/components/common/form';
  import {t} from '$lib/i18n';
  import {onMount} from 'svelte';
  import InputContainer from './InputContainer.svelte';
  import type {InputFieldProps} from './InputField.type';

  type $$Props = InputFieldProps<boolean>;

  export let question: $$Props['question'];
  export let footerText: $$Props['footerText'] = '';
  export let headerText: $$Props['headerText'] = question.text;
  export let locked: $$Props['locked'] = false;
  export let value: $$Props['value'] = false;
  export let onChange: ((question: QuestionProps, value: $$Props['value']) => void) | undefined =
    undefined;

  onMount(() => {
    onChange?.(question, value);
  });
</script>

<!--
@component
A component for a boolean question that can be answered.


### Properties

- `question`: The question object.
- `headerText`: The header text. Defaults to the question's text. Optional.
- `footerText`: The footer text. Optional.
- `locked`: A boolean value that indicates if the questions are locked.
- `value`: A boolean value that indicates if the checkbox is checked or not.
- `onChange`: A function that is called when the checkbox is checked or unchecked.

### Usage

```tsx
<BooleanInput
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
  <Field id={question.id} label={question.text}>
    <InputContainer {locked}>
      {#if !locked}
        <input
          id={question.id}
          type="checkbox"
          class="toggle toggle-primary mr-8"
          bind:checked={value}
          on:change={() => {
            if (value) {
              onChange?.(question, value);
            }
          }} />
      {:else}
        <input
          id={question.id}
          disabled
          value={$t(`common.${value ? 'answerYes' : 'answerNo'}`)}
          class="input input-sm input-ghost flex w-full justify-end pr-6 text-right disabled:border-none disabled:bg-base-100" />
      {/if}
    </InputContainer>
  </Field>
  <p class="mx-6 my-0 p-0 text-sm text-secondary" slot="footer">
    {footerText}
  </p>
</FieldGroup>
