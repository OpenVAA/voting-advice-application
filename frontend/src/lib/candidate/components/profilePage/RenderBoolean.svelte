<script lang="ts">
  import Field from '$lib/components/common/form/Field.svelte';
  import FieldGroup from '$lib/components/common/form/FieldGroup.svelte';
  import {t} from '$lib/i18n';
  import InputContainer from './InputContainer.svelte';

  export let question: QuestionProps;
  export let labelClass: string;
  export let disclaimerClass: string;
  export let inputClass: string;
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
- `labelClass`: A class that defines label styles.
- `disclaimerClass`: A class that defines disclaimer styles.
- `inputClass`: A class that defines input styles.
- `questionsLocked`: A boolean value that indicates if the questions are locked.

### Usage

```tsx
<RenderBoolean
  question={question}
  labelClass="text-lg"
  disclaimerClass="text-sm"
  inputClass="text-lg"
  questionsLocked={questionsLocked}
  bind:checked={checked} />
```
-->

<FieldGroup>
  <Field>
    <label for="unaffiliated" class={labelClass}>
      {question.text}
    </label>
    <InputContainer locked={questionsLocked}>
      {#if !questionsLocked}
        <input
          id="unaffiliated"
          type="checkbox"
          class="toggle toggle-primary mr-8"
          bind:checked={isChecked} />
      {:else}
        <input id="unaffiliated" disabled value="yes" class={inputClass} />
      {/if}
    </InputContainer>
  </Field>
  <p class={disclaimerClass} slot="footer">
    {$t('candidateApp.basicInfo.unaffiliatedDescription')}
  </p>
</FieldGroup>
