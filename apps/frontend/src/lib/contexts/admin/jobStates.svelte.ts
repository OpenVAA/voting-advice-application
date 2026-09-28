import { log } from '@openvaa/app-shared';
import { ADMIN_FEATURES } from '$lib/admin/features';
import { UNIVERSAL_API_ROUTES } from '$lib/api/base/universalApiRoutes';
import { compareDates } from '$lib/utils/sorting';
import type { AdminFeature } from '$lib/admin/features';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';
import type { JobStates } from './jobStates.type';

/**
 * The job-polling store as a Svelte 5 CLASS (`JobStatesProvider`).
 *
 * The reactive core is the private `#jobs` `$state` Map registry + the three private `$derived` projections (`#pastJobs` / `#activeJobsByFeature` / `#pastJobsByFeature`), exposed as READ-ONLY PROTOTYPE GETTERS so reads via `instance.X` re-invoke the getter in the tracking scope and keep the projections reactive.
 *
 * `startPolling` / `stopPolling` are ARROW-FUNCTION FIELDS so they survive `const { startPolling } = instance` detach (they capture `this`) — both are returned to and called by consumers (`WithPolling.svelte`). `#fetchAndUpdateJobs` is a PRIVATE arrow field (read only by `startPolling`; not on the `JobStates` surface).
 *
 * Self-contained; no `$effect` → constructible outside any effect context, unlike the orchestrator providers (adminContext / candidateContext). It polls its own URLs and takes no constructor deps.
 *
 * Field-init order: `#pastJobs` is declared BEFORE `#pastJobsByFeature` because the latter reads the former.
 *
 * @internal — do not construct directly; use the `jobStates()` factory.
 */
export class JobStatesProvider implements JobStates {
  /////////////////////////////////////////////////
  // Polling
  /////////////////////////////////////////////////

  #pollInterval: NodeJS.Timeout | undefined;
  /**
   * Keep track of the last update for past jobs with an ISO timestamp. Works as a delta cursor, so we don't fetch the same data again.
   */
  #lastPastJobsUpdate: string | undefined;

  /////////////////////////////////////////////////
  // Jobs state
  /////////////////////////////////////////////////

  /**
   * This internal $state holds all job information.
   */
  #jobs = $state<Map<string, JobInfo>>(new Map());

  #pastJobs = $derived(
    [...this.#jobs.values()].filter((j) => !isActive(j)).sort((a, b) => compareDates(a.startTime, b.startTime))
  );

  #activeJobsByFeature = $derived.by(() => {
    const map = new Map<AdminFeature, JobInfo | undefined>();
    for (const feat of ADMIN_FEATURES) {
      const job = [...this.#jobs.values()].find((j) => j.jobType === feat && isActive(j));
      if (job) map.set(feat, job);
    }
    return map;
  });

  #pastJobsByFeature = $derived.by(() => {
    const map = new Map<AdminFeature, Array<JobInfo>>();
    for (const feat of ADMIN_FEATURES) {
      map.set(feat, [...this.#pastJobs.filter((j) => j.jobType === feat)]);
    }
    return map;
  });

  startPolling = () => {
    if (this.#pollInterval) return;
    log.debug('[JobPollingService] Starting polling...');
    // Poll every 2 seconds
    this.#pollInterval = setInterval(async () => {
      await this.#fetchAndUpdateJobs();
    }, 2000);

    // Fetch immediately on start
    this.#fetchAndUpdateJobs();
  };

  stopPolling = () => {
    if (!this.#pollInterval) return;
    log.debug('[JobPollingService] Stopping polling service...');
    clearInterval(this.#pollInterval);
    this.#pollInterval = undefined;
  };

  /////////////////////////////////////////////////
  // Update jobs
  /////////////////////////////////////////////////

  // Fetch jobs from API and update state
  #fetchAndUpdateJobs = async () => {
    try {
      log.debug('[JobPollingService] Fetching jobs...');

      // Always fetch all active jobs (no delta)
      const activeUrl = new URL(UNIVERSAL_API_ROUTES.jobsActive, window.location.origin);

      // Use delta updates for past jobs
      const pastUrl = new URL(UNIVERSAL_API_ROUTES.jobsPast, window.location.origin);
      if (this.#lastPastJobsUpdate) {
        pastUrl.searchParams.set('startFrom', this.#lastPastJobsUpdate);
      }

      // Fetch both in parallel
      const [activeRes, pastRes] = await Promise.all([fetch(activeUrl.toString()), fetch(pastUrl.toString())]);

      if (!activeRes.ok) throw new Error('Failed to fetch active jobs');
      if (!pastRes.ok) throw new Error('Failed to fetch past jobs');

      let [activeJobs, pastJobsData] = (await Promise.all([activeRes.json(), pastRes.json()])) as [
        Array<JobInfo>,
        Array<JobInfo>
      ];

      // Update the delta cursor for past jobs only after a successful parse, so a JSON parse failure does not advance the cursor past jobs we never managed to read.
      this.#lastPastJobsUpdate = new Date().toISOString();

      // Filter by known job names
      activeJobs = activeJobs.filter(filterByKnownNames);
      pastJobsData = pastJobsData.filter(filterByKnownNames);

      // Handle case where a job lands in both active and past jobs (rare but possible)
      const pastIds = new Set(pastJobsData.map((j) => j.id));
      activeJobs = activeJobs.filter((j) => !pastIds.has(j.id));

      // Update the jobs state by creating a new Map
      const newJobs = new Map(this.#jobs);
      pastJobsData.forEach((job) => newJobs.set(job.id, job));
      activeJobs.forEach((job) => newJobs.set(job.id, job));
      this.#jobs = newJobs;
    } catch (error) {
      console.error('[JobPollingService] Error fetching jobs:', error);
    }
  };

  get activeJobsByFeature() {
    return this.#activeJobsByFeature;
  }
  get pastJobs() {
    return this.#pastJobs;
  }
  get pastJobsByFeature() {
    return this.#pastJobsByFeature;
  }
}

/**
 * Initialize the `JobStates` object.
 *
 * Factory wrapper for `adminContext`'s `const jobs = jobStates()` call site.
 */
export function jobStates(): JobStates {
  return new JobStatesProvider();
}

function isActive(job: JobInfo): boolean {
  return job.status === 'running' || job.status === 'aborting';
}

function filterByKnownNames(job: JobInfo): boolean {
  const ok = ADMIN_FEATURES.includes(job.jobType);
  if (!ok) log.debug(`[JobPollingService] Ignoring unknown job: ${job.jobType}`);
  return ok;
}
