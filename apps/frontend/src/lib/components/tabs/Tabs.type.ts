import type { SvelteHTMLElements } from 'svelte/elements';

export type TabsProps<TTab extends Tab = Tab> = SvelteHTMLElements['ul'] & {
  /**
   * The tabs to show, in order.
   */
  tabs: Array<TTab>;
  /**
   * The key of the active tab, matched against each tab's `id ?? label` (see `tabKey`). Bind to this to change or read the active tab. When it is unset or matches no tab, the first tab is active. @default the first tab
   */
  activeTab?: string;
  /**
   * Callback for when the user activates a tab, called with that tab — the same object passed in `tabs`, so its extra properties are available without a lookup.
   */
  onChange?: (tab: TTab) => void;
  /**
   * Opt-in: when `true`, the local `activeTab` state mutation on tab switch is wrapped in a View Transition (cross-fade), gated by `shouldAnimate`. Use for tabs that switch via LOCAL state (e.g. the entity-detail drawer) where the global root-layout `onNavigate` hook never fires. Navigation-driven tab callsites should leave this `false` (the default) so the global hook owns their animation. @default false
   */
  transitionOnChange?: boolean;
};

export interface Tab {
  /** The visible title of the tab. */
  label: string;
  /** A stable key for the tab, independent of the localized `label`. @default label */
  id?: string;
}
