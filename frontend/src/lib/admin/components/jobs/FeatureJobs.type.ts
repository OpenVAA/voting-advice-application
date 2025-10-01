import type { SvelteHTMLElements } from 'svelte/elements';
import type { AdminFeature } from '$lib/admin/features';

export type FeatureJobsProps = SvelteHTMLElements['section'] & {
  feature: AdminFeature;
  /** Callback to abort a job. @default undefined */
  onAbortJob?: (jobId: string) => void;
  /** Whether to show the "Go to Feature" link. @default true */
  showFeatureLink?: boolean;
};
