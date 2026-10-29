import type { SvelteHTMLElements } from 'svelte/elements';

export type ReadFailureProps = SvelteHTMLElements['div'] & {
  /**
   * The error message the view is headed with. @default t('error.default')
   */
  title?: string;
};
