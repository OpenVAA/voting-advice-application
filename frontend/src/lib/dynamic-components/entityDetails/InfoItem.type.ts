import type { SvelteHTMLElements } from 'svelte/elements';

export type InfoItemProps = SvelteHTMLElements['div'] & {
  /**
   * The label of the information.
   */
  label: string;
  /**
   * Layout mode for the item. @default false
   */
  vertical?: boolean;
};
