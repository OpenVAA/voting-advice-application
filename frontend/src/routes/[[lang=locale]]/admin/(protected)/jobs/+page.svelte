<!--@component
# Admin Jobs Monitoring Page

Page for monitoring all active jobs across different admin features
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import InfoMessages from '$lib/components/logger/InfoMessages.svelte';
  import ProgressBar from '$lib/components/logger/ProgressBar.svelte';
  import WarningMessages from '$lib/components/logger/WarningMessages.svelte';
  import { getAppContext } from '$lib/contexts/app';
  import MainContent from '../../../MainContent.svelte';
  import { onMount, onDestroy } from 'svelte';
  import type { JobInfo } from '$lib/jobs/jobStore';

  const { t, getRoute } = getAppContext();

  // Job data for each feature
  let argumentCondensationJob: JobInfo | null = null;
  let factorAnalysisJob: JobInfo | null = null;
  let questionInfoJob: JobInfo | null = null;

  // Polling interval
  let pollInterval: ReturnType<typeof setInterval>;

  // Fetch jobs from API
  async function fetchJobs() {
    try {
      const response = await fetch('/api/admin/jobs');
      if (response.ok) {
        const jobs: JobInfo[] = await response.json();

        // Find the first active job for each feature
        argumentCondensationJob =
          jobs.find((job) => job.feature === 'argument-condensation' && job.status === 'running') || null;
        factorAnalysisJob = jobs.find((job) => job.feature === 'factor-analysis' && job.status === 'running') || null;
        questionInfoJob = jobs.find((job) => job.feature === 'question-info' && job.status === 'running') || null;
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  }

  // Start polling
  function startPolling() {
    // Fetch immediately
    fetchJobs();

    // Then poll every 2 seconds
    pollInterval = setInterval(fetchJobs, 2000);
  }

  // Stop polling
  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
  }

  onMount(() => {
    startPolling();
  });

  onDestroy(() => {
    stopPolling();
  });
</script>

<MainContent title="Jobs Monitoring" contentClass="max-w-none">
  <div class="mb-lg flex flex-col items-center gap-4">
    <p class="text-center">Monitor all active jobs across admin features</p>
  </div>

  <div class="flex w-full flex-col gap-lg px-4">
    <!-- Argument Condensation Box -->
    <div class="card mx-auto w-full max-w-none bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-primary">Argument Condensation</h2>

        {#if !argumentCondensationJob}
          <!-- No Active Jobs Section -->
          <div class="space-y-4">
            <div class="text-center">
              <p class="mb-4 text-sm text-neutral">No active jobs</p>
              <p class="text-xs text-neutral">Start an argument condensation process to see real-time monitoring</p>
            </div>

            <!-- Info Messages Box -->
            <InfoMessages messages={[]} maxMessages={8} height="max-h-32" />

            <!-- Warning Messages Box -->
            <WarningMessages warnings={[]} errors={[]} height="max-h-32" />
          </div>
        {:else}
          <!-- Active Job Monitoring Section -->
          <div class="space-y-4">
            <!-- Progress Bar -->
            <ProgressBar progress={argumentCondensationJob.progress} color="primary" size="md" />

            <!-- Info Messages -->
            <InfoMessages messages={argumentCondensationJob.infoMessages} maxMessages={5} height="max-h-96" />

            <!-- Warning Messages -->
            <WarningMessages
              warnings={argumentCondensationJob.warningMessages}
              errors={argumentCondensationJob.errorMessages}
              maxMessages={1000}
              height="max-h-96" />
          </div>
        {/if}

        <!-- Navigation Button Section -->
        <div class="mt-4 border-t border-base-300 pt-4">
          <Button
            href={$getRoute('AdminAppArgumentCondensation')}
            text="Go to Argument Condensation"
            variant="secondary"
            class="w-full"
            icon="create"
            iconPos="left" />
        </div>
      </div>
    </div>

    <!-- Factor Analysis Box -->
    <div class="card mx-auto w-full max-w-none bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-secondary">Factor Analysis</h2>

        {#if !factorAnalysisJob}
          <!-- No Active Jobs Section -->
          <div class="space-y-4">
            <div class="text-center">
              <p class="mb-4 text-sm text-neutral">No active jobs</p>
              <p class="text-xs text-neutral">Start a factor analysis process to see real-time monitoring</p>
            </div>

            <!-- Info Messages Box -->
            <div class="p-3 rounded-lg bg-base-200">
              <h3 class="font-semibold mb-2 text-sm text-info">Info Messages</h3>
              <div class="py-4 text-center text-xs text-neutral">No info messages</div>
            </div>

            <!-- Warning Messages Box -->
            <div class="p-3 rounded-lg bg-base-200">
              <h3 class="font-semibold mb-2 text-sm text-warning">Warnings & Errors</h3>
              <div class="py-4 text-center text-xs text-neutral">No warnings or errors</div>
            </div>
          </div>
        {:else}
          <!-- Active Job Monitoring Section -->
          <div class="space-y-4">
            <!-- Progress Bar -->
            <ProgressBar progress={factorAnalysisJob.progress} color="secondary" size="md" />

            <!-- Info Messages -->
            <InfoMessages messages={factorAnalysisJob.infoMessages} maxMessages={5} height="max-h-96" />

            <!-- Warning Messages -->
            <WarningMessages
              warnings={factorAnalysisJob.warningMessages}
              errors={factorAnalysisJob.errorMessages}
              maxMessages={1000}
              height="max-h-96" />
          </div>
        {/if}

        <!-- Navigation Button Section -->
        <div class="mt-4 border-t border-base-300 pt-4">
          <Button
            href={$getRoute('AdminAppFactorAnalysis')}
            text="Go to Factor Analysis"
            variant="secondary"
            class="w-full"
            icon="create"
            iconPos="left"
            disabled />
        </div>
      </div>
    </div>

    <!-- Question Info Box -->
    <div class="card mx-auto w-full max-w-none bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-accent">Question Info</h2>

        {#if !questionInfoJob}
          <!-- No Active Jobs Section -->
          <div class="space-y-4">
            <div class="text-center">
              <p class="mb-4 text-sm text-neutral">No active jobs</p>
              <p class="text-xs text-neutral">Start a question info process to see real-time monitoring</p>
            </div>

            <!-- Info Messages Box -->
            <div class="p-3 rounded-lg bg-base-200">
              <h3 class="font-semibold mb-2 text-sm text-info">Info Messages</h3>
              <div class="py-4 text-center text-xs text-neutral">No info messages</div>
            </div>

            <!-- Warning Messages Box -->
            <div class="p-3 rounded-lg bg-base-200">
              <h3 class="font-semibold mb-2 text-sm text-warning">Warnings & Errors</h3>
              <div class="py-4 text-center text-xs text-neutral">No warnings or errors</div>
            </div>
          </div>
        {:else}
          <!-- Active Job Monitoring Section -->
          <div class="space-y-4">
            <!-- Progress Bar -->
            <ProgressBar progress={questionInfoJob.progress} color="accent" size="md" />

            <!-- Info Messages -->
            <InfoMessages messages={questionInfoJob.infoMessages} maxMessages={5} height="max-h-96" />

            <!-- Warning Messages -->
            <WarningMessages
              warnings={questionInfoJob.warningMessages}
              errors={questionInfoJob.errorMessages}
              maxMessages={1000}
              height="max-h-96" />
          </div>
        {/if}

        <!-- Navigation Button Section -->
        <div class="mt-4 border-t border-base-300 pt-4">
          <Button
            href={$getRoute('AdminAppQuestionInfo')}
            text="Go to Question Info"
            variant="secondary"
            class="w-full"
            icon="create"
            iconPos="left"
            disabled />
        </div>
      </div>
    </div>
  </div>
</MainContent>
