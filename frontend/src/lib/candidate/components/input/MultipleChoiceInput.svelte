<script lang="ts">
  import { Field, FieldGroup } from '$lib/components/common/form';
  import Icon from '$lib/components/icon/Icon.svelte';
  import { t } from '$lib/i18n';
  import InputContainer from './InputContainer.svelte';
  import type { InputFieldProps } from './InputField.type';

  type $$Props = InputFieldProps<Array<number>>;

  export let questionId: $$Props['questionId'];
  export let options: $$Props['options'] = Array<LegacyAnswerOption>();
  export let headerText: $$Props['headerText'] = '';
  export let locked: $$Props['locked'] = false;
  export let value: $$Props['value'] = [];
  export let onChange: $$Props['onChange'] = undefined;

  $: selectableOptions = options?.filter((option) => !value?.includes(option.key));
  // html element for selecting html language
  let selectElement: HTMLSelectElement;

  let selectedOptions = Array<LegacyAnswerOption>();

  if (!options || options.length === 0) {
    throw new Error(`Could not find options for question with id '${questionId ? questionId : 'n/a'}'`);
  }

  if (Array.isArray(value)) {
    selectedOptions = value.map((val) => {
      return {
        key: Number(val),
        label: options?.find((q) => q.key === val)?.label ?? ''
      };
    });
  }

  // handle the change when a language is selected
  function onLanguageSelect(e: Event) {
    const selected = options
      ? options.find((q) => q.label === (e.currentTarget as HTMLSelectElement).value)
      : undefined;
    if (selected && options) {
      selectedOptions = [...selectedOptions, selected];
      value = selectedOptions.map((option) => option.key);
      selectElement.selectedIndex = 0;
      onChange?.({ questionId, value });
    }
  }
</script>

<!--
@component
A component for a multiple choice question that can be answered.

### Properties

- `question`: The question object.
- `headerText`: The header text. Defaults to the question's text. Optional.
- `footerText`: The footer text. Defaults to empty string. Optional.
- `locked`: A boolean value that indicates if the questions are locked.
- `value`: An array that contains the selected values.
- `onChange`: A function that is called when the value changes.

### Usage

```tsx
<MultipleChoiceInput
  question={question}
  locked={locked}
  values={selectedValues}
  onChange={onChange} />
```
-->

<FieldGroup>
  <p slot="header" class="small-label mx-6 my-0 p-0">
    {headerText}
  </p>
  <Field
    id={questionId}
    label={selectedOptions.length > 0 ? $t('candidateApp.basicInfo.addAnother') : $t('common.selectFirst')}>
    <InputContainer {locked}>
      <select
        disabled={locked}
        bind:this={selectElement}
        id={questionId}
        class="select select-sm w-full !bg-base-100 text-right text-primary disabled:border-none"
        on:change={onLanguageSelect}
        style="text-align-last: right; direction: rtl;">
        <option disabled selected value style="display: none;" />
        {#each selectableOptions ?? [] as option}
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
              value = selectedOptions.map((option) => option.key);
              onChange?.({ questionId, value });
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
