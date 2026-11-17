/**
 * `Tabs.svelte` marks the tab whose `id ?? label` equals `activeTab`, falls back to the first tab, and hands the activated tab to `onChange`.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tabKey } from './tabKey';
import Tabs from './Tabs.svelte';
import type { Tab } from './Tabs.type';

type TestTab = Tab & { extra: number };

const TABS: Array<TestTab> = [
  { id: 'info', label: 'Basic info', extra: 1 },
  { id: 'opinions', label: 'Opinions', extra: 2 },
  { label: 'Unkeyed', extra: 3 }
];

let component: ReturnType<typeof mount> | undefined;
let target: HTMLElement;

afterEach(() => {
  if (component) unmount(component);
  component = undefined;
  target?.remove();
});

function render(props: { activeTab?: string; onChange?: (tab: TestTab) => void }): Array<HTMLElement> {
  target = document.body.appendChild(document.createElement('div'));
  component = mount(Tabs<TestTab>, { target, props: { tabs: TABS, ...props } });
  flushSync();
  return Array.from(target.querySelectorAll<HTMLElement>('[role="tab"]'));
}

function activeLabels(tabs: Array<HTMLElement>): Array<string> {
  return tabs.filter((tab) => tab.classList.contains('bg-base-100')).map((tab) => tab.textContent!.trim());
}

describe('tabKey', () => {
  it('is the id when present and the label otherwise', () => {
    expect(tabKey({ id: 'a', label: 'A' })).toBe('a');
    expect(tabKey({ label: 'A' })).toBe('A');
  });
});

describe('Tabs', () => {
  it('marks the tab whose id matches activeTab', () => {
    expect(activeLabels(render({ activeTab: 'opinions' }))).toEqual(['Opinions']);
  });

  it('matches a tab without an id by its label', () => {
    expect(activeLabels(render({ activeTab: 'Unkeyed' }))).toEqual(['Unkeyed']);
  });

  it('does not match a keyed tab by its label', () => {
    expect(activeLabels(render({ activeTab: 'Opinions' }))).toEqual(['Basic info']);
  });

  it('falls back to the first tab when activeTab is unset or matches no tab', () => {
    expect(activeLabels(render({}))).toEqual(['Basic info']);
    unmount(component!);
    target.remove();
    expect(activeLabels(render({ activeTab: 'missing' }))).toEqual(['Basic info']);
  });

  it('activates a clicked tab and passes the tab object to onChange', () => {
    const onChange = vi.fn();
    const tabs = render({ onChange });
    tabs[1].click();
    flushSync();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(TABS[1]);
    expect(activeLabels(tabs)).toEqual(['Opinions']);
  });

  it('activates a tab from the keyboard', () => {
    const onChange = vi.fn();
    const tabs = render({ onChange });
    tabs[2].dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(TABS[2]);
    expect(activeLabels(tabs)).toEqual(['Unkeyed']);
  });
});
