<script lang="ts">
  import Field from '$lib/components/common/form/Field.svelte';
  import InputContainer from './InputContainer.svelte';

  export let question: QuestionProps;
  export let labelClass: string;
  export let selectClass: string;
  export let questionsLocked: boolean | undefined;
  export let value: AnswePropsValue;
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
      bind:value
      style="text-align-last: right; direction: rtl;">
      <option disabled selected value style="display: none;" />
      {#each question.values ?? [] as option}
        <option value={option.key}>{option.label}</option>
      {/each}
    </select>
  </InputContainer>
</Field>
