import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';

export type NavGroupProps = SvelteHTMLElements['section'] & {
  /**
   * The contents of the navigation group.
   */
  children?: Snippet;
  /**
   * Optional title for the navigation group.
   */
  title?: string;
};
