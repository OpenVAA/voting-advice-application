import type { SvelteHTMLElements } from 'svelte/elements';
export type TabsProps = SvelteHTMLElements['ul'] & {
  /**
   * The titles of the tabs.
   */
  tabs: Array<string>;
  /**
   * The index of the active tab. Bind to this to change or read the active tab. @default 0
   */
  activeIndex?: number;
};
