import type { Tab } from './Tabs.type';

/**
 * The key a `Tabs` component matches its `activeTab` against: the tab's `id`, or its `label` when it has none.
 */
export function tabKey(tab: Tab): string {
  return tab.id ?? tab.label;
}
