<!--@component
# Question Info Generation Page

Page for controlling the question info generation feature.
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

  let questionInfoJob: JobInfo | undefined;
  $: questionInfoJob = $activeJobsByFeature.get('QuestionInfoGeneration');

  ////////////////////////////////////////////////////////////////////////
  // Form state
  ////////////////////////////////////////////////////////////////////////

  let selectedOption = 'all';
  let selectedElectionId = '';
  let status: 'idle' | 'loading' | 'success' | 'error' | 'no-selections' | 'no-election' | 'no-operations' = 'idle';

  // Generate a unique ID for the radio group
  const radioGroupName = getUUID();

  // Options for the radio group
  const options = [
    {
      value: 'all',
      label: $t('adminApp.questionInfo.generate.allQuestions')
    },
    {
      value: 'selectedQuestions',
      label: $t('adminApp.questionInfo.generate.selectedQuestions')
    }
  ];

  let selectedQuestionIds: Array<string> = [];
  let availableQuestions: Array<AnyQuestionVariant> = [];
  let questionError: string | null = null;

  ////////////////////////////////////////////////////////////////////////
  // Generation options state
  ////////////////////////////////////////////////////////////////////////

  let selectedOperations: Array<'terms' | 'infoSections'> = ['terms', 'infoSections'];
  let sectionTopics = '';
  let customInstructions = '';
  let questionContext = '';

  ////////////////////////////////////////////////////////////////////////
  // Available questions
  ////////////////////////////////////////////////////////////////////////

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

  ////////////////////////////////////////////////////////////////////////
  // Form handlers
  ////////////////////////////////////////////////////////////////////////

  async function handleSubmit({ cancel }: Parameters<SubmitFunction>[0]) {
    status = 'loading';

    // Check if an election has been selected
    if (!selectedElectionId) {
      status = 'no-election';
      cancel();
      return;
    }

    // Check if any questions have been selected
    if (selectedOption === 'selectedQuestions' && selectedQuestionIds.length === 0) {
      status = 'no-selections';
      cancel();
      return;
    }

    // Check if at least one operation is selected
    if (selectedOperations.length === 0) {
      status = 'no-operations';
      cancel();
      return;
    }

    return async ({ result }: { result: ActionResult }) => {
      if (result.type === 'error') {
        status = 'error';
      } else if (result.type === 'failure') {
        status = 'error';
      } else if (result.type === 'success') {
        status = 'success';
      } else if (result.type === 'redirect') {
        status = 'success';
      }

      return { cancel: true };
    };
  }

  ////////////////////////////////////////////////////////////////////////
  // Aborting the job
  ////////////////////////////////////////////////////////////////////////

  async function handleAbortJob(jobId: string) {
    if (
      !confirm(
        t.get('adminApp.jobs.confirmAbortJob', {
          feature: t.get('adminApp.questionInfo.title')
        })
      )
    ) {
      return;
    }

    try {
      await abortJob({
        jobId,
        reason: 'Admin aborted this question info generation process'
      });
    } catch (error) {
      console.error('Error aborting job:', error);
      alert(t.get('adminApp.jobs.abortJobFailed'));
    }
  }
</script>

<MainContent title={$t('adminApp.questionInfo.title')}>
  <div class="flex flex-col items-center">
    <p class="mb-lg max-w-xl text-center">{$t('adminApp.questionInfo.description')}</p>

    <form method="POST" class="grid w-full max-w-xl gap-lg" use:enhance={handleSubmit}>
      <!-- Hidden input for operations -->
      <input type="hidden" name="operations" value={selectedOperations.join(',')} />
      <input type="hidden" name="sectionTopics" value={sectionTopics} />
      <input type="hidden" name="customInstructions" value={customInstructions} />
      <input type="hidden" name="questionContext" value={questionContext} />

      <!-- Election Selector -->
      <div class="form-control w-full">
        <label for="electionId" class="label">
          <span class="label-text">{$t('adminApp.questionInfo.selectElection')}</span>
        </label>
        <select id="electionId" name="electionId" class="select select-bordered w-full" bind:value={selectedElectionId}>
          <option value="" disabled selected>{$t('adminApp.questionInfo.selectElection')}</option>
          {#each $dataRoot.elections as election}
            <option value={election.id}>{election.name}</option>
          {/each}
        </select>
      </div>

      <!-- All vs Selected Radio -->
      {#if selectedElectionId}
        <div class="form-control">
          <label for={`${radioGroupName}-all`} class="label cursor-pointer justify-start space-x-8">
            <input
              type="radio"
              id={`${radioGroupName}-all`}
              name={radioGroupName}
              class="radio-primary radio"
              value="all"
              bind:group={selectedOption} />
            <span class="label-text">{options[0].label}</span>
          </label>
          <label for={`${radioGroupName}-selected`} class="label cursor-pointer justify-start space-x-8">
            <input
              type="radio"
              id={`${radioGroupName}-selected`}
              name={radioGroupName}
              class="radio-primary radio"
              value="selectedQuestions"
              bind:group={selectedOption} />
            <span class="label-text">{options[1].label}</span>
          </label>
        </div>

        <!-- Question Multi-Select -->
        {#if selectedOption === 'selectedQuestions' && selectedElectionId}
          {#if questionError}
            <div class="alert alert-error">
              <span>{questionError}</span>
            </div>
          {:else if availableQuestions.length > 0}
            <div class="max-h-64 form-control overflow-y-auto rounded-lg border border-base-300 p-md">
              <label class="label">
                <span class="font-semibold label-text">{$t('adminApp.questionInfo.selectQuestions')}</span>
              </label>
              {#each availableQuestions as question, i}
                <label class="flex items-start space-x-10 border-b border-base-200 pb-8 last:border-0">
                  <input
                    type="checkbox"
                    name="questionIds"
                    class="checkbox-primary checkbox"
                    value={question.id}
                    bind:group={selectedQuestionIds} />
                  <span class="label-text mt-2">{i + 1}: {question.name}</span>
                </label>
              {/each}
            </div>
          {:else}
            <p class="text-sm text-neutral">{$t('adminApp.questionInfo.noQuestions')}</p>
          {/if}
        {/if}
      {/if}

      <!-- Generation Options Section -->
      <div class="divider"></div>
      <h3 class="font-semibold text-lg">{$t('adminApp.questionInfo.options.heading')}</h3>

      <!-- Operations Checkboxes -->
      <div class="form-control">
        <label class="label">
          <span class="font-medium label-text">{$t('adminApp.questionInfo.options.whatToGenerate')}</span>
        </label>
        <label class="label cursor-pointer justify-start space-x-8">
          <input type="checkbox" class="checkbox-primary checkbox" value="terms" bind:group={selectedOperations} />
          <span class="label-text">{$t('adminApp.questionInfo.options.terms')}</span>
        </label>
        <label class="label cursor-pointer justify-start space-x-8">
          <input
            type="checkbox"
            class="checkbox-primary checkbox"
            value="infoSections"
            bind:group={selectedOperations} />
          <span class="label-text">{$t('adminApp.questionInfo.options.infoSections')}</span>
        </label>
      </div>

      <!-- Section Topics Input -->
      {#if selectedOperations.includes('infoSections')}
        <div class="form-control w-full">
          <label for="sectionTopics" class="label">
            <span class="label-text">{$t('adminApp.questionInfo.sectionTopics.label')}</span>
          </label>
          <input
            type="text"
            id="sectionTopics"
            class="input input-bordered w-full"
            placeholder={$t('adminApp.questionInfo.sectionTopics.placeholder')}
            bind:value={sectionTopics} />
          <label class="label">
            <span class="label-text-alt text-neutral">{$t('adminApp.questionInfo.sectionTopics.help')}</span>
          </label>
        </div>
      {/if}

      <!-- Custom Instructions Input -->
      <div class="form-control w-full">
        <label for="customInstructions" class="label">
          <span class="label-text">{$t('adminApp.questionInfo.customInstructions.label')}</span>
        </label>
        <textarea
          id="customInstructions"
          class="textarea textarea-bordered h-24 w-full"
          placeholder={$t('adminApp.questionInfo.customInstructions.placeholder')}
          bind:value={customInstructions}></textarea>
        <label class="label">
          <span class="label-text-alt text-neutral">{$t('adminApp.questionInfo.customInstructions.help')}</span>
        </label>
      </div>

      <!-- Question Context Input -->
      <div class="form-control w-full">
        <label for="questionContext" class="label">
          <span class="label-text">{$t('adminApp.questionInfo.questionContext.label')}</span>
        </label>
        <input
          type="text"
          id="questionContext"
          class="input input-bordered w-full"
          placeholder={$t('adminApp.questionInfo.questionContext.placeholder')}
          bind:value={questionContext} />
        <label class="label">
          <span class="label-text-alt text-neutral">{$t('adminApp.questionInfo.questionContext.help')}</span>
        </label>
      </div>

      <!-- Validation Error Messages -->
      {#if status === 'no-election'}
        <div class="alert alert-warning">
          <span>{$t('adminApp.questionInfo.validation.noElection')}</span>
        </div>
      {:else if status === 'no-selections'}
        <div class="alert alert-warning">
          <span>{$t('adminApp.questionInfo.validation.noQuestions')}</span>
        </div>
      {:else if status === 'no-operations'}
        <div class="alert alert-warning">
          <span>{$t('adminApp.questionInfo.validation.noOperations')}</span>
        </div>
      {/if}

      <!-- Submit Button -->
      <div class="flex flex-col items-center gap-sm">
        <Button
          text={status === 'loading'
            ? $t('adminApp.questionInfo.generate.buttonLoading')
            : $t('adminApp.questionInfo.generate.button')}
          type="submit"
          variant="main"
          loading={status === 'loading'}
          disabled={status === 'loading' ||
            !!questionInfoJob ||
            !selectedElectionId ||
            (selectedOption === 'selectedQuestions' && selectedQuestionIds.length === 0) ||
            selectedOperations.length === 0} />
        {#if !!questionInfoJob}
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
        feature={'QuestionInfoGeneration'}
        showFeatureLink={false}
        onAbortJob={handleAbortJob} />
    </div>
  </div>
</MainContent>
