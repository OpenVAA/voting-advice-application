import type { Readable } from 'svelte/store';
import type { AdminFeature } from '$lib/admin/features';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';

export type JobStores = {
  /**
   * Store for active jobs by feature (one active job per feature)
   */
  activeJobsByFeature: Readable<Map<AdminFeature, JobInfo | undefined>>;
  /**
   * Store for past jobs as an array, sorted by creation date (oldest first)
   */
  pastJobs: Readable<Array<JobInfo>>;
  /**
   * Store for past jobs by feature (multiple jobs per feature possible)
   */
  pastJobsByFeature: Readable<Map<AdminFeature, Array<JobInfo>>>;

  /**
   * Temporary method to start polling for new jobs
   * TODO[Svelte 5]: Count subscriptions to stores (or $states) and automatically start and stop polling.
   */
  startPolling: () => void;
  /**
   * Temporary method to stop polling for new jobs
   * TODO[Svelte 5]: Count subscriptions to stores (or $states) and automatically start and stop polling.
   */
  stopPolling: () => void;
};
