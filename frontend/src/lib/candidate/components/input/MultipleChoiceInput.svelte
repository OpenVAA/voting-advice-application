<script lang="ts">
  import {Field, FieldGroup} from '$lib/components/common/form';
  import Icon from '$lib/components/icon/Icon.svelte';
  import {t} from '$lib/i18n';
  import InputContainer from './InputContainer.svelte';
  import type {InputFieldProps} from './InputField.type';

  type $$Props = InputFieldProps<number[]>;

  export let question: $$Props['question'];
  export let footerText: $$Props['footerText'] = '';
  export let headerText: $$Props['headerText'] = question.text;
  export let locked: $$Props['locked'] = false;
  export let selectedValues: $$Props['value'] = Array<number>();

  // html element for selecting html language
  let selectElement: HTMLSelectElement;

  let selectedOptions = Array<AnswerOption>();

  const questionOptions = question.values;

  if (!questionOptions || questionOptions.length === 0) {
    throw new Error(
      `Could not find options for question with id '${'id' in question ? question.id : 'n/a'}'`
    );
  }

  if (Array.isArray(selectedValues)) {
    selectedOptions = selectedValues.map((value) => {
      return {
        key: Number(value),
        label: questionOptions?.find((q) => q.key === value)?.label ?? ''
      };
    });
  }

  // handle the change when a language is selected
  const handleLanguageSelect = (e: Event) => {
    const selected = questionOptions
      ? questionOptions.find((q) => q.label === (e.target as HTMLSelectElement).value)
      : undefined;
    if (selected && questionOptions) {
      selectedOptions = [...selectedOptions, selected];
      selectedValues = selectedOptions.map((option) => option.key);
      selectElement.selectedIndex = 0;
    }
  };
</script>

<!--
@component
A component for a multiple choice question that can be answered.

### Bindable variables

- `selectedValues`: An array that contains the selected values.

### Properties

- `question`: The question object.
- `headerText`: The header text. Defaults to the question's text. Optional.
- `footerText`: The footer text. Defaults to empty string. Optional.
- `questionsLocked`: A boolean value that indicates if the questions are locked.

### Usage

```tsx
<MultipleChoiceInput
  question={question}
  questionsLocked={questionsLocked}
  bind:selectedValues={selectedValues} />
```
-->

<FieldGroup>
  <p slot="header" class="small-label mx-6 my-0 p-0">
    {headerText}
  </p>
  <Field
    id={question.id}
    label={selectedOptions.length > 0
      ? $t('candidateApp.basicInfo.addAnother')
      : $t('candidateApp.basicInfo.selectFirst')}>
    <InputContainer {locked}>
      <select
        disabled={locked}
        bind:this={selectElement}
        id={question.id}
        data-testid={question.id}
        class="select select-sm w-full text-right text-primary disabled:border-none disabled:bg-base-100"
        on:change={handleLanguageSelect}
        style="text-align-last: right; direction: rtl;">
        <option disabled selected value style="display: none;" />
        {#each questionOptions ?? [] as option}
          <option value={option.label}>{option.label}</option>
        {/each}
      </select>
    </InputContainer>
  </Field>
  {#each selectedOptions as option}
    <Field id={option.label} label={option.label}>
      <div class="pr-6">
        {#if !locked}
          <button
            title="remove"
            type="button"
            id={option.label}
            on:click={() => {
              selectedOptions = selectedOptions.filter((m) => m.key !== option.key);
              selectedValues = selectedOptions.map((option) => option.key);
            }}>
            <Icon name="close" class="my-auto flex-shrink-0 text-secondary" />
          </button>
        {:else}
          <Icon name="locked" class="my-auto flex-shrink-0 text-secondary" />
        {/if}
      </div>
    </Field>
  {/each}
</FieldGroup>
