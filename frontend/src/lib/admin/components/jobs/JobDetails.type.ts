import type { SvelteHTMLElements } from 'svelte/elements';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';

export type JobDetailsProps = SvelteHTMLElements['article'] & {
  job: JobInfo;
  onAbortJob?: (jobId: string) => void;
  /** Max messages retained/shown per list (cap). @default 1000 */
  maxMessages?: number;
  /** Height class for scroll area. @default 'max-h-64' */
  messagesHeight?: string;
};
