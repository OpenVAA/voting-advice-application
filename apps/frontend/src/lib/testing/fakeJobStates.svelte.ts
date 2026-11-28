import { ADMIN_FEATURES } from '$lib/admin/features';
import type { AdminFeature } from '$lib/admin/features';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';

/**
 * A job of the given feature and status, for a component test.
 *
 * @param id - The job's id.
 * @param status - The job's status.
 * @param jobType - The feature the job belongs to.
 * @returns The job.
 */
export function fakeJob(id: string, status: JobInfo['status'], jobType: AdminFeature): JobInfo {
  return {
    id,
    jobType,
    author: 'admin@openvaa.test',
    status,
    progress: status === 'running' ? 0.5 : 1,
    startTime: '2026-08-31T00:00:00.000Z',
    endTime: status === 'running' || status === 'aborting' ? undefined : '2026-08-31T00:05:00.000Z',
    lastActivityTime: '2026-08-31T00:04:30.000Z',
    infoMessages: [],
    warningMessages: [],
    errorMessages: []
  };
}

function isActive(job: JobInfo): boolean {
  return job.status === 'running' || job.status === 'aborting';
}

/**
 * The reactive shape of `JobStatesProvider` for component tests: a private `$state` registry behind read-only getters over `$derived` values, each of which returns a new collection per recompute. That last part is what makes a destructured read go stale, so a test of a context consumer needs it rather than a `$state` proxy. Construct it inside `$effect.root`.
 */
export class FakeJobStates {
  #jobs = $state<Array<JobInfo>>([]);
  #pastJobs = $derived(this.#jobs.filter((job) => !isActive(job)));
  #activeJobsByFeature = $derived.by(() => {
    const map = new Map<AdminFeature, JobInfo | undefined>();
    for (const feature of ADMIN_FEATURES) {
      const found = this.#jobs.find((job) => job.jobType === feature && isActive(job));
      if (found) map.set(feature, found);
    }
    return map;
  });
  #pastJobsByFeature = $derived.by(() => {
    const map = new Map<AdminFeature, Array<JobInfo>>();
    for (const feature of ADMIN_FEATURES)
      map.set(
        feature,
        this.#pastJobs.filter((job) => job.jobType === feature)
      );
    return map;
  });

  get activeJobsByFeature() {
    return this.#activeJobsByFeature;
  }
  get pastJobs() {
    return this.#pastJobs;
  }
  get pastJobsByFeature() {
    return this.#pastJobsByFeature;
  }

  /** Stand in for a polling tick: replace the registry with a new array. */
  add(job: JobInfo): void {
    this.#jobs = [...this.#jobs, job];
  }
}
