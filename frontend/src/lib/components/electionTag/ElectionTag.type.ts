import type { Election } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';
export type ElectionTagProps = SvelteHTMLElements['span'] & {
  /**
   * The `Election` object
   */
  election: Election;
  /**
   * Whether to use an abbreviation or the full name. @default 'short'
   */
  variant?: 'short' | 'full';
};
