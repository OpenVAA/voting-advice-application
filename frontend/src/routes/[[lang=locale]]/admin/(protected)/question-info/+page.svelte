<!--@component
# Question Info Generation Page

Page for generating and managing question information
-->

<script lang="ts">
  import { enhance } from '$app/forms';
  import { getAppContext } from '$lib/contexts/app';
  import { Button } from '$lib/components/button';
  import { QuestionChoices } from '$lib/components/questions';
  import { SingleChoiceCategoricalQuestion, DataRoot } from '@openvaa/data';
  import { onMount } from 'svelte';
  import MainContent from '../../../MainContent.svelte';

  const { t, locale } = getAppContext();

  let selectedOption = 'all';
  let isGenerating = false;
  let error: string | null = null;
  let ready = false;

  const dataRoot = new DataRoot({ locale: locale.get() });

  const question = new SingleChoiceCategoricalQuestion({
    data: {
      id: 'question-type',
      name: $t('adminApp.questionInfo.generate.questionType'),
      type: 'singleChoiceCategorical',
      categoryId: 'question-info',
      choices: [
        {
          id: 'all',
          label: $t('adminApp.questionInfo.generate.allQuestions')
        },
        {
          id: 'selected',
          label: $t('adminApp.questionInfo.generate.selectedQuestions')
        }
      ]
    },
    root: dataRoot
  });

  onMount(() => {
    // Wait for the next tick to ensure all data is loaded
    setTimeout(() => {
      ready = true;
    }, 0);
  });

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

{#if !ready}
  <div class="flex h-screen items-center justify-center">
    <div class="loading loading-spinner loading-lg"></div>
  </div>
{:else}
  <MainContent title={$t('adminApp.questionInfo.title')}>
    <div class="flex flex-col items-center">
      <p class="mb-lg max-w-xl text-center">{$t('adminApp.questionInfo.pageDescription')}</p>

      <form method="POST" class="grid w-full max-w-xl gap-lg" use:enhance={handleSubmit}>
        <h2 class="font-medium">{$t('adminApp.questionInfo.generate.title')}</h2>

        <p class="mb-lg max-w-xl">{$t('adminApp.questionInfo.generate.description')}</p>

        <div class="flex flex-col items-center gap-md">
          <QuestionChoices
            {question}
            selectedId={selectedOption}
            onChange={({ value }) => (selectedOption = value ?? 'all')}
            showLine={false}
            variant="vertical" />

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
{/if}
