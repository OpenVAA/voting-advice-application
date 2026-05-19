import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';

export type WarningProps = SvelteHTMLElements['div'] & {
  /**
   * The contents of the warning.
   */
  children?: Snippet;
};
