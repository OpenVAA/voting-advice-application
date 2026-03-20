import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';

export type InputGroupProps = SvelteHTMLElements['fieldset'] & {
  /**
   * The Input components to group.
   */
  children?: Snippet;
  /**
   * Optional title for the group.
   */
  title?: string;
  /**
   * Optional info text for the group.
   */
  info?: string;
};
