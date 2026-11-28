import type { Tab } from './Tabs.type';

/**
 * The key a `Tabs` component matches its `activeTab` against: the tab's `id`, or its `label` when it has none.
 */
export function tabKey(tab: Tab): string {
  return tab.id ?? tab.label;
}

/**
 * The tab a `Tabs` component shows as active: the one whose `tabKey` equals `activeTab`, or else the first tab.
 */
export function resolveActiveTab<TTab extends Tab>(tabs: Array<TTab>, activeTab: string | undefined): TTab | undefined {
  return tabs.find((tab) => tabKey(tab) === activeTab) ?? tabs[0];
}
