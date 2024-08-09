import type { SvelteHTMLElements } from 'svelte/elements';

export type NavGroupProps = SvelteHTMLElements['ul'] & {
  /**
   * Optional title for the navigation group.
   */
  title?: string;
};
