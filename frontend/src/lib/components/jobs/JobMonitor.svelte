<!--@component
# Job Monitor Component

Reusable component for monitoring a single feature's job status.
Handles all states: no job, active job, completed job.
Includes embedded kill switch functionality.
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import InfoMessages from '$lib/components/logger/InfoMessages.svelte';
  import ProgressBar from '$lib/components/logger/ProgressBar.svelte';
  import WarningMessages from '$lib/components/logger/WarningMessages.svelte';
  import type { JobInfo } from '$lib/server/jobs/jobStore.type';

  export let jobType: string; // e.g., 'argument-condensation'
  export let activeJob: JobInfo | null; // Current active job or null
  export let onKillJob: (jobId: string) => void; // Required callback when kill switch clicked
  export let maxMessages = 8;
  export let height = 'max-h-64';

  // Handle kill switch click
  function handleKillJob() {
    if (activeJob) {
      onKillJob(activeJob.id);
    }
  }
</script>

<div class="card w-full bg-base-100 shadow-xl">
  <div class="card-body">
    <div class="flex items-center justify-between">
      <h2 class="card-title capitalize text-primary">{jobType.replace('-', ' ')}</h2>
      {#if activeJob}
        <Button text="Force Fail" variant="secondary" on:click={handleKillJob} />
      {/if}
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
        <InfoMessages messages={activeJob.infoMessages} {maxMessages} {height} />

        <!-- Warning Messages -->
        <WarningMessages
          warnings={activeJob.warningMessages}
          errors={activeJob.errorMessages}
          maxMessages={1000}
          {height} />
      </div>
    {/if}
  </div>
</div>
