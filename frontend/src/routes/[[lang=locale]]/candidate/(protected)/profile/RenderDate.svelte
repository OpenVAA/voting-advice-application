<script lang="ts">
  import Field from '$lib/components/common/form/Field.svelte';
  import InputContainer from './InputContainer.svelte';

  export let question: QuestionProps;
  export let labelClass: string;
  export let inputClass: string;
  export let questionsLocked: boolean | undefined;

  const dateMin = '1800-01-01';
  const dateMax = new Date().toISOString().split('T')[0];

  // let selectedOption: Date;

  export let value: AnswePropsValue = '';

  //ensure that the date is in the correct format
  if (value && typeof value === 'string') {
    value = value.slice(0, 10);
  }
</script>

<Field>
  <label for="birthday" class={labelClass}>
    {question.text}
  </label>
  <InputContainer locked={questionsLocked}>
    <div class={inputClass}>
      <input
        disabled={questionsLocked}
        class="dark:bg-black"
        type="date"
        min={dateMin}
        max={dateMax}
        id="birthday"
        bind:value />
    </div>
  </InputContainer>
</Field>
