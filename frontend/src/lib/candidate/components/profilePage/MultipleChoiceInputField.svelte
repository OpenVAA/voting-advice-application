<script lang="ts">
  import Field from '$lib/components/common/form/Field.svelte';
  import FieldGroup from '$lib/components/common/form/FieldGroup.svelte';
  import Icon from '$lib/components/icon/Icon.svelte';
  import {t} from '$lib/i18n';
  import InputContainer from './InputContainer.svelte';

  export let question: QuestionProps;
  export let questionsLocked: boolean | undefined;
  export let selectedValues: AnswePropsValue = Array<number>();

  const questionOptions = question.values;

  // html element for selecting html language
  let selectElement: HTMLSelectElement;

  let selectedOptions: Array<AnswerOption>;

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
A component for rendering a multiple choice question.

### Bindable variables

- `selectedValues`: An array that contains the selected values.

### Properties

- `question`: The question object.
- `questionsLocked`: A boolean value that indicates if the questions are locked.

### Usage

```tsx
<MultipleChoiceInputField
  question={question}
  questionsLocked={questionsLocked}
  bind:selectedValues={selectedValues} />
```
-->

<FieldGroup>
  <p slot="header" class="small-label mx-6 my-0 p-0 uppercase">
    {question.text}
  </p>
  <Field
    id={question.id}
    label={selectedOptions.length > 0
      ? $t('candidateApp.basicInfo.addAnother')
      : $t('candidateApp.basicInfo.selectFirst')}>
    <InputContainer locked={questionsLocked}>
      <select
        disabled={questionsLocked}
        bind:this={selectElement}
        id={question.id}
        data-testid={question.id}
        class="select select-sm w-full text-right text-primary disabled:border-none disabled:bg-base-100"
        on:change={handleLanguageSelect}
        style="text-align-last: right; direction: rtl;">
        <option disabled selected value style="display: none;" />
        {#each question.values ?? [] as option}
          <option value={option.label}>{option.label}</option>
        {/each}
      </select>
    </InputContainer>
  </Field>
  {#each selectedOptions ?? [] as option}
    <Field id={option.label} label={option.label}>
      <div class="pr-6">
        {#if !questionsLocked}
          <button
            title="remove"
            type="button"
            id={option.label}
            on:click={() => {
              selectedOptions = selectedOptions?.filter((m) => m.key !== option.key);
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
