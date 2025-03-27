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
      name: 'Select questions to generate info for',
      type: 'singleChoiceCategorical',
      categoryId: 'question-info',
      choices: [
        { id: 'all', label: 'All questions' },
        { id: 'selected', label: 'Selected questions' }
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
        error = 'Failed to generate info';
      }
    };
  };
</script>

{#if !ready}
  <div class="flex h-screen items-center justify-center">
    <div class="loading loading-spinner loading-lg"></div>
  </div>
{:else}
  <MainContent title="Question info generation">
    <div class="flex flex-col items-center">
      <p class="mb-lg max-w-xl text-center">Generate or edit the background information for questions.</p>

      <form method="POST" class="grid w-full max-w-xl gap-lg" use:enhance={handleSubmit}>
        <h2 class="font-medium">Generate info</h2>

        <p class="mb-lg max-w-xl">Generate the information overwriting any infos generated earlier.</p>

        <div class="flex flex-col items-center gap-md">
          <QuestionChoices
            {question}
            selectedId={selectedOption}
            onChange={({ value }) => (selectedOption = value ?? 'all')}
            showLine={false}
            variant="vertical" />

          {#if selectedOption === 'selected'}
            <Button text="Select..." variant="normal" disabled={isGenerating} />
          {/if}
        </div>

        {#if error}
          <p class="text-sm text-error">{error}</p>
        {/if}

        <div class="flex flex-col items-center gap-sm">
          <Button
            text={isGenerating ? 'Generating infos...' : 'Generate infos'}
            type="submit"
            variant="main"
            disabled={isGenerating} />

          {#if isGenerating}
            <p class="text-sm text-neutral">This may take some time.</p>
          {/if}
        </div>
      </form>

      <div class="mt-xl w-full max-w-xl">
        <h2 class="font-medium mb-lg">Edit infos</h2>
        <p class="mb-lg">
          Edit the existing information. You can either edit it directly using a JSON editor or download it as CSV and
          then upload the edited information.
        </p>

        <div class="flex flex-col gap-md">
          <Button text="Edit the information" variant="normal" icon="create" iconPos="left" />
          <Button text="Download the information as CSV" variant="normal" icon="download" iconPos="left" />
          <Button text="Upload the information you have edited as CSV" variant="normal" icon="text" iconPos="left" />
        </div>
      </div>
    </div>
  </MainContent>
{/if}
