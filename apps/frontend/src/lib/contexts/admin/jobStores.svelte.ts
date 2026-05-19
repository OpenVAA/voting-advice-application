import { ADMIN_FEATURES } from '$lib/admin/features';
import { UNIVERSAL_API_ROUTES } from '$lib/api/base/universalApiRoutes';
import { logDebugError } from '$lib/utils/logger';
import { compareDates } from '$lib/utils/sorting';
import type { AdminFeature } from '$lib/admin/features';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';
import type { JobStores } from './jobStores.type';

/**
 * Initialize the `JobStores` object.
 */
export function jobStores(): JobStores {
  /////////////////////////////////////////////////
  // Polling
  /////////////////////////////////////////////////

  let pollInterval: NodeJS.Timeout | undefined;
  /**
   * Keep track of the last update for past jobs with an ISO timestamp. Works as a delta cursor, so we don't fetch the same data again.
   */
  let lastPastJobsUpdate: string | undefined;

  function startPolling() {
    if (pollInterval) return;
    logDebugError('[JobPollingService] Starting polling...');
    // Poll every 2 seconds
    pollInterval = setInterval(async () => {
      await fetchAndUpdateJobs();
    }, 2000);

    // Fetch immediately on start
    fetchAndUpdateJobs();
  }

  function stopPolling() {
    if (!pollInterval) return;
    logDebugError('[JobPollingService] Stopping polling service...');
    clearInterval(pollInterval);
    pollInterval = undefined;
  }

  /////////////////////////////////////////////////
  // Jobs state
  /////////////////////////////////////////////////

  /**
   * This internal $state holds all job information.
   */
  let jobs = $state<Map<string, JobInfo>>(new Map());

  const _pastJobs = $derived(
    [...jobs.values().filter((j) => !isActive(j))].sort((a, b) => compareDates(a.startTime, b.startTime))
  );

  const _activeJobsByFeature = $derived.by(() => {
    const map = new Map<AdminFeature, JobInfo | undefined>();
    for (const feat of ADMIN_FEATURES) {
      const job = jobs.values().find((j) => j.jobType === feat && isActive(j));
      if (job) map.set(feat, job);
    }
    return map;
  });

  const _pastJobsByFeature = $derived.by(() => {
    const map = new Map<AdminFeature, Array<JobInfo>>();
    for (const feat of ADMIN_FEATURES) {
      map.set(feat, [..._pastJobs.filter((j) => j.jobType === feat)]);
    }
    return map;
  });

  /////////////////////////////////////////////////
  // Update jobs
  /////////////////////////////////////////////////

  // Fetch jobs from API and update state
  async function fetchAndUpdateJobs() {
    try {
      logDebugError('[JobPollingService] Fetching jobs...');

      // Always fetch all active jobs (no delta)
      const activeUrl = new URL(UNIVERSAL_API_ROUTES.jobsActive, window.location.origin);

      // Use delta updates for past jobs
      const pastUrl = new URL(UNIVERSAL_API_ROUTES.jobsPast, window.location.origin);
      if (lastPastJobsUpdate) {
        pastUrl.searchParams.set('startFrom', lastPastJobsUpdate);
      }

      // Fetch both in parallel
      const [activeRes, pastRes] = await Promise.all([fetch(activeUrl.toString()), fetch(pastUrl.toString())]);

      if (!activeRes.ok) throw new Error('Failed to fetch active jobs');
      if (!pastRes.ok) throw new Error('Failed to fetch past jobs');

      // Update the delta cursor for past jobs
      lastPastJobsUpdate = new Date().toISOString();

      let [activeJobs, pastJobsData] = (await Promise.all([activeRes.json(), pastRes.json()])) as [
        Array<JobInfo>,
        Array<JobInfo>
      ];

      // Filter by known job names
      activeJobs = activeJobs.filter(filterByKnownNames);
      pastJobsData = pastJobsData.filter(filterByKnownNames);

      // Handle case where a job lands in both active and past jobs (rare but possible)
      const pastIds = new Set(pastJobsData.map((j) => j.id));
      activeJobs = activeJobs.filter((j) => !pastIds.has(j.id));

      // Update the jobs state by creating a new Map
      const newJobs = new Map(jobs);
      pastJobsData.forEach((job) => newJobs.set(job.id, job));
      activeJobs.forEach((job) => newJobs.set(job.id, job));
      jobs = newJobs;
    } catch (error) {
      console.error('[JobPollingService] Error fetching jobs:', error);
    }
  }

  return {
    get activeJobsByFeature() {
      return _activeJobsByFeature;
    },
    get pastJobs() {
      return _pastJobs;
    },
    get pastJobsByFeature() {
      return _pastJobsByFeature;
    },
    startPolling,
    stopPolling
  };
}

function isActive(job: JobInfo): boolean {
  return job.status === 'running' || job.status === 'aborting';
}

function filterByKnownNames(job: JobInfo): boolean {
  const ok = ADMIN_FEATURES.includes(job.jobType);
  if (!ok) logDebugError(`[JobPollingService] Ignoring unknown job: ${job.jobType}`);
  return ok;
}
