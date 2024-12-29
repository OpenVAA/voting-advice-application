import type { SvelteHTMLElements } from 'svelte/elements';
export type TabsProps = SvelteHTMLElements['ul'] & {
  /**
   * The titles and other data related to the tabs.
   */
  tabs: Array<Tab>;
  /**
   * The index of the active tab. Bind to this to change or read the active tab. @default tabs[0]
   */
  activeIndex?: number;
  /**
   * Callback for when the active tab changes. The event `details` contains the active tab as `tab` as well as its `index`. Note, it's preferable to just bind to the `activeTab` property instead.
   */
  onChange?: (details: { index?: number; tab: Tab }) => void;
};

export interface Tab {
  label: string;
}
