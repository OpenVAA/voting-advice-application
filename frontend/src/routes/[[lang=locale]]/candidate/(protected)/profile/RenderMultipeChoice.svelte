<script lang="ts">
  import Field from '$lib/components/common/form/Field.svelte';
  import Icon from '$lib/components/icon/Icon.svelte';
  import {t} from '$lib/i18n';
  import InputContainer from './InputContainer.svelte';

  export let question: QuestionProps;
  export let labelClass: string;
  export let selectClass: string;
  export let buttonContainerClass: string;
  export let iconClass: string;
  export let questionsLocked: boolean | undefined;

  const questionOptions = question.values;

  // html element for selecting html language
  let selectElement: HTMLSelectElement;

  let selectedValues = [];

  export let values: AnswePropsValue = Array<number>();

  let selectedOptions: Array<AnswerOption>;

  if (Array.isArray(values)) {
    selectedValues = values;
    selectedOptions = values.map((value) => {
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
      selectedValues = [...selectedValues, selected.key];
      selectElement.selectedIndex = 0;
    }
  };
</script>

<Field>
  <label for={question.id} class={labelClass}>
    {selectedOptions.length > 0
      ? $t('candidateApp.basicInfo.addAnother')
      : $t('candidateApp.basicInfo.selectFirst')}
  </label>
  <InputContainer locked={questionsLocked}>
    <select
      disabled={questionsLocked}
      bind:this={selectElement}
      id={question.id}
      data-testid={question.id}
      class={selectClass}
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
  <Field>
    <label for={option.label} class={labelClass}>
      {option.label}
    </label>
    <div class={buttonContainerClass}>
      {#if !questionsLocked}
        <button
          title="remove"
          type="button"
          id={option.label}
          on:click={() => {
            selectedOptions = selectedOptions?.filter((m) => m.key !== option.key);
            selectedValues = selectedValues.filter((v) => v !== option.key);
          }}>
          <Icon name="close" class={iconClass} />
        </button>
      {:else}
        <Icon name="locked" class={iconClass} />
      {/if}
    </div>
  </Field>
{/each}
