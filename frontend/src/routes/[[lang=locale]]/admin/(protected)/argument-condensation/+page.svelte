<!--@component
# Argument Condensation Page

Page for controlling the argument condensation feature.
-->

<script lang="ts">
  import { enhance } from '$app/forms';
  import { FeatureJobs } from '$lib/admin/components/jobs';
  import { Button } from '$lib/components/button';
  import { getAdminContext } from '$lib/contexts/admin';
  import { getUUID } from '$lib/utils/components';
  import MainContent from '../../../MainContent.svelte';
  import type { AnyQuestionVariant } from '@openvaa/data';
  import type { ActionResult, SubmitFunction } from '@sveltejs/kit';
  import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';

  ////////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////////

  const {
    dataRoot,
    t,
    abortJob,
    jobs: { activeJobsByFeature }
  } = getAdminContext();

  ////////////////////////////////////////////////////////////////////////
  // Get active job
  ////////////////////////////////////////////////////////////////////////

  let argumentCondensationJob: JobInfo | undefined;
  $: argumentCondensationJob = $activeJobsByFeature.get('ArgumentCondensation');

  ////////////////////////////////////////////////////////////////////////
  // Starting the job
  ////////////////////////////////////////////////////////////////////////

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

  async function handleSubmit({ cancel }: Parameters<SubmitFunction>[0]) {
    status = 'loading';

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

    // The form will submit to the server action which will:
    // 1. Create a job for tracking progress
    // 2. Run the actual argument condensation
    // 3. Update job progress and messages in real-time
    return async ({ result }: { result: ActionResult }) => {
      if (result.type === 'error') {
        status = 'error';
      } else if (result.type === 'failure') {
        // SvelteKit returns `failure` for `fail(...)`; treat as error UX-wise
        status = 'error';
      } else if (result.type === 'success') {
        status = 'success';
      } else if (result.type === 'redirect') {
        // Shouldn't happen here, but log if it does
        status = 'success';
      }

      // Always cancel the form action to prevent page reload
      return { cancel: true };
    };
  }

  ////////////////////////////////////////////////////////////////////////
  // Aborting the job
  ////////////////////////////////////////////////////////////////////////

  // Handle kill job for argument condensation. TODO: start using a utility that is not arg-cond specific
  async function handleAbortJob(jobId: string) {
    if (
      !confirm(
        t.get('adminApp.jobs.confirmAbortJob', {
          feature: t.get('adminApp.argumentCondensation.title')
        })
      )
    ) {
      return;
    }

    try {
      await abortJob({
        jobId,
        reason: 'Admin aborted this argument condensation process'
      });
    } catch (error) {
      console.error('Error aborting job:', error);
      alert(t.get('adminApp.jobs.abortJobFailed'));
    }
  }
</script>

<MainContent title={$t('adminApp.argumentCondensation.title')}>
  <div class="flex flex-col items-center">
    <p class="mb-lg max-w-xl text-center">{$t('adminApp.argumentCondensation.description')}</p>

    <form method="POST" class="grid w-full max-w-xl gap-lg" use:enhance={handleSubmit}>
      {#if status !== 'loading' && !argumentCondensationJob}
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
                {$t('adminApp.argumentCondensation.generate.errorLoadingQuestions', { error: questionError })}
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
                  <span
                    >{selectedIds.length === availableQuestions.length
                      ? $t('adminApp.argumentCondensation.generate.unselectAll')
                      : $t('adminApp.argumentCondensation.generate.selectAll')}</span>
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
      {/if}

      <div class="flex flex-col items-center gap-sm">
        <Button
          text={status === 'loading'
            ? $t('adminApp.argumentCondensation.generate.buttonLoading')
            : $t('adminApp.argumentCondensation.generate.button')}
          type="submit"
          variant="main"
          loading={status === 'loading'}
          disabled={status === 'loading' ||
            !!argumentCondensationJob ||
            !selectedElectionId ||
            (selectedOption === 'selectedQuestions' && selectedIds.length === 0)} />
        {#if !!argumentCondensationJob}
          <p class="mt-1 text-xs text-neutral">{$t('adminApp.jobs.alreadyRunning')}</p>
        {/if}
      </div>
    </form>
  </div>

  <!-- Both active and past jobs -->
  <div slot="fullWidth" class="mt-8 w-full">
    <div class="mx-auto max-w-4xl px-4">
      <FeatureJobs
        class="w-full"
        feature={'ArgumentCondensation'}
        showFeatureLink={false}
        onAbortJob={handleAbortJob} />
    </div>
  </div>
</MainContent>
