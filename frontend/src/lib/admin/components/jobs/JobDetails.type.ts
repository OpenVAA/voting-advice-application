import type { SvelteHTMLElements } from 'svelte/elements';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';

export type JobDetailsProps = SvelteHTMLElements['article'] & {
  job: JobInfo;
  onAbortJob?: (jobId: string) => void;
};
