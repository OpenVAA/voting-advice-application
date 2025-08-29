<!--@component
# Admin Jobs Monitoring Page

Page for monitoring all active jobs across different admin features
-->

<script lang="ts">
  import JobMonitor from '$lib/admin/components/jobs/JobMonitor.svelte';
  import { Button } from '$lib/components/button';
  import { getAdminContext } from '$lib/contexts/admin';
  import MainContent from '../../../MainContent.svelte';
  import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';
  import { ADMIN_FEATURE } from '$lib/admin/features';
  import { UNIVERSAL_API_ROUTES } from '$lib/api/base/universalApiRoutes';

  const {
    getRoute,
    jobs: { activeJobCount, activeJobsStore, pollingService, pastJobsStore }
  } = getAdminContext();

  // TODO: $lib/admin/features/ {#each Object.entries(ADMIN_FEATURE) as [feature, route]} ...
  // Subscribe to stores for reactive UI updates
  $: argumentCondensationJob = $activeJobsStore.get(ADMIN_FEATURE.ArgumentCondensation.jobName) || null;
  $: factorAnalysisJob = $activeJobsStore.get('factor-analysis') || null;
  $: questionInfoJob = $activeJobsStore.get(ADMIN_FEATURE.QuestionInfoGeneration.jobName) || null;
  $: pastJobs = Array.from($pastJobsStore.values());

  pollingService.refresh();

  // Emergency cleanup function
  async function performEmergencyCleanup() {
    if (!confirm('Are you sure you want to perform emergency cleanup? This will force-fail ALL running jobs.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/jobs/emergency-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin-initiated emergency cleanup' })
      });

      if (response.ok) {
        const result = await response.json();
        console.info('Emergency cleanup completed:', result);
        alert(`Emergency cleanup completed! ${result.cleanedJobs} jobs were cleaned up.`);

        // Refresh data from stores
        await pollingService.refresh();
      } else {
        const error = await response.json();
        alert(`Emergency cleanup failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error during emergency cleanup:', error);
      alert('Emergency cleanup failed. Check console for details.');
    }
  }

  // Force fail a specific job
  async function forceFailJob(jobId: string, feature: string) {
    if (!confirm(`Are you sure you want to force-fail this ${feature} job?`)) {
      return;
    }

    try {
      const response = await fetch(UNIVERSAL_API_ROUTES.jobAbort(jobId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: `Admin force-failed ${feature} job` })
      });

      if (response.ok) {
        alert('Job force-failed successfully');
        // Refresh data from stores
        await pollingService.refresh();
      } else {
        const error = await response.json();
        alert(`Failed to force-fail job: ${error.error}`);
      }
    } catch (error) {
      console.error('Error force-failing job:', error);
      alert('Failed to force-fail job. Check console for details.');
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
</script>

<MainContent title="Jobs Monitoring">
  <div slot="fullWidth">
    <!-- System Health Section -->
    <div class="card mb-lg bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-base-content">System Health</h2>

        <div class="stats stats-horizontal shadow">
          <div class="stat">
            <div class="stat-title">Active Jobs</div>
            <div class="stat-value {$activeJobCount > 0 ? 'text-primary' : 'text-success'}">
              {$activeJobCount}
            </div>
          </div>

          <div class="stat">
            <div class="stat-title">Successful Jobs</div>
            <div class="stat-value text-success">
              {Array.from($pastJobsStore.values()).filter((job) => job.status === 'completed').length}
            </div>
          </div>

          <div class="stat">
            <div class="stat-title">Failed Jobs</div>
            <div class="stat-value text-error">
              {Array.from($pastJobsStore.values()).filter((job) => job.status === 'failed').length}
            </div>
          </div>
        </div>

        <div class="card-actions mt-4 justify-end">
          <Button
            text="Fail All Jobs"
            variant="secondary"
            on:click={performEmergencyCleanup}
            disabled={$activeJobCount === 0} />
        </div>
      </div>
    </div>

    <div class="mb-lg flex flex-col items-center gap-4">
      <p class="text-center">Monitor all active jobs across admin features</p>
    </div>

    <div class="flex w-full gap-lg px-4">
      <!-- Main Content - Takes 2/3 of width -->
      <div class="flex w-2/3 flex-col gap-lg">
        <!-- Argument Condensation Monitor -->
        <div class="relative">
          <JobMonitor
            jobType={ADMIN_FEATURE.ArgumentCondensation.jobName}
            activeJob={argumentCondensationJob}
            onKillJob={(jobId) => forceFailJob(jobId, ADMIN_FEATURE.ArgumentCondensation.jobName)}
            featureLink={$getRoute('AdminAppArgumentCondensation')}
            showPastJobs={false}
            maxMessages={8}
            height="max-h-64" />
        </div>

        <!-- Factor Analysis Monitor -->
        <div class="relative">
          <JobMonitor
            jobType="factor-analysis"
            activeJob={factorAnalysisJob}
            onKillJob={(jobId) => forceFailJob(jobId, 'factor-analysis')}
            featureLink={$getRoute('AdminAppFactorAnalysis')}
            showPastJobs={false}
            maxMessages={8}
            height="max-h-64" />
        </div>

        <!-- Question Info Monitor -->
        <div class="relative">
          <JobMonitor
            jobType={ADMIN_FEATURE.QuestionInfoGeneration.jobName}
            activeJob={questionInfoJob}
            onKillJob={(jobId) => forceFailJob(jobId, 'question-info')}
            featureLink={$getRoute('AdminAppQuestionInfo')}
            showPastJobs={false}
            maxMessages={8}
            height="max-h-64" />
        </div>
      </div>

      <!-- Past Jobs Sidebar - Takes 1/3 of width -->
      <div class="w-1/3">
        <div class="card sticky top-4 h-fit bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content">Past Jobs</h2>
            <p class="mb-4 text-sm text-neutral">Recently completed and failed jobs</p>

            <div class="max-h-[calc(100vh-200px)] space-y-4 overflow-y-auto">
              {#if pastJobs.length === 0}
                <div class="py-8 text-center">
                  <p class="text-sm text-neutral">No past jobs yet</p>
                </div>
              {:else}
                {#each pastJobs.slice(0, 20).reverse() as job}
                  <div class="p-3 rounded-lg border border-base-300 transition-colors hover:bg-base-200">
                    <div class="mb-2 flex items-start justify-between">
                      <div class="flex-1">
                        <a href={$getRoute({ route: 'AdminAppJob', jobId: job.id })}>
                          <h3 class="font-semibold text-sm capitalize">{job.feature.replace('-', ' ')}</h3>
                          <p class="text-xs text-neutral">{job.author}</p>
                        </a>
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
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</MainContent>
