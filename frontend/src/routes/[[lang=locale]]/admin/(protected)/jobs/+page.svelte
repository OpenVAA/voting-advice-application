<script lang="ts">
  import { FeatureJobs } from '$lib/admin/components/jobs';
  import { ADMIN_FEATURE, type AdminFeature, type AdminJobName } from '$lib/admin/features';
  import { Button } from '$lib/components/button';
  import { getAdminContext } from '$lib/contexts/admin';
  import MainContent from '../../../MainContent.svelte';
  import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';
  import type { TranslationKey } from '$types';
  import { DEFAULT_MAX_MESSAGES } from '$lib/admin/components/jobs/shared';

  // TODO: add error handling & info updates if polling service refresh, abortAllJobs or abortJob fails

  const {
    authToken,
    t,
    getRoute,
    jobs: { activeJobCount, pollingService, pastJobsStore },
    abortAllJobs,
    abortJob
  } = getAdminContext();

  // Get all feature keys here to to avoid type errors when iterating over ADMIN_FEATURE
  const featureKeys = Object.keys(ADMIN_FEATURE) as Array<AdminFeature>;

  // Keep polling synced with page visibility
  pollingService.refresh();

  // Emergency: abort all running jobs
  async function performEmergencyCleanup() {
    if (!confirm(t.get('adminApp.jobs.confirmAbortAll'))) {
      return;
    }
    try {
      const token = $authToken;
      if (!token) {
        alert(t.get('adminApp.jobs.authRequired'));
        return;
      }
      await abortAllJobs({ authToken: token });
      await pollingService.refresh();
    } catch (error) {
      console.error('Error during emergency cleanup:', error);
      alert(t.get('adminApp.jobs.abortAllFailed'));
    }
  }
  // TODO: centralize this, used in all feature pages 
  async function handleAbortJob(jobId: string, feature: AdminFeature) {
    console.log('handleAbortJob called with jobId:', jobId, 'and feature:', feature);
    if (!confirm(t.get('adminApp.jobs.confirmAbortJob', { feature }))) {
      return;
    }
    try {
      const token = $authToken;
      if (!token) {
        alert(t.get('adminApp.jobs.authRequired'));
        return;
      }
      console.log('Calling abortJob with:', { authToken: token, jobId, reason: 'Admin aborted this process' });
      await abortJob({
        authToken: token,
        jobId,
        reason: 'Admin aborted this process',
      });
      await pollingService.refresh();
    } catch (error) {
      console.error('Error aborting job:', error);
      alert(t.get('adminApp.jobs.abortJobFailed'));
    }
  }

  // Past jobs reactive list for sidebar
  // TODO: optimize so we don't have to filter in the jobs we want in each template every time
  // memoize? 
  $: pastJobs = Array.from($pastJobsStore.values());

  // Duration formatter (same as jobs page)
  function formatJobDuration(job: JobInfo): string {
    if (!job.endTime) return t.get('adminApp.jobs.notAvailable');
    const duration = new Date(job.endTime).getTime() - new Date(job.startTime).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  // TODO: This but a hack. 
  // Use a more centralised approach for this (it is also used in FeatureJobs.svelte, although with AdminFeature keys)
  const jobTypeTitleKey: Record<AdminJobName, TranslationKey> = {
    'argument-condensation': 'adminApp.jobs.argumentCondensation.title',
    'question-info-generation': 'adminApp.jobs.questionInfoGeneration.title'
  } as const;
</script>

<MainContent title={$t('adminApp.jobs.title')}>
  <div slot="primaryActions" class="flex gap-2">
    <Button variant="secondary" text={$t('adminApp.jobs.emergencyCleanup')} on:click={performEmergencyCleanup} />
  </div>

  <div slot="fullWidth" class="flex flex-col gap-lg">
    <div class="px-1">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">{$t('adminApp.jobs.systemHealth')}</h2>

          <div class="stats stats-horizontal shadow">
            <div class="stat">
              <div class="stat-title">{$t('adminApp.jobs.activeJobs')}</div>
              <div class="stat-value {$activeJobCount > 0 ? 'text-primary' : 'text-success'}">{$activeJobCount}</div>
            </div>

            <div class="stat">
              <div class="stat-title">{$t('adminApp.jobs.successfulJobs')}</div>
              <div class="stat-value text-success">
                {Array.from($pastJobsStore.values()).filter((job) => job.status === 'completed').length}
              </div>
            </div>

            <div class="stat">
              <div class="stat-title">{$t('adminApp.jobs.failedJobs')}</div>
              <div class="stat-value text-error">
                {Array.from($pastJobsStore.values()).filter((job) => job.status === 'failed').length}
              </div>
            </div>

            <div class="stat">
              <div class="stat-title">{$t('adminApp.jobs.abortedJobs')}</div>
              <div class="stat-value text-warning">
                {Array.from($pastJobsStore.values()).filter((job) => job.status === 'aborted').length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="px-1 flex w-full gap-lg">
      <!-- Main Content - Features list -->
      <div class="flex w-3/4 flex-col gap-lg">
        {#each featureKeys as featureKey}
          <div class="relative">
            <FeatureJobs feature={featureKey} onAbortJob={(jobId) => handleAbortJob(jobId, featureKey)} />
          </div>
        {/each}
      </div>

      <!-- Past Jobs Sidebar. Can be removed or made into a more robust component -->
      <div class="w-1/4">
        <div class="card sticky top-4 h-fit bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content">{$t('adminApp.jobs.pastJobs')}</h2>
            <p class="mb-4 text-sm text-neutral">{$t('adminApp.jobs.pastJobsDescription')}</p>

            <div class="max-h-[calc(100vh-200px)] space-y-4 overflow-y-auto">
              {#if pastJobs.length === 0}
                <div class="py-8 text-center">
                  <p class="text-sm text-neutral">{$t('adminApp.jobs.noPastJobs')}</p>
                </div>
              {:else}
                {#each pastJobs.slice(DEFAULT_MAX_MESSAGES).reverse() as job}
                  <div class="p-3 rounded-lg border border-base-300 transition-colors hover:bg-base-200">
                    <div class="mb-2 flex items-start justify-between">
                       <!-- Do we want a link to a job-specific page? -->
                      <div class="flex-1">
                        {$t(jobTypeTitleKey[job.jobType])}
                        <p class="text-xs text-neutral">{job.author}</p>
                      </div>
                      <div class="text-right">
                        <span
                          class="badge badge-sm {job.status === 'completed'
                            ? 'badge-success'
                            : job.status === 'failed'
                              ? 'badge-error'
                              : 'badge-warning'}">
                          {job.status}
                        </span>
                      </div>
                    </div>

                    <div class="space-y-1 text-xs text-neutral">
                      <div>{$t('adminApp.jobs.started')}: {new Date(job.startTime).toLocaleString()}</div>
                      {#if job.endTime}
                        <div>{$t('adminApp.jobs.duration')}: {formatJobDuration(job)}</div>
                      {/if}
                      <div>
                        {$t('adminApp.jobs.messages')}: {job.infoMessages.length +
                          job.warningMessages.length +
                          job.errorMessages.length}
                      </div>
                    </div>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</MainContent>
