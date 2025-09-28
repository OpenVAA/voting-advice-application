import { writable } from 'svelte/store';
import { ADMIN_FEATURES, type AdminFeature } from '$lib/admin/features';
import { UNIVERSAL_API_ROUTES } from '$lib/api/base/universalApiRoutes';
import { logDebugError } from '$lib/utils/logger';
import { compareDates } from '$lib/utils/sorting';
import { parsimoniusDerived } from '../utils/parsimoniusDerived';
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
  // Jobs stores
  /////////////////////////////////////////////////

  /**
   * This internal store holds all job information.
   */
  const jobs = writable<Map<string, JobInfo>>(
    new Map()
    // TODO[Svelte 5]: Count subscriptions to stores (or $states) and automatically start and stop polling.
    // The code below doesn't work with derived stores, which never automatically unsubscribe nor have a StartStopNotifier argument
    // () => {
    //   startPolling();
    //   return () => stopPolling();
    // }
  );

  const pastJobs = parsimoniusDerived([jobs], ([jobs]) =>
    [...jobs.values().filter((j) => !isActive(j))].sort((a, b) => compareDates(a.startTime, b.startTime))
  );

  const activeJobsByFeature = parsimoniusDerived([jobs], ([jobs]) => {
    const map = new Map<AdminFeature, JobInfo | undefined>();
    for (const feat of ADMIN_FEATURES) {
      const job = jobs.values().find((j) => j.jobType === feat && isActive(j));
      if (job) map.set(feat, job);
    }
    return map;
  });

  const pastJobsByFeature = parsimoniusDerived([pastJobs], ([pastJobs]) => {
    const map = new Map<AdminFeature, Array<JobInfo>>();
    for (const feat of ADMIN_FEATURES) {
      map.set(feat, [...pastJobs.filter((j) => j.jobType === feat)]);
    }
    return map;
  });

  /////////////////////////////////////////////////
  // Update jobs
  /////////////////////////////////////////////////

  // Fetch jobs from API and update stores
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

      let [activeJobs, pastJobs] = (await Promise.all([activeRes.json(), pastRes.json()])) as [
        Array<JobInfo>,
        Array<JobInfo>
      ];

      // Filter by known job names
      activeJobs = activeJobs.filter(filterByKnownNames);
      pastJobs = pastJobs.filter(filterByKnownNames);

      // Handle case where a job lands in both active and past jobs (rare but possible)
      const pastIds = new Set(pastJobs.map((j) => j.id));
      activeJobs = activeJobs.filter((j) => !pastIds.has(j.id));

      logDebugError('[JobPollingService] Got response (deduped):', {
        activeJobsCount: activeJobs.length,
        pastJobsCount: pastJobs.length
      });

      // Update the jobs store
      jobs.update((jobs) => {
        pastJobs.forEach((job) => jobs.set(job.id, job));
        activeJobs.forEach((job) => jobs.set(job.id, job));
        return jobs;
      });
    } catch (error) {
      console.error('[JobPollingService] Error fetching jobs:', error);
    }
  }

  return {
    activeJobsByFeature,
    pastJobs,
    pastJobsByFeature,
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
