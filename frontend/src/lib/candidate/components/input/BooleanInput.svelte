<script lang="ts">
  import {Field, FieldGroup} from '$lib/components/common/form';
  import {t} from '$lib/i18n';
  import {onMount} from 'svelte';
  import InputContainer from './InputContainer.svelte';
  import type {InputFieldProps} from './InputField.type';

  type $$Props = InputFieldProps<boolean>;

  export let questionId: $$Props['questionId'];
  export let footerText: $$Props['footerText'] = '';
  export let headerText: $$Props['headerText'] = '';
  export let locked: $$Props['locked'] = false;
  export let value: $$Props['value'] = false;
  export let onChange: $$Props['onChange'] = undefined;

  let inputValue = value;

  onMount(() => {
    onChange?.({questionId, value: inputValue});
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
  <Field id={questionId} label={headerText}>
    <InputContainer {locked}>
      {#if !locked}
        <input
          id={questionId}
          type="checkbox"
          class="toggle toggle-primary mr-8"
          bind:checked={inputValue}
          on:change={() => {
            onChange?.({questionId, value: inputValue});
          }} />
      {:else}
        <input
          id={questionId}
          disabled
          value={$t(inputValue ? 'common.answer.yes' : 'common.answer.no')}
          class="input input-sm input-ghost flex w-full justify-end pr-6 text-right disabled:border-none disabled:bg-base-100" />
      {/if}
    </InputContainer>
  </Field>
  <p class="mx-6 my-0 p-0 text-sm text-secondary" slot="footer">
    {footerText}
  </p>
</FieldGroup>
