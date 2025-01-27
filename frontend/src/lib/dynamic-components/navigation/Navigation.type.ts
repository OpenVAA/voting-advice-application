import type { SvelteHTMLElements } from 'svelte/elements';

export type NavigationProps = SvelteHTMLElements['nav'] & {
  /**
   * Set to `true` to whenever the navigation is hidden. @default false
   */
  hidden?: boolean;
};
