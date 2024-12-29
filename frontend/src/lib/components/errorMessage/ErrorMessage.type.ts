import type { SvelteHTMLElements } from 'svelte/elements';
export type ErrorMessageProps = SvelteHTMLElements['div'] & {
  /**
   * Whether to show an inline version of the spinner. By default the spinner tries to center itself in the available area. @default false
   */
  inline?: boolean;
  /**
   * The error message to display. @default `$t('error.default')`
   */
  message?: string | null;
};
