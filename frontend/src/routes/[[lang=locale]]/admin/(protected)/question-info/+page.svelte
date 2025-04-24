<!--@component
# Question Info Generation Page

Page for generating and managing question information
-->

<script lang="ts">
  import { enhance } from '$app/forms';
  import { getAppContext } from '$lib/contexts/app';
  import { Button } from '$lib/components/button';
  import MainContent from '../../../MainContent.svelte';
  import { getUUID } from '$lib/utils/components';

  const { t } = getAppContext();

  let selectedOption = 'all';
  let isGenerating = false;
  let error: string | null = null;

  // Generate a unique ID for the radio group
  const radioGroupName = getUUID();

  // Options for the radio group
  const options = [
    {
      id: 'all',
      label: $t('adminApp.questionInfo.generate.allQuestions')
    },
    {
      id: 'selected',
      label: $t('adminApp.questionInfo.generate.selectedQuestions')
    }
  ];

  const handleSubmit = () => {
    isGenerating = true;
    error = null;

    return async ({ result }: { result: { type: string } }) => {
      isGenerating = false;
      if (result.type === 'error') {
        error = $t('adminApp.questionInfo.generate.error');
      }
    };
  };
</script>

<MainContent title={$t('adminApp.questionInfo.title')}>
  <div class="flex flex-col items-center">
    <p class="mb-lg max-w-xl text-center">{$t('adminApp.questionInfo.pageDescription')}</p>

    <form method="POST" class="grid w-full max-w-xl gap-lg" use:enhance={handleSubmit}>
      <h2 class="font-medium">{$t('adminApp.questionInfo.generate.title')}</h2>

      <p class="mb-lg max-w-xl">{$t('adminApp.questionInfo.generate.description')}</p>

      <div class="flex flex-col items-center gap-md">
        <fieldset class="w-full">
          <legend class="sr-only">{$t('adminApp.questionInfo.generate.questionType')}</legend>
          <div class="flex flex-col gap-md">
            {#each options as option}
              <label class="label cursor-pointer justify-start gap-sm !p-0">
                <input
                  type="radio"
                  class="radio-primary radio"
                  name={radioGroupName}
                  value={option.id}
                  bind:group={selectedOption} />
                <span class="label-text">{option.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        {#if selectedOption === 'selected'}
          <Button text={$t('adminApp.questionInfo.generate.selectButton')} variant="normal" disabled={isGenerating} />
        {/if}
      </div>

      {#if error}
        <p class="text-sm text-error">{error}</p>
      {/if}

      <div class="flex flex-col items-center gap-sm">
        <Button
          text={isGenerating
            ? $t('adminApp.questionInfo.generate.buttonLoading')
            : $t('adminApp.questionInfo.generate.button')}
          type="submit"
          variant="main"
          disabled={isGenerating} />

        {#if isGenerating}
          <p class="text-sm text-neutral">{$t('adminApp.questionInfo.generate.mayTakeTime')}</p>
        {/if}
      </div>
    </form>

    <div class="mt-xl w-full max-w-xl">
      <h2 class="font-medium mb-lg">{$t('adminApp.questionInfo.edit.title')}</h2>
      <p class="mb-lg">
        {$t('adminApp.questionInfo.edit.description')}
      </p>

      <div class="flex flex-col gap-md">
        <Button text={$t('adminApp.questionInfo.edit.editButton')} variant="normal" icon="create" iconPos="left" />
        <Button
          text={$t('adminApp.questionInfo.edit.downloadButton')}
          variant="normal"
          icon="download"
          iconPos="left" />
        <Button text={$t('adminApp.questionInfo.edit.uploadButton')} variant="normal" icon="text" iconPos="left" />
      </div>
    </div>
  </div>
</MainContent>
