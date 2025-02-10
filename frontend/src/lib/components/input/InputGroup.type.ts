import type { SvelteHTMLElements } from 'svelte/elements';

export type InputGroupProps = SvelteHTMLElements['fieldset'] & {
  /**
   * Optional title for the group.
   */
  title?: string;
  /**
   * Optional info text for the group.
   */
  info?: string;
};
