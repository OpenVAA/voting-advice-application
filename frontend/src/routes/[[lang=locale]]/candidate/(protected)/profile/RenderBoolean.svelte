<script lang="ts">
  import Field from '$lib/components/common/form/Field.svelte';
  import FieldGroup from '$lib/components/common/form/FieldGroup.svelte';
  import {t} from '$lib/i18n';
  import InputContainer from './InputContainer.svelte';

  export let question: QuestionProps;
  export let labelClass: string;
  export let disclaimerClass: string;
  export let inputClass: string;
  export let questionsLocked: boolean | undefined;

  let selectedValue: boolean;
</script>

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
          bind:checked={selectedValue} />
      {:else}
        <input id="unaffiliated" disabled value="yes" class={inputClass} />
      {/if}
    </InputContainer>
  </Field>
  <p class={disclaimerClass} slot="footer">
    {$t('candidateApp.basicInfo.unaffiliatedDescription')}
  </p>
</FieldGroup>
