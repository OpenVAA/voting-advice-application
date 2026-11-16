import type { SvelteHTMLElements } from 'svelte/elements';
import type { JobMessage } from '$lib/server/admin/jobs/jobStore.type';

export type WarningMessagesProps = SvelteHTMLElements['div'] & {
  /**
   * Array of warning messages to display. @default []
   */
  warnings?: Array<JobMessage>;
  /**
   * Array of error messages to display. @default []
   */
  errors?: Array<JobMessage>;
};
