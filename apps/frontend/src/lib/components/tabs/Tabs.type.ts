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
   * Callback for when the active tab changes. The event `details` contains the active tab as `tab` as well as its `index`.
   */
  onChange?: (details: { index?: number; tab: Tab }) => void;
  /**
   * Opt-in: when `true`, the local `activeIndex` state mutation on tab switch is wrapped in a View Transition (cross-fade), gated by `shouldAnimate`. Use for tabs that switch via LOCAL state (e.g. the entity-detail drawer) where the global root-layout `onNavigate` hook never fires. Navigation-driven tab callsites should leave this `false` (the default) so the global hook owns their animation. @default false
   */
  transitionOnChange?: boolean;
};

export interface Tab {
  label: string;
}
