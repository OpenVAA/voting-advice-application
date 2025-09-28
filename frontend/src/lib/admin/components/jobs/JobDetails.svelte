<script lang="ts">
  import { Button } from '$lib/components/button';
  import InfoMessages from '$lib/components/controller/InfoMessages.svelte';
  import ProgressBar from '$lib/components/controller/ProgressBar.svelte';
  import WarningMessages from '$lib/components/controller/WarningMessages.svelte';
  import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';
  import { concatClass } from '$lib/utils/components';
  import type { JobDetailsProps } from './JobDetails.type';
  import { getComponentContext } from '$lib/contexts/component';

  type $$Props = JobDetailsProps;

  const DEFAULT_MAX_MESSAGES = 1000;
  const DEFAULT_MESSAGES_HEIGHT = 'max-h-64';

  export let job: $$Props['job'];
  export let onAbortJob: $$Props['onAbortJob'] = undefined;
  export let maxMessages: $$Props['maxMessages'] = DEFAULT_MAX_MESSAGES;
  export let messagesHeight: $$Props['messagesHeight'] = DEFAULT_MESSAGES_HEIGHT;

  ////////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////////
  // Handle messages
  ////////////////////////////////////////////////////////////////////////

  let messagesOpen: boolean | undefined = undefined;
  let lastJobId: string | undefined = undefined;

  // Toggle messages when job changes
  $: if (job && job.id !== lastJobId) {
    messagesOpen = job.status === 'running' || job.status === 'aborting';
    lastJobId = job.id;
  }

  function toggleMessages() {
    messagesOpen = !messagesOpen;
  }

  ////////////////////////////////////////////////////////////////////////
  // Aborting
  ////////////////////////////////////////////////////////////////////////

  function handleAbort() {
    if (job.status === 'running' && onAbortJob) onAbortJob(job.id);
  }

  ////////////////////////////////////////////////////////////////////////
  // Helpers
  ////////////////////////////////////////////////////////////////////////

  function formatJobDuration(job: JobInfo): string {
    if (!job.endTime) return $t('adminApp.jobs.notAvailable');
    const duration = new Date(job.endTime).getTime() - new Date(job.startTime).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
</script>

<article {...concatClass($$restProps, 'card w-full max-w-full bg-base-100 shadow-lg border border-base-300')}>
  <div class="card-body overflow-hidden p-6">
    <!-- Header with status and actions -->
    <div class="mb-4 flex items-start justify-between">
      <div class="flex items-center gap-3">
        <span
          class="badge badge-lg font-medium {job.status === 'completed'
            ? 'badge-success'
            : job.status === 'failed'
              ? 'badge-error'
              : job.status === 'aborted' || job.status === 'aborting'
                ? 'badge-warning'
                : 'badge-info'}">
          {job.status}
        </span>
        <div class="text-base-content/70 text-sm">
          {$t('adminApp.jobs.id')}: <span class="font-mono text-xs">{job.id.slice(0, 8)}...</span>
        </div>
      </div>

      {#if job.status === 'running' && onAbortJob}
        <Button text={$t('adminApp.jobs.abortJob')} variant="secondary" on:click={handleAbort} />
      {/if}
    </div>

    <!-- Job metadata in a clean grid -->
    <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="flex flex-col">
        <span class="text-base-content/60 text-xs font-medium uppercase tracking-wide"
          >{$t('adminApp.jobs.author')}</span>
        <span class="mt-1 text-sm font-medium">{job.author}</span>
      </div>
      <div class="flex flex-col">
        <span class="text-base-content/60 text-xs font-medium uppercase tracking-wide"
          >{$t('adminApp.jobs.started')}</span>
        <span class="mt-1 text-sm font-medium">{new Date(job.startTime).toLocaleString()}</span>
      </div>
      {#if job.endTime}
        <div class="flex flex-col">
          <span class="text-base-content/60 text-xs font-medium uppercase tracking-wide"
            >{$t('adminApp.jobs.duration')}</span>
          <span class="mt-1 text-sm font-medium">{formatJobDuration(job)}</span>
        </div>
      {/if}
    </div>

    <!-- Progress / Aborting states -->
    {#if job.status === 'running'}
      <ProgressBar progress={job.progress} label={$t('adminApp.jobs.progress')} color="primary" size="md" />
    {:else if job.status === 'aborting'}
      <div class="mb-4">
        <div class="mb-2 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="loading loading-spinner loading-sm text-warning"></span>
            <span class="text-warning text-sm font-medium">{$t('adminApp.jobs.aborting')}</span>
          </div>
          <span class="text-base-content/60 text-xs">{Math.round(job.progress * 100)}%</span>
        </div>
        <ProgressBar progress={job.progress} label="" showPercentage={false} color="accent" size="md" />
        <div class="text-base-content/70 mt-2 text-xs">
          {$t('adminApp.jobs.abortingInfo')}
        </div>
      </div>
    {/if}

    <!-- Messages toggle -->
    <div class="border-base-300 flex items-center justify-end border-t pt-2">
      <Button
        text={messagesOpen ? $t('adminApp.jobs.hideMessages') : $t('adminApp.jobs.showMessages')}
        variant="secondary"
        on:click={toggleMessages} />
    </div>

    <!-- Messages section -->
    {#if messagesOpen}
      <div class="border-base-300 mt-4 space-y-4 border-t pt-4">
        <WarningMessages warnings={job.warningMessages} errors={job.errorMessages} />
        <InfoMessages messages={job.infoMessages} />
      </div>
    {/if}
  </div>
</article>
