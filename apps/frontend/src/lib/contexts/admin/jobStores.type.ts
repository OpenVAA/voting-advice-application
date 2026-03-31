import type { AdminFeature } from '$lib/admin/features';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';

export type JobStores = {
  /**
   * Active jobs by feature (one active job per feature)
   */
  readonly activeJobsByFeature: Map<AdminFeature, JobInfo | undefined>;
  /**
   * Past jobs as an array, sorted by creation date (oldest first)
   */
  readonly pastJobs: Array<JobInfo>;
  /**
   * Past jobs by feature (multiple jobs per feature possible)
   */
  readonly pastJobsByFeature: Map<AdminFeature, Array<JobInfo>>;

  /**
   * Temporary method to start polling for new jobs
   * TODO[Svelte 5]: Count subscriptions to $state and automatically start and stop polling.
   */
  startPolling: () => void;
  /**
   * Temporary method to stop polling for new jobs
   * TODO[Svelte 5]: Count subscriptions to $state and automatically start and stop polling.
   */
  stopPolling: () => void;
};
