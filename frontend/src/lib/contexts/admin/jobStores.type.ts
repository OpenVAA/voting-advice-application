import type { Readable, Writable } from 'svelte/store';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';
import type { PollingService } from './pollingService.type';

export type JobStores = {
  /**
   * Store for active jobs by feature (one active job per feature)
   */
  activeJobsStore: Writable<Map<string, JobInfo | null>>;
  /**
   * Derived store for active job count
   */
  activeJobCount: Readable<number>;
  /**
   * Store for past jobs by jobId (multiple jobs per feature possible)
   */
  pastJobsStore: Writable<Map<string, JobInfo>>;
  /**
   * Smart polling service that automatically starts/stops based on active job count
   */
  pollingService: PollingService;
  /**
   * Helper function to get active job for a specific feature.
   */
  getActiveJobForFeature(feature: string): JobInfo | null;
  /**
   * Helper function to get past jobs for a specific feature.
   */
  getPastJobsForFeature(feature: string): Array<JobInfo>;
};
