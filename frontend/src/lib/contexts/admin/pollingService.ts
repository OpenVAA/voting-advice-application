import type { Writable } from 'svelte/store';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';
import type { PollingService } from './pollingService.type';

/**
 * Create a smart polling service that automatically starts/stops based on active job count
 * @param activeJobsStore - A writable store containing active job counts for each feature
 * @param pastJobsStore - A writable store containing past job information for job by id
 */
export function createPollingService({
  activeJobsStore,
  pastJobsStore
}: {
  activeJobsStore: Writable<Map<string, JobInfo | null>>;
  pastJobsStore: Writable<Map<string, JobInfo>>;
}): PollingService {
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let isPolling = false;

  // Start polling if not already polling
  function startPolling() {
    if (isPolling) return;

    console.info('[JobPollingService] Starting polling...');
    isPolling = true;

    // Poll every 2 seconds
    pollInterval = setInterval(async () => {
      await fetchAndUpdateJobs();
    }, 2000);

    // Fetch immediately on start
    fetchAndUpdateJobs();
  }

  // Stop polling
  function stopPolling() {
    if (!isPolling) return;

    console.info('[JobPollingService] Stopping polling...');
    isPolling = false;

    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  // Fetch jobs from API and update stores
  async function fetchAndUpdateJobs() {
    try {
      // Fetch active jobs
      const activeResponse = await fetch('/api/admin/jobs');

      if (!activeResponse?.ok) throw new Error('Failed to fetch active jobs');

      const { activeJobs } = (await activeResponse.json()) as { activeJobs: Array<JobInfo> };

      activeJobsStore.update(() => {
        // TODO: Don't use hard-coded feature names, only make a Map out of those running and the rest can be undefined
        const activeJobsMap = new Map<string, JobInfo | null>();
        activeJobsMap.set('argument-condensation', null);
        activeJobsMap.set('factor-analysis', null);
        activeJobsMap.set('question-info', null);
        // Set active jobs for features that have them
        for (const job of activeJobs.filter((job: JobInfo) => job.status === 'running')) {
          activeJobsMap.set(job.feature, job); // No date parsing needed!
        }

        return activeJobsMap;
      });

      await fetchPastJobs();
    } catch (error) {
      console.error('[JobPollingService] Error fetching jobs:', error);
    }
  }

  // Separate function to fetch past jobs
  async function fetchPastJobs() {
    try {
      const pastResponse = await fetch('/api/admin/jobs?includePast=true');
      if (pastResponse.ok) {
        const { pastJobs } = await pastResponse.json();

        // Convert to Map<jobId, JobInfo>
        const pastJobsMap = new Map<string, JobInfo>();
        for (const job of pastJobs) {
          pastJobsMap.set(job.id, job);
        }

        pastJobsStore.set(pastJobsMap);
        console.info(`[JobPollingService] Updated past jobs store with ${pastJobsMap.size} jobs`);
      }
    } catch (error) {
      console.error('[JobPollingService] Error fetching past jobs:', error);
    }
  }

  // Handle starting and stopping polling
  activeJobsStore.subscribe((jobs) => {
    const hasActive = Array.from(jobs.values()).some((j) => j != null);
    if (hasActive && !isPolling) {
      startPolling();
    } else if (!hasActive && isPolling) {
      stopPolling();
    }
  });

  // Return methods for manual control if needed
  return {
    startPolling,
    stopPolling,
    isPolling: () => isPolling,
    // Force a manual refresh
    refresh: fetchAndUpdateJobs
  };
}
