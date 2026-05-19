import type { SvelteHTMLElements } from 'svelte/elements';
import type { JobMessage } from '$lib/server/admin/jobs/jobStore.type';

export type InfoMessagesProps = SvelteHTMLElements['div'] & {
  /**
   * Array of informational messages to display. @default []
   */
  messages?: Array<JobMessage>;
};
