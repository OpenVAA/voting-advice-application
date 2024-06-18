<script lang="ts">
  import Field from '$lib/components/common/form/Field.svelte';
  import InputContainer from './InputContainer.svelte';

  export let question: QuestionProps;
  export let labelClass: string;
  export let selectClass: string;
  export let questionsLocked: boolean | undefined;

  let selectedValue: AnswerOption;
</script>

<Field>
  <label for={question.id} class={labelClass}>
    {question.text}
  </label>
  <InputContainer locked={questionsLocked}>
    <select
      disabled={questionsLocked}
      id={question.id}
      class={selectClass}
      bind:value={selectedValue}
      style="text-align-last: right; direction: rtl;">
      {#each question.values ?? [] as option}
        <option value={option.label}>{option.label}</option>
      {/each}
    </select>
  </InputContainer>
</Field>
