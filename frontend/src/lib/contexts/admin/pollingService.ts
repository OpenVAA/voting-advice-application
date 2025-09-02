import { ADMIN_FEATURE, type AdminJobName } from '$lib/admin/features';
import { UNIVERSAL_API_ROUTES } from '$lib/api/base/universalApiRoutes';
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
  activeJobsStore: Writable<Map<AdminJobName, JobInfo | null>>;
  pastJobsStore: Writable<Map<AdminJobName, JobInfo>>;
}): PollingService {
  let pollInterval: ReturnType<typeof setInterval> | null = null; // Polling frequency in milliseconds
  let isPolling = false;

  // An ISO timestamp to keep track of the last update for past jobs
  // Works as a delta cursor so we don't fetch the same data again
  let lastPastJobsUpdate: string | undefined;

  // Create a set of known job names for efficient validation
  const knownJobNames = new Set(Object.values(ADMIN_FEATURE).map((f) => f.jobName));

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
    console.info('[JobPollingService] Stopping polling service...');
    isPolling = false;

    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  // Fetch jobs from API and update stores
  async function fetchAndUpdateJobs() {
    try {
      console.info('[JobPollingService] Fetching jobs...');

      // Always fetch all active jobs (no delta)
      const activeUrl = new URL(UNIVERSAL_API_ROUTES.jobsActive, window.location.origin);

      // Use delta updates for past jobs
      const pastUrl = new URL(UNIVERSAL_API_ROUTES.jobsPast, window.location.origin);
      if (lastPastJobsUpdate) {
        pastUrl.searchParams.set('startFrom', lastPastJobsUpdate);
      }

      // Fetch both in parallel
      const [activeRes, pastRes] = await Promise.all([fetch(activeUrl.toString()), fetch(pastUrl.toString())]);
      // TODO: handle case where a job lands in both active and past jobs (rare but possible)

      if (!activeRes.ok) throw new Error('Failed to fetch active jobs');
      if (!pastRes.ok) throw new Error('Failed to fetch past jobs');

      const [activeJobs, pastJobs] = (await Promise.all([activeRes.json(), pastRes.json()])) as [
        Array<JobInfo>,
        Array<JobInfo>
      ];

      console.info('[JobPollingService] Got response:', {
        activeJobsCount: activeJobs.length,
        pastJobsCount: pastJobs.length
      });

      // Update the delta cursor for past jobs
      lastPastJobsUpdate = new Date().toISOString();

      // Always update active jobs (replace completely)
      activeJobsStore.update(() => {
        console.info('[JobPollingService] Updating active jobs store');
        const activeMap = new Map<string, JobInfo | null>();

        // Add active jobs by feature, validating against known features
        for (const job of activeJobs.filter((j) => j.status === 'running' || j.status === 'aborting')) {
          if (knownJobNames.has(job.jobType)) {
            activeMap.set(job.jobType, job);
            console.info('[JobPollingService] Set active job:', job.jobType);
          } else {
            console.warn(
              `[JobPollingService] Unknown job feature: ${job.jobType}. Deleting it from active jobs store.`
            );
            activeMap.delete(job.jobType);
          }
        }

        return activeMap;
      });

      // Merge past jobs by id (delta updates)
      if (pastJobs.length > 0) {
        pastJobsStore.update((prev) => {
          console.info('[JobPollingService] Updating past jobs store');
          const pastMap = new Map(prev);
          for (const job of pastJobs) {
            if (knownJobNames.has(job.jobType)) {
              pastMap.set(job.id, job);
            } else {
              console.warn(`[JobPollingService] Unknown job feature: ${job.jobType}. Deleting from past jobs store.`);
              pastMap.delete(job.id);
            }
          }
          return pastMap;
        });
      } else {
        console.info('[JobPollingService] No past jobs to update');
      }
    } catch (error) {
      console.error('[JobPollingService] Error fetching jobs:', error);
    }
  }

  // Start/stop based on presence of any active job
  activeJobsStore.subscribe((jobs) => {
    const hasActive = Array.from(jobs.values()).some((j) => j != null);
    console.info('[JobPollingService] Active jobs store changed:', {
      hasActive,
      activeFeatures: Array.from(jobs.keys()),
      activeJobCount: Array.from(jobs.values()).filter((j) => j != null).length
    });

    if (hasActive && !isPolling) {
      console.info('[JobPollingService] Starting polling due to active jobs');
      startPolling();
    } else if (!hasActive && isPolling) {
      console.info('[JobPollingService] Stopping polling due to no active jobs.');
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
