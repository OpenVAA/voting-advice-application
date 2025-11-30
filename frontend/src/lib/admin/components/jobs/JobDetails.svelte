<script lang="ts">
  import { Button } from '$lib/components/button';
  import { InfoMessages, ProgressBar, WarningMessages } from '$lib/components/controller';
  import { concatClass } from '$lib/utils/components';
  import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';
  import type { JobDetailsProps } from './JobDetails.type';
  import ButtonWithConfirmation from '$lib/components/buttonWithConfirmation/ButtonWithConfirmation.svelte';
  import { getAdminContext } from '$lib/contexts/admin';

  type $$Props = JobDetailsProps;

  export let job: $$Props['job'];

  ////////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////////

  const { abortJob, t } = getAdminContext();

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

  async function handleAbortJob() {
    if (job.status !== 'running') return;
    try {
      await abortJob({
        jobId: job.id,
        reason: `Admin aborted this ${job.jobType.toLowerCase()} process`
      });
    } catch (error) {
      console.error(error);
      alert($t('adminApp.jobs.abortJobFailed'));
    }
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

<!-- TODO: improve. it's not a pretty sight. . -->
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

      {#if job.status === 'running'}
        <ButtonWithConfirmation
          text={$t('adminApp.jobs.abortJob')}
          modalTitle={$t('adminApp.jobs.confirmAbortJob', {
            feature: $t(`adminApp.jobs.features.${job.jobType}.title`)
          })}
          variant="secondary"
          onConfirm={handleAbortJob}>
        </ButtonWithConfirmation>
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
