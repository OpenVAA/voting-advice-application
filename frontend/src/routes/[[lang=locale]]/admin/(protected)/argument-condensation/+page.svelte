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
  import type { AnyQuestionVariant } from '@openvaa/data';

  const { dataRoot, t } = getAdminContext();

  let selectedOption = 'all';
  let selectedElectionId = '';
  let status: 'idle' | 'loading' | 'success' | 'error' | 'no-selections' | 'no-election' = 'idle';

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
  let availableQuestions: Array<AnyQuestionVariant> = [];
  let questionError: string | null = null;

  $: {
    if (selectedElectionId) {
      try {
        const election = $dataRoot.getElection(selectedElectionId);
        availableQuestions = $dataRoot.findQuestions({ type: 'opinion', elections: election });
        questionError = null;
      } catch (error) {
        questionError = error instanceof Error ? error.message : 'Unknown error';
        availableQuestions = [];
      }
    } else {
      availableQuestions = [];
      questionError = null;
    }
  }

  function handleSubmit({ cancel }: Parameters<SubmitFunction>[0]) {
    status = 'loading';

    // Debug: Log what we're submitting
    console.log('Submitting form with:', {
      selectedElectionId,
      selectedOption,
      selectedIds
    });

    // Also log immediately before returning the enhance callback
    console.log('Submitting... returning enhance callback');

    // Check if an election has been selected
    if (!selectedElectionId) {
      status = 'no-election';
      cancel();
      return;
    }

    // Check if any questions have been selected
    if (selectedOption === 'selectedQuestions' && selectedIds.length === 0) {
      status = 'no-selections';
      cancel();
      return;
    }

    return async ({ result }: { result: ActionResult }) => {
      console.log('Action result:', result);
      if (result.type === 'error') {
        status = 'error';
      } else if (result.type === 'failure') {
        // SvelteKit returns `failure` for `fail(...)`; treat as error UX-wise
        console.error('Action failure:', (result as any)?.data);
        status = 'error';
      } else if (result.type === 'success') {
        status = 'success';
      } else if (result.type === 'redirect') {
        // Shouldn’t happen here, but log if it does
        console.log('Action redirected to:', (result as any)?.location);
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
      <!-- Election Selection -->
      <div class="w-full">
        <label for="election-select" class="label">
          <span class="label-text">{$t('adminApp.argumentCondensation.generate.selectElection')}</span>
        </label>
        <select
          id="election-select"
          name="electionId"
          class="select select-bordered w-full"
          bind:value={selectedElectionId}
          on:change={() => (selectedIds = [])}
          required>
          <option value="">{$t('adminApp.argumentCondensation.generate.selectElectionPlaceholder')}</option>
          {#each $dataRoot.elections as election}
            <option value={election.id}>{election.name}</option>
          {/each}
        </select>
      </div>

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
                  bind:group={selectedOption}
                  disabled={!selectedElectionId} />
                <span class="label-text">{option.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        {#if selectedOption === 'selectedQuestions' && selectedElectionId}
          {#if questionError}
            <div class="my-16 text-center text-error">
              Error loading questions: {questionError}
            </div>
          {:else if availableQuestions.length === 0}
            <div class="my-16 text-center text-neutral">
              {$t('adminApp.argumentCondensation.generate.noQuestionsForElection')}
            </div>
          {:else}
            <div class="my-16 flex w-full flex-col space-y-8">
              <label class="flex items-center space-x-10 border-b border-base-200 pb-8">
                <input
                  type="checkbox"
                  class="checkbox-primary checkbox"
                  checked={selectedIds.length === availableQuestions.length}
                  on:change={() => {
                    if (selectedIds.length === availableQuestions.length) {
                      selectedIds = [];
                    } else {
                      selectedIds = availableQuestions.map((question) => question.id);
                    }
                  }} />
                <span>{selectedIds.length === availableQuestions.length ? 'Unselect all' : 'Select all'}</span>
              </label>
              {#each availableQuestions as question, i}
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
        {/if}
      </div>

      {#if status === 'error'}
        <ErrorMessage inline message={$t('adminApp.argumentCondensation.generate.error')} class="mb-md" />
      {:else if status === 'no-election'}
        <ErrorMessage inline message={$t('adminApp.argumentCondensation.generate.noElectionSelected')} class="mb-md" />
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
          disabled={status === 'loading' || !selectedElectionId} />

        {#if status === 'loading'}
          <p class="text-sm text-neutral">{$t('adminApp.argumentCondensation.generate.mayTakeTime')}</p>
        {/if}
      </div>
    </form>
  </div>
</MainContent>
