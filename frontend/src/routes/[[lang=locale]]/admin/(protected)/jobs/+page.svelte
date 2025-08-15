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

  // Past jobs data
  let pastJobs: JobInfo[] = [];

  // System health data
  let systemHealth: {
    activeJobs: number;
    pastJobs: number;
    staleJobs: number;
    warnings: Array<string>;
  } | null = null;

  // Polling interval
  let pollInterval: ReturnType<typeof setInterval>;

  // Fetch active jobs only (for real-time updates)
  async function fetchActiveJobs() {
    try {
      const response = await fetch('/api/admin/jobs');
      if (response.ok) {
        const activeJobs: JobInfo[] = await response.json();

        // Find the first active job for each feature
        argumentCondensationJob =
          activeJobs.find((job) => job.feature === 'argument-condensation' && job.status === 'running') || null;
        factorAnalysisJob =
          activeJobs.find((job) => job.feature === 'factor-analysis' && job.status === 'running') || null;
        questionInfoJob = activeJobs.find((job) => job.feature === 'question-info' && job.status === 'running') || null;
      }
    } catch (error) {
      console.error('Error fetching active jobs:', error);
    }
  }

  // Fetch past jobs (less frequently)
  async function fetchPastJobs() {
    try {
      const response = await fetch('/api/admin/jobs?includePast=true');
      if (response.ok) {
        const pastJobsData = await response.json();
        // Parse dates from API response
        pastJobs = pastJobsData.map((job: any) => ({
          ...job,
          startTime: new Date(job.startTime),
          endTime: job.endTime ? new Date(job.endTime) : undefined,
          lastActivityTime: job.lastActivityTime ? new Date(job.lastActivityTime) : undefined
        }));
      }
    } catch (error) {
      console.error('Error fetching past jobs:', error);
    }
  }

  // Fetch system health
  async function fetchSystemHealth() {
    try {
      const response = await fetch('/api/admin/jobs/health?autoCleanup=true');
      if (response.ok) {
        systemHealth = await response.json();
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  }

  // Fetch all jobs (for initial load)
  async function fetchAllJobs() {
    await Promise.all([fetchActiveJobs(), fetchPastJobs(), fetchSystemHealth()]);
  }

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

        // Refresh all data
        await fetchAllJobs();
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
      const response = await fetch(`/api/admin/jobs/${jobId}/force-fail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: `Admin force-failed ${feature} job` })
      });

      if (response.ok) {
        alert('Job force-failed successfully');
        await fetchAllJobs();
      } else {
        const error = await response.json();
        alert(`Failed to force-fail job: ${error.error}`);
      }
    } catch (error) {
      console.error('Error force-failing job:', error);
      alert('Failed to force-fail job. Check console for details.');
    }
  }

  // Get past jobs for a specific feature
  function getPastJobsForFeature(feature: string): JobInfo[] {
    return pastJobs.filter((job) => job.feature === feature);
  }

  // Format job duration
  function formatJobDuration(job: JobInfo): string {
    if (!job.endTime) return 'N/A';
    const duration = job.endTime.getTime() - job.startTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  // Start polling
  function startPolling() {
    // Fetch all jobs immediately
    fetchAllJobs();

    // Then poll active jobs every 1 second for real-time updates
    pollInterval = setInterval(fetchActiveJobs, 1000);

    // Fetch past jobs every 10 seconds (less frequent)
    setInterval(fetchPastJobs, 10000);

    // Fetch system health every 30 seconds
    setInterval(fetchSystemHealth, 30000);
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

<MainContent title="Jobs Monitoring">
  <div slot="fullWidth">
    <!-- System Health Section -->
    {#if systemHealth}
      <div class="card mb-lg bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">System Health</h2>

          <div class="stats stats-horizontal shadow">
            <div class="stat">
              <div class="stat-title">Active Jobs</div>
              <div class="stat-value {systemHealth.activeJobs > 0 ? 'text-primary' : 'text-success'}">
                {systemHealth.activeJobs}
              </div>
            </div>

            <div class="stat">
              <div class="stat-title">Past Jobs</div>
              <div class="stat-value text-secondary">{systemHealth.pastJobs}</div>
            </div>

            <div class="stat">
              <div class="stat-title">Stale Jobs</div>
              <div class="stat-value {systemHealth.staleJobs > 0 ? 'text-error' : 'text-success'}">
                {systemHealth.staleJobs}
              </div>
            </div>
          </div>

          {#if systemHealth.warnings.length > 0}
            <div class="mt-4 rounded-lg border border-warning/20 bg-warning/10 p-4">
              <h3 class="font-semibold mb-2 text-warning">System Warnings</h3>
              <ul class="space-y-1 text-sm">
                {#each systemHealth.warnings as warning}
                  <li class="text-warning">• {warning}</li>
                {/each}
              </ul>
            </div>
          {/if}

          <div class="card-actions mt-4 justify-end">
            <Button text="Refresh Health" variant="secondary" size="sm" onclick={fetchSystemHealth} />

            <Button
              text="Emergency Cleanup"
              variant="error"
              size="sm"
              onclick={performEmergencyCleanup}
              disabled={systemHealth.staleJobs === 0} />
          </div>
        </div>
      </div>
    {/if}

    <div class="mb-lg flex flex-col items-center gap-4">
      <p class="text-center">Monitor all active jobs across admin features</p>
    </div>

    <div class="flex w-full gap-lg px-4">
      <!-- Main Content - Takes 2/3 of width -->
      <div class="flex w-2/3 flex-col gap-lg">
        <!-- Argument Condensation Box -->
        <div class="card w-full bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h2 class="card-title text-primary">Argument Condensation</h2>
              {#if argumentCondensationJob}
                <Button
                  text="Force Fail"
                  variant="error"
                  size="sm"
                  onclick={() => forceFailJob(argumentCondensationJob.id, 'argument-condensation')} />
              {/if}
            </div>

            {#if !argumentCondensationJob}
              <!-- No Active Jobs Section -->
              <div class="space-y-4">
                <div class="text-center">
                  <p class="mb-4 text-sm text-neutral">No active jobs</p>
                  <p class="text-xs text-neutral">Start an argument condensation process to see real-time monitoring</p>
                </div>

                <!-- Info Messages Box -->
                <InfoMessages messages={[]} maxMessages={8} height="max-h-48" />

                <!-- Warning Messages Box -->
                <WarningMessages warnings={[]} errors={[]} height="max-h-48" />
              </div>
            {:else}
              <!-- Active Job Monitoring Section -->
              <div class="space-y-4">
                <!-- Progress Bar -->
                <ProgressBar progress={argumentCondensationJob.progress} color="primary" size="md" />

                <!-- Info Messages -->
                <InfoMessages messages={argumentCondensationJob.infoMessages} maxMessages={8} height="max-h-64" />

                <!-- Warning Messages -->
                <WarningMessages
                  warnings={argumentCondensationJob.warningMessages}
                  errors={argumentCondensationJob.errorMessages}
                  maxMessages={1000}
                  height="max-h-64" />
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
        <div class="card w-full bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h2 class="card-title text-secondary">Factor Analysis</h2>
              {#if factorAnalysisJob}
                <Button
                  text="Force Fail"
                  variant="error"
                  size="sm"
                  onclick={() => forceFailJob(factorAnalysisJob.id, 'factor-analysis')} />
              {/if}
            </div>

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
                <InfoMessages messages={factorAnalysisJob.infoMessages} maxMessages={8} height="max-h-64" />

                <!-- Warning Messages -->
                <WarningMessages
                  warnings={factorAnalysisJob.warningMessages}
                  errors={factorAnalysisJob.errorMessages}
                  maxMessages={1000}
                  height="max-h-64" />
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
        <div class="card w-full bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h2 class="card-title text-accent">Question Info</h2>
              {#if questionInfoJob}
                <Button
                  text="Force Fail"
                  variant="error"
                  size="sm"
                  onclick={() => forceFailJob(questionInfoJob.id, 'question-info')} />
              {/if}
            </div>

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
                <InfoMessages messages={questionInfoJob.infoMessages} maxMessages={8} height="max-h-64" />

                <!-- Warning Messages -->
                <WarningMessages
                  warnings={questionInfoJob.warningMessages}
                  errors={questionInfoJob.errorMessages}
                  maxMessages={1000}
                  height="max-h-64" />
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
                        <h3 class="font-semibold text-sm capitalize">{job.feature.replace('-', ' ')}</h3>
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
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</MainContent>
