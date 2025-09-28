<script lang="ts">
  import { FeatureJobs } from '$lib/admin/components/jobs';
  import { ADMIN_FEATURES, type AdminFeature } from '$lib/admin/features';
  import { Button } from '$lib/components/button';
  import { getAdminContext } from '$lib/contexts/admin';
  import MainContent from '../../../MainContent.svelte';

  // TODO: add error handling & info updates if polling service refresh, abortAllJobs or abortJob fails

  ////////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////////

  const {
    authToken,
    t,
    jobs: { activeJobsByFeature, pastJobs },
    abortAllJobs,
    abortJob
  } = getAdminContext();

  ////////////////////////////////////////////////////////////////////////
  // Get jobs
  ////////////////////////////////////////////////////////////////////////

  let activeJobsCount: number;
  $: activeJobsCount = [...$activeJobsByFeature.values().filter((j) => !!j)].length;

  ////////////////////////////////////////////////////////////////////////
  // Handle aborting jobs
  ////////////////////////////////////////////////////////////////////////

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
      await abortJob({
        authToken: token,
        jobId,
        reason: 'Admin aborted this process'
      });
    } catch (error) {
      console.error('Error aborting job:', error);
      alert(t.get('adminApp.jobs.abortJobFailed'));
    }
  }
</script>

<MainContent title={$t('adminApp.jobs.title')}>
  <div slot="primaryActions" class="flex gap-2">
    <Button variant="secondary" text={$t('adminApp.jobs.emergencyCleanup')} on:click={performEmergencyCleanup} />
  </div>

  <div slot="fullWidth" class="gap-lg flex flex-col">
    <div class="px-1">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">{$t('adminApp.jobs.systemHealth')}</h2>

          <div class="stats stats-horizontal shadow">
            <div class="stat">
              <div class="stat-title">{$t('adminApp.jobs.activeJobs')}</div>
              <div class="stat-value {activeJobsCount > 0 ? 'text-primary' : 'text-success'}">{activeJobsCount}</div>
            </div>

            <div class="stat">
              <div class="stat-title">{$t('adminApp.jobs.successfulJobs')}</div>
              <div class="stat-value text-success">
                {$pastJobs.filter((job) => job.status === 'completed').length}
              </div>
            </div>

            <div class="stat">
              <div class="stat-title">{$t('adminApp.jobs.failedJobs')}</div>
              <div class="stat-value text-error">
                {$pastJobs.filter((job) => job.status === 'failed').length}
              </div>
            </div>

            <div class="stat">
              <div class="stat-title">{$t('adminApp.jobs.abortedJobs')}</div>
              <div class="stat-value text-warning">
                {$pastJobs.filter((job) => job.status === 'aborted').length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="gap-lg flex w-full px-1">
      <!-- Main Content - Features list -->
      <div class="gap-lg flex w-3/4 flex-col">
        {#each ADMIN_FEATURES as feature}
          <div class="relative">
            <FeatureJobs {feature} onAbortJob={(jobId) => handleAbortJob(jobId, feature)} />
          </div>
        {/each}
      </div>
    </div>
  </div>
</MainContent>
