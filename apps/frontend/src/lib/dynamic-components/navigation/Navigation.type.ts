import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';

export type NavigationProps = SvelteHTMLElements['nav'] & {
  /**
   * The content of the navigation menu.
   */
  children?: Snippet;
  /**
   * Set to `true` to whenever the navigation is hidden. @default false
   */
  hidden?: boolean;
  /**
   * Callback fired when the component loses keyboard focus.
   * This can be used to automatically close a drawer menu.
   */
  onKeyboardFocusOut?: () => void;
};
