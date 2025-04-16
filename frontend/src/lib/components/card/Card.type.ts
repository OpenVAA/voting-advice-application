import type { SvelteHTMLElements } from 'svelte/elements';

export type CardProps = SvelteHTMLElements['div'] & {
  /**
   * Additional classes to apply to the card.
   */
  class?: string;
};
