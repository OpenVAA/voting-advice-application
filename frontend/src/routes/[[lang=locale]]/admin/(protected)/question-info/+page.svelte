<!--@component
# Question Info Generation Page

Page for generating and managing question information
-->

<script lang="ts">
  import { enhance } from '$app/forms';
  import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { SuccessMessage } from '$lib/components/successMessage';
  import { getAppContext } from '$lib/contexts/app';
  import { getUUID } from '$lib/utils/components';
  import type { SubmitFunction } from '@sveltejs/kit';
  import MainContent from '../../../MainContent.svelte';

  const { t } = getAppContext();

  let selectedOption = 'all';
  let status: 'idle' | 'loading' | 'success' | 'error' | 'no-selections' = 'idle';

  // Generate a unique ID for the radio group
  const radioGroupName = getUUID();

  // Options for the radio group
  const options = [
    {
      id: 'all',
      value: 'all',
      label: $t('adminApp.questionInfo.generate.allQuestions')
    },
    {
      id: 'selectedQuestions',
      value: 'selectedQuestions',
      label: $t('adminApp.questionInfo.generate.selectedQuestions')
    }
  ];

  let selectedIds: Array<string> = [];

  $: questions = getQuestions();

  async function getQuestions() {
    const dp = await dataProviderPromise;
    return dp.getQuestionData().then((d) => d.questions);
  }

  const handleSubmit: SubmitFunction = ({ cancel }) => {
    status = 'loading';

    if (selectedOption === 'selectedQuestions' && selectedIds.length === 0) {
      status = 'no-selections';
      cancel();
      return;
    }

    return async ({ result }) => {
      if (result.type === 'error') {
        status = 'error';
      } else {
        status = 'success';
      }

      // Always cancel the form action to prevent page reload
      return { cancel: true };
    };
  };
</script>

<MainContent title={$t('adminApp.questionInfo.title')}>
  <div class="flex flex-col items-center">
    <p class="mb-lg max-w-xl text-center">{$t('adminApp.questionInfo.pageDescription')}</p>

    <form method="POST" class="grid w-full max-w-xl gap-lg" use:enhance={handleSubmit}>
      <h2>{$t('adminApp.questionInfo.generate.title')}</h2>

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
                  value={option.value}
                  bind:group={selectedOption} />
                <span class="label-text">{option.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        {#if selectedOption === 'selectedQuestions'}
          <!-- <Button text={$t('adminApp.questionInfo.generate.selectButton')} variant="normal" disabled={status === 'loading'} /> -->
          {#await questions then questions}
            <div class="flex flex-col space-y-2">
              <label class="flex items-center">
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
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    name="questionIds"
                    class="checkbox-primary checkbox"
                    value={question.id}
                    bind:group={selectedIds} />
                  <span class="label-text">{i}: {question.name}</span>
                </label>
              {/each}
            </div>
          {/await}
        {/if}
      </div>

      {#if status === 'error'}
        <ErrorMessage inline message={$t('adminApp.questionInfo.generate.error')} class="mb-md" />
      {:else if status === 'no-selections'}
        <ErrorMessage inline message={$t('adminApp.questionInfo.generate.noQuestionSelected')} class="mb-md" />
      {:else if status === 'success'}
        <SuccessMessage inline message={$t('common.success')} class="mb-md" />
      {/if}

      <div class="flex flex-col items-center gap-sm">
        <Button
          text={status === 'loading'
            ? $t('adminApp.questionInfo.generate.buttonLoading')
            : $t('adminApp.questionInfo.generate.button')}
          type="submit"
          variant="main"
          loading={status === 'loading'}
          disabled={status === 'loading'} />

        {#if status === 'loading'}
          <p class="text-sm text-neutral">{$t('adminApp.questionInfo.generate.mayTakeTime')}</p>
        {/if}
      </div>
    </form>

    <div class="mt-xl w-full max-w-xl">
      <h2>{$t('adminApp.questionInfo.edit.title')}</h2>
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
