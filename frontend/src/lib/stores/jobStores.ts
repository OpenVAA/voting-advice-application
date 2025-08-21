import { derived, get, writable } from 'svelte/store';
import type { JobInfo } from '$lib/server/jobs/jobStore.type';

// Store for active jobs by feature (one active job per feature)
export const activeJobsStore = writable<Map<string, JobInfo | null>>(new Map());

// Store for past jobs by jobId (multiple jobs per feature possible)
export const pastJobsStore = writable<Map<string, JobInfo>>(new Map());

// Derived store for active job count
export const activeJobCount = derived(activeJobsStore, ($activeJobs) => {
  let count = 0;
  for (const job of $activeJobs.values()) {
    if (job !== null) {
      count++;
    }
  }
  return count;
});

// Smart polling service that automatically starts/stops based on active job count
function createJobPollingService() {
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let isPolling = false;
  let previousActiveCount = 0; // Track previous active job count
  let hasInitialized = false; // Track if we've done initial fetch

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
      if (activeResponse.ok) {
        const activeJobs: Array<JobInfo> = await activeResponse.json();

        // Convert to Map<feature, JobInfo | null> (one active job per feature)
        const activeJobsMap = new Map<string, JobInfo | null>();
        let currentActiveCount = 0; // Calculate current count locally

        activeJobsStore.update(() => {
          // Initialize all features as null
          activeJobsMap.set('argument-condensation', null);
          activeJobsMap.set('factor-analysis', null);
          activeJobsMap.set('question-info', null);

          // Set active jobs for features that have them
          for (const job of activeJobs) {
            if (job.status === 'running') {
              activeJobsMap.set(job.feature, job);
              currentActiveCount++;
            }
          }

          return activeJobsMap;
        });

        // Fetch past jobs on initial load OR when count decreases (jobs completed)
        if (!hasInitialized || currentActiveCount < previousActiveCount) {
          const reason = !hasInitialized ? 'Initial page load' : 'Active job count decreased';
          console.info(`[JobPollingService] ${reason}, fetching past jobs...`);
          await fetchPastJobs();
          hasInitialized = true;
        }

        // Update previous count for next comparison
        previousActiveCount = currentActiveCount;
      }
    } catch (error) {
      console.error('[JobPollingService] Error fetching jobs:', error);
    }
  }

  // Separate function to fetch past jobs
  async function fetchPastJobs() {
    try {
      const pastResponse = await fetch('/api/admin/jobs?includePast=true');
      if (pastResponse.ok) {
        const pastJobsData: Array<JobInfo> = await pastResponse.json();

        // Parse dates and convert to Map<jobId, JobInfo>
        const pastJobsMap = new Map<string, JobInfo>();
        for (const job of pastJobsData) {
          pastJobsMap.set(job.id, {
            ...job,
            startTime: new Date(job.startTime),
            endTime: job.endTime ? new Date(job.endTime) : undefined,
            lastActivityTime: job.lastActivityTime ? new Date(job.lastActivityTime) : undefined
          } as JobInfo);
        }

        pastJobsStore.set(pastJobsMap);
        console.info(`[JobPollingService] Updated past jobs store with ${pastJobsMap.size} jobs`);
      }
    } catch (error) {
      console.error('[JobPollingService] Error fetching past jobs:', error);
    }
  }

  // Subscribe to active job count changes and automatically start/stop polling
  activeJobCount.subscribe((count) => {
    if (count > 0 && !isPolling) {
      startPolling();
    } else if (count === 0 && isPolling) {
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

// Create and export the polling service
export const jobPollingService = createJobPollingService();

// Helper function to get active job for a specific feature
export function getActiveJobForFeature(feature: string): JobInfo | null {
  const activeJobs = get(activeJobsStore);
  return activeJobs.get(feature) || null;
}

// Helper function to get past jobs for a specific feature
export function getPastJobsForFeature(feature: string): Array<JobInfo> {
  const pastJobs = get(pastJobsStore);
  return Array.from(pastJobs.values()).filter((job) => job.feature === feature);
}
