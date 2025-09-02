<script lang="ts">
  import { Button } from '$lib/components/button';
  import InfoMessages from '$lib/components/controller/InfoMessages.svelte';
  import ProgressBar from '$lib/components/controller/ProgressBar.svelte';
  import WarningMessages from '$lib/components/controller/WarningMessages.svelte';
  import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';
  import { concatClass } from '$lib/utils/components';
  import type { JobDetailsProps } from './JobDetails.type';
  import { getAdminContext } from '$lib/contexts/admin';

  const { t } = getAdminContext();

  type $$Props = JobDetailsProps;

  export let job: $$Props['job'];
  export let onAbortJob: $$Props['onAbortJob'] = undefined;

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

  function handleAbort() {
    if (job.status === 'running' && onAbortJob) onAbortJob(job.id);
  }

  function formatJobDuration(job: JobInfo): string {
    if (!job.endTime) return $t('adminApp.jobs.notAvailable');
    const duration = new Date(job.endTime).getTime() - new Date(job.startTime).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
</script>

<!-- TODO: improve. it's not a pretty sight. . -->
<article {...concatClass($$restProps, 'card w-full max-w-full bg-base-100 shadow-lg border border-base-300')}>
  <div class="card-body overflow-hidden p-6">
    <!-- Header with status and actions -->
    <div class="mb-4 flex items-start justify-between">
      <div class="gap-3 flex items-center">
        <span
          class="font-medium badge badge-lg {job.status === 'completed'
            ? 'badge-success'
            : job.status === 'failed'
              ? 'badge-error'
              : job.status === 'aborted' || job.status === 'aborting'
                ? 'badge-warning'
                : 'badge-info'}">
          {job.status}
        </span>
        <div class="text-sm text-base-content/70">
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
        <span class="font-medium text-xs uppercase tracking-wide text-base-content/60"
          >{$t('adminApp.jobs.author')}</span>
        <span class="font-medium mt-1 text-sm">{job.author}</span>
      </div>
      <div class="flex flex-col">
        <span class="font-medium text-xs uppercase tracking-wide text-base-content/60"
          >{$t('adminApp.jobs.started')}</span>
        <span class="font-medium mt-1 text-sm">{new Date(job.startTime).toLocaleString()}</span>
      </div>
      {#if job.endTime}
        <div class="flex flex-col">
          <span class="font-medium text-xs uppercase tracking-wide text-base-content/60"
            >{$t('adminApp.jobs.duration')}</span>
          <span class="font-medium mt-1 text-sm">{formatJobDuration(job)}</span>
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
            <span class="font-medium text-sm text-warning">{$t('adminApp.jobs.aborting')}</span>
          </div>
          <span class="text-xs text-base-content/60">{Math.round(job.progress * 100)}%</span>
        </div>
        <ProgressBar progress={job.progress} label="" showPercentage={false} color="accent" size="md" />
        <div class="mt-2 text-xs text-base-content/70">
          {$t('adminApp.jobs.abortingInfo')}
        </div>
      </div>
    {/if}

    <!-- Messages toggle -->
    <div class="flex items-center justify-end border-t border-base-300 pt-2">
      <Button
        text={messagesOpen ? $t('adminApp.jobs.hideMessages') : $t('adminApp.jobs.showMessages')}
        variant="secondary"
        on:click={toggleMessages} />
    </div>

    <!-- Messages section -->
    {#if messagesOpen}
      <div class="mt-4 space-y-4 border-t border-base-300 pt-4">
        <WarningMessages warnings={job.warningMessages} errors={job.errorMessages} />
        <InfoMessages messages={job.infoMessages} />
      </div>
    {/if}
  </div>
</article>
