import type { SvelteHTMLElements } from 'svelte/elements';
export type ErrorMessageProps = SvelteHTMLElements['div'] & {
  /**
   *Whether to show an inline version of the message. By default the message tries to center itself in the available area and displays a large emoji. @default false
   */
  inline?: boolean;
  /**
   * The message to display. @default `$t('error.default')`
   */
  message?: string | null;
};
