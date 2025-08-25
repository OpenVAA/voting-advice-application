import { derived, get, writable } from 'svelte/store';
import { createPollingService } from './pollingService';
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

  function getActiveJobForFeature(feature: string): JobInfo | null {
    const activeJobs = get(activeJobsStore);
    return activeJobs.get(feature) || null;
  }

  function getPastJobsForFeature(feature: string): Array<JobInfo> {
    const pastJobs = get(pastJobsStore);
    return Array.from(pastJobs.values()).filter((job) => job.feature === feature);
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
