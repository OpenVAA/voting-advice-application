import { derived, get, writable } from 'svelte/store';
import { createPollingService } from './pollingService';
import type { AdminJobName } from '$lib/admin/features';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';
import type { JobStores } from './jobStores.type';

/**
 * Initialize the `JobStores` object.
 */
export function jobStores(): JobStores {
  const activeJobsStore = writable<Map<string, JobInfo | null>>(new Map());

  const pastJobsStore = writable<Map<string, JobInfo>>(new Map());

  const activeJobCount = derived(activeJobsStore, ($activeJobs) => {
    let count = 0;
    for (const job of $activeJobs.values()) {
      if (job !== null) {
        count++;
      }
    }
    return count;
  });

  const pollingService = createPollingService({
    activeJobsStore,
    pastJobsStore
  });

  function getActiveJobForFeature(jobType: AdminJobName): JobInfo | null {
    const activeJobs = get(activeJobsStore);
    return activeJobs.get(jobType) || null;
  }

  function getPastJobsForFeature(jobType: AdminJobName): Array<JobInfo> {
    const pastJobs = get(pastJobsStore);
    return Array.from(pastJobs.values()).filter((job) => job.jobType === jobType);
  }

  return {
    activeJobsStore,
    pastJobsStore,
    activeJobCount,
    pollingService,
    getActiveJobForFeature,
    getPastJobsForFeature
  };
}
