<!--@component
# Argument Condensation Page

Page for controlling the argument condensation feature.
-->

<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { SuccessMessage } from '$lib/components/successMessage';
  import { getAdminContext } from '$lib/contexts/admin';
  import { getUUID } from '$lib/utils/components';
  import MainContent from '../../../MainContent.svelte';
  import type { ActionResult, SubmitFunction } from '@sveltejs/kit';

  const { dataRoot, t } = getAdminContext();

  let selectedOption = 'all';
  let status: 'idle' | 'loading' | 'success' | 'error' | 'no-selections' = 'idle';

  // Generate a unique ID for the radio group
  const radioGroupName = getUUID();

  // Options for the radio group
  const options = [
    {
      value: 'all',
      label: $t('adminApp.argumentCondensation.generate.allQuestions')
    },
    {
      value: 'selectedQuestions',
      label: $t('adminApp.argumentCondensation.generate.selectedQuestions')
    }
  ];

  let selectedIds: Array<string> = [];

  function handleSubmit({ cancel }: Parameters<SubmitFunction>[0]) {
    status = 'loading';

    if (selectedOption === 'selectedQuestions' && selectedIds.length === 0) {
      status = 'no-selections';
      cancel();
      return;
    }

    return async ({ result }: { result: ActionResult }) => {
      if (result.type === 'error') {
        status = 'error';
      } else {
        status = 'success';
      }

      // Always cancel the form action to prevent page reload
      return { cancel: true };
    };
  }
</script>

<MainContent title={$t('adminApp.argumentCondensation.title')}>
  <div class="flex flex-col items-center">
    <p class="mb-lg max-w-xl text-center">{$t('adminApp.argumentCondensation.description')}</p>

    <form method="POST" class="grid w-full max-w-xl gap-lg" use:enhance={handleSubmit}>
      <div class="flex flex-col items-center gap-md">
        <fieldset class="w-full">
          <legend class="sr-only">{$t('adminApp.argumentCondensation.generate.questionType')}</legend>
          <div class="flex flex-col gap-md">
            {#each options as option}
              <label class="label cursor-pointer justify-start gap-sm !p-0">
                <input
                  type="radio"
                  class="radio-primary radio"
                  name={radioGroupName}
                  value={option.value}
                  bind:group={selectedOption} />
                <span class="label-text">{option.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        {#if selectedOption === 'selectedQuestions'}
          <!-- TODO: Should first select an Election and filter questions by that -->
          {@const questions = $dataRoot.getQuestionsByType('opinion')}
          <div class="my-16 flex flex-col space-y-8">
            <label class="flex items-center space-x-10 border-b border-base-200 pb-8">
              <input
                type="checkbox"
                class="checkbox-primary checkbox"
                checked={selectedIds.length === questions.length}
                on:change={() => {
                  if (selectedIds.length === questions.length) {
                    selectedIds = [];
                  } else {
                    selectedIds = questions.map((question) => question.id);
                  }
                }} />
              <span>{selectedIds.length === questions.length ? 'Unselect all' : 'Select all'}</span>
            </label>
            {#each questions as question, i}
              <label class="flex items-start space-x-10 border-b border-base-200 pb-8 last:border-0">
                <input
                  type="checkbox"
                  name="questionIds"
                  class="checkbox-primary checkbox"
                  value={question.id}
                  bind:group={selectedIds} />
                <span class="label-text mt-2">{i + 1}: {question.name}</span>
              </label>
            {/each}
          </div>
        {/if}
      </div>

      {#if status === 'error'}
        <ErrorMessage inline message={$t('adminApp.argumentCondensation.generate.error')} class="mb-md" />
      {:else if status === 'no-selections'}
        <ErrorMessage inline message={$t('adminApp.argumentCondensation.generate.noQuestionSelected')} class="mb-md" />
      {:else if status === 'success'}
        <SuccessMessage inline message={$t('common.success')} class="mb-md" />
      {/if}

      <div class="flex flex-col items-center gap-sm">
        <Button
          text={status === 'loading'
            ? $t('adminApp.argumentCondensation.generate.buttonLoading')
            : $t('adminApp.argumentCondensation.generate.button')}
          type="submit"
          variant="main"
          loading={status === 'loading'}
          disabled={status === 'loading'} />

        {#if status === 'loading'}
          <p class="text-sm text-neutral">{$t('adminApp.argumentCondensation.generate.mayTakeTime')}</p>
        {/if}
      </div>
    </form>
  </div>
</MainContent>
