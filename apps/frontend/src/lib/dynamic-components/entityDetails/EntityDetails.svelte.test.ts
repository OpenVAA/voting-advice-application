/**
 * The tabs of `EntityDetails`, with and without its `excludeTabs` prop.
 *
 * The component is the voter app's entity detail and the Contestant App's preview, so the first group pins what it renders when the prop is not passed: the tabs the `entityDetails.contents` setting names for the entity's type, in the setting's order. The second group holds the prop to its contract: it filters that list, a single tab left renders no tab bar, and nothing left renders the `info` and `opinions` tabs.
 *
 * The component is mounted for real, with the real card, tab bar and tab contents below it, against a fake app context and a data root that holds one organization and one candidate with no answers. A message is its key.
 */

import { DataRoot } from '@openvaa/data';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** A tab as the setting names it. */
type TabName = 'info' | 'opinions' | 'children';

/** The `entityDetails.contents` setting the faked app context answers with; replaced per test. */
const fake = vi.hoisted(() => ({
  contents: {} as Partial<Record<'candidate' | 'organization', Array<'info' | 'opinions' | 'children'>>>
}));

const dataRoot = new DataRoot();
dataRoot.provideEntityData([
  { type: 'organization', id: 'organization-1', name: 'Test Party', shortName: 'TP' },
  { type: 'candidate', id: 'candidate-1', firstName: 'Ada', lastName: 'Alpha' }
]);

vi.mock('$lib/contexts/app', () => ({
  getAppContext: () => ({
    appType: { current: 'contestant' },
    getRoute: { current: () => '/results/somewhere' },
    startEvent: () => undefined,
    t: (key: string) => key,
    get appSettings() {
      return {
        entityDetails: {
          contents: fake.contents,
          showMissingElectionSymbol: { candidate: false, organization: false },
          showMissingAnswers: { candidate: false, organization: false }
        },
        results: { cardContents: {}, sections: [] },
        questions: { showCategoryTags: false }
      };
    },
    get dataRoot() {
      return dataRoot;
    }
  })
}));

vi.mock('$lib/contexts/voter', () => ({
  getVoterContext: () => undefined
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

const { default: EntityDetails } = await import('./EntityDetails.svelte');

/** The setting as it is shipped. */
const SHIPPED_CONTENTS = {
  candidate: ['info', 'opinions'],
  organization: ['info', 'children', 'opinions']
} satisfies typeof fake.contents;

const TAB = '[role="tab"]';
/** The element that holds the content of each tab. */
const CONTENT: Record<TabName, string> = {
  info: '[data-testid="voter-entity-detail-info"]',
  opinions: '[data-testid="voter-entity-detail-opinions"]',
  children: '[data-testid="voter-entity-detail-children"]'
};

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  fake.contents = {};
});

/** Mount the details of an entity of the data root under a setting, and return the element they were mounted into. */
function render({
  type,
  contents,
  excludeTabs
}: {
  type: 'candidate' | 'organization';
  contents: typeof fake.contents;
  excludeTabs?: Array<TabName>;
}): HTMLElement {
  fake.contents = contents;
  const target = document.createElement('div');
  document.body.appendChild(target);
  teardown.push(() => target.remove());
  const props = { entity: dataRoot.getEntity(type, `${type}-1`), ...(excludeTabs ? { excludeTabs } : {}) };
  const component = mount(EntityDetails, { target, props: props as never });
  flushSync();
  teardown.push(() => unmount(component));
  return target;
}

/** The tabs of the tab bar, in order, by the name the setting gives each. No tab bar is an empty list. */
function tabsOf(target: HTMLElement): Array<string> {
  return [...target.querySelectorAll(TAB)].map((tab) =>
    (tab.textContent ?? '').trim().replace('entityDetails.tabs.', '')
  );
}

/** The tabs whose content is in the markup. */
function shownContentsOf(target: HTMLElement): Array<TabName> {
  return (Object.keys(CONTENT) as Array<TabName>).filter((name) => target.querySelector(CONTENT[name]) !== null);
}

describe('EntityDetails without excludeTabs', () => {
  it("renders the three tabs of an organization under the shipped setting, in the setting's order", () => {
    const target = render({ type: 'organization', contents: SHIPPED_CONTENTS });

    expect(tabsOf(target)).toEqual(['info', 'children', 'opinions']);
    expect(shownContentsOf(target)).toEqual(['info']);
  });

  it("renders a candidate's tabs as the setting orders them", () => {
    const target = render({ type: 'candidate', contents: { candidate: ['opinions', 'info'] } });

    expect(tabsOf(target)).toEqual(['opinions', 'info']);
    expect(shownContentsOf(target)).toEqual(['opinions']);
  });

  it('renders the same tabs for an empty exclusion', () => {
    const target = render({ type: 'organization', contents: SHIPPED_CONTENTS, excludeTabs: [] });

    expect(tabsOf(target)).toEqual(['info', 'children', 'opinions']);
  });
});

describe('EntityDetails with excludeTabs', () => {
  it("leaves the named tab out of an organization's tabs and keeps the setting's order", () => {
    const target = render({ type: 'organization', contents: SHIPPED_CONTENTS, excludeTabs: ['children'] });

    expect(tabsOf(target)).toEqual(['info', 'opinions']);
    expect(shownContentsOf(target)).toEqual(['info']);
  });

  it('renders no tab bar, and the content of the one tab that is left', () => {
    const target = render({
      type: 'organization',
      contents: { organization: ['children', 'opinions'] },
      excludeTabs: ['children']
    });

    expect(tabsOf(target)).toEqual([]);
    expect(shownContentsOf(target)).toEqual(['opinions']);
  });

  it('renders the info and opinions tabs when every configured tab is excluded', () => {
    const target = render({
      type: 'organization',
      contents: { organization: ['children'] },
      excludeTabs: ['children']
    });

    expect(tabsOf(target)).toEqual(['info', 'opinions']);
    expect(shownContentsOf(target)).toEqual(['info']);
  });

  it('filters the tabs an entity type has under an empty setting', () => {
    const target = render({ type: 'candidate', contents: {}, excludeTabs: ['info'] });

    expect(tabsOf(target)).toEqual([]);
    expect(shownContentsOf(target)).toEqual(['opinions']);
  });
});
