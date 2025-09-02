import type { SvelteHTMLElements } from 'svelte/elements';
import type { AdminFeature } from '$lib/admin/features';

export type FeatureJobsProps = SvelteHTMLElements['section'] & {
  feature: AdminFeature;
  /** Max messages retained/shown per list (cap). @default 1000 */
  maxMessages?: number;
  /** Height class for each job's message scroll area. @default 'max-h-64' */
  messagesHeight?: string;
  /** Callback to abort a job. @default undefined */
  onAbortJob?: (jobId: string) => void;
  /** Whether to show the "Go to Feature" link. @default true */
  showFeatureLink?: boolean;
};
