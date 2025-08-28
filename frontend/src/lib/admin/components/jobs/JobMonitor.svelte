<!--@component
# Job Monitor Component

Reusable component for monitoring a single feature's job status.
Handles all states: no job, active job, completed job.
Includes embedded kill switch functionality.
Can optionally display feature-specific past jobs.
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import InfoMessages from '$lib/components/logger/InfoMessages.svelte';
  import ProgressBar from '$lib/components/logger/ProgressBar.svelte';
  import WarningMessages from '$lib/components/logger/WarningMessages.svelte';
  import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';

  export let jobType: string; // e.g., 'argument-condensation'
  export let activeJob: JobInfo | null; // Current active job or null
  export let onKillJob: (jobId: string) => void; // Required callback when kill switch clicked
  export let maxMessages = 8;
  export let height = 'max-h-64';
  export let pastJobs: JobInfo[] = []; // Optional: feature-specific past jobs
  export let showPastJobs = true; // Optional: whether to show past jobs section
  export let featureLink: string | null = null; // Optional: link to the feature page

  // Handle kill switch click
  function handleKillJob() {
    if (activeJob) {
      onKillJob(activeJob.id);
    }
  }

  // Format job duration
  function formatJobDuration(job: JobInfo): string {
    if (!job.endTime) return 'N/A';
    const duration = new Date(job.endTime).getTime() - new Date(job.startTime).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  // Filter past jobs to show only this feature's jobs
  $: featurePastJobs = pastJobs.filter((job) => job.feature === jobType);
</script>

<div class="card w-full bg-base-100 shadow-xl">
  <div class="card-body">
    <div class="flex items-center justify-between">
      <h2 class="card-title capitalize text-primary">{jobType.replace('-', ' ')}</h2>
      <div class="flex items-center gap-2">
        {#if featureLink}
          <Button text="Go to Feature" variant="secondary" href={featureLink} icon="create" iconPos="right" />
        {/if}
        {#if activeJob}
          <Button text="Force Fail" variant="secondary" on:click={handleKillJob} />
        {/if}
      </div>
    </div>

    {#if !activeJob}
      <!-- No Active Jobs Section -->
      <div class="space-y-4">
        <div class="text-center">
          <p class="mb-4 text-sm text-neutral">No active jobs</p>
          <p class="text-xs text-neutral">Start a {jobType} process to see real-time monitoring</p>
        </div>
      </div>
    {:else}
      <!-- Active Job Monitoring Section -->
      <div class="space-y-4">
        <!-- Progress Bar -->
        <ProgressBar progress={activeJob.progress} color="primary" size="md" />

        <!-- Info Messages -->
        <InfoMessages messages={activeJob.infoMessages} {maxMessages} {height} showTimestamp={true} />

        <!-- Warning Messages -->
        <WarningMessages
          warnings={activeJob.warningMessages}
          errors={activeJob.errorMessages}
          maxMessages={1000}
          {height}
          showTimestamp={true} />
      </div>
    {/if}

    <!-- Past Jobs Section (Optional) -->
    {#if showPastJobs && featurePastJobs.length > 0}
      <div class="mt-6 border-t border-base-300 pt-4">
        <h3 class="mb-3 font-semibold text-lg text-base-content">Past Jobs</h3>
        <div class="max-h-64 space-y-3 overflow-y-auto">
          {#each featurePastJobs.slice(0, 10).reverse() as job}
            <div class="p-3 rounded-lg border border-base-300 transition-colors hover:bg-base-200">
              <div class="mb-2 flex items-start justify-between">
                <div class="flex-1">
                  <div class="font-semibold text-sm capitalize">{job.feature.replace('-', ' ')}</div>
                  <p class="text-xs text-neutral">{job.author}</p>
                </div>
                <div class="text-right">
                  <span class="badge badge-sm {job.status === 'completed' ? 'badge-success' : 'badge-error'}">
                    {job.status}
                  </span>
                </div>
              </div>

              <div class="space-y-1 text-xs text-neutral">
                <div>Started: {job.startTime.toLocaleString()}</div>
                {#if job.endTime}
                  <div>Duration: {formatJobDuration(job)}</div>
                {/if}
                <div>
                  Messages: {job.infoMessages.length + job.warningMessages.length + job.errorMessages.length}
                </div>
              </div>
            </div>
          {/each}
        </div>

        {#if featurePastJobs.length > 10}
          <div class="mt-3 text-center">
            <p class="text-xs text-neutral">Showing 10 most recent jobs</p>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
