/**
 * The results election-tab layout, mounted for real against a fake voter context, deciding between its children and the select-an-election prompt.
 *
 * The children are a marker snippet. `page.params` comes from the `$app/state` stub, which each test sets before mounting. The fake context's `t` returns its key.
 *
 * 1. **A resolved election** renders the children.
 * 2. **No election and no drawer** renders the prompt instead.
 * 3. **The bare-`/results` drawer**: a card link with no election segment puts its plural into the freeform `electionTab`, so no election resolves, and the children still render because the URL opens an entity drawer.
 */

import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from '$app/state';

const ELECTION = { id: 'election-1', name: 'Election 1', info: '' };

const box = {
  currentResultsElection: undefined as typeof ELECTION | undefined
};

const context = {
  t: (key: string) => key,
  answers: { answers: {} },
  getRoute: { current: () => '/' },
  track: () => undefined,
  startFeedbackPopupCountdown: () => undefined,
  startSurveyPopupCountdown: () => undefined,
  get appSettings() {
    return {
      results: { showFeedbackPopup: null, showSurveyPopup: null },
      survey: undefined,
      matching: { minimumAnswers: 1 }
    };
  },
  get selectedElections() {
    return [ELECTION];
  },
  get currentResultsElection() {
    return box.currentResultsElection;
  },
  get currentResultsEntityType() {
    return undefined;
  },
  get resultsAvailable() {
    return true;
  },
  get nominationsAvailable() {
    return { [ELECTION.id]: true };
  },
  get dataRoot() {
    return { elections: [ELECTION] };
  }
};

vi.mock('$lib/contexts/voter', () => ({ getVoterContext: () => context }));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: context.t, darkMode: { current: false } })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({
    video: { hasContent: false },
    setRouteTitle: () => undefined,
    pageStyles: { use: () => undefined },
    topBarSettings: { use: () => undefined }
  })
}));

// jsdom ships no `window.matchMedia`, and `svelte/motion` reads it when it is imported through the `$layouts/main` barrel. The stub answers "no preference".
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false
    })
  });
}

const ElectionTabLayout = (await import('./+layout.svelte')).default;

const CHILDREN_TEST_ID = 'election-tab-children';

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  box.currentResultsElection = undefined;
  page.params = {};
});

/** Mount the layout with a marker snippet as its children and run its effects. */
function render(): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const children = createRawSnippet(() => ({ render: () => `<div data-testid="${CHILDREN_TEST_ID}"></div>` }));
  const component = mount(ElectionTabLayout, { target, props: { children } });
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  flushSync();
  return target;
}

function rendersChildren(target: HTMLElement): boolean {
  return target.querySelector(`[data-testid="${CHILDREN_TEST_ID}"]`) !== null;
}

describe('the results election-tab layout', () => {
  it('renders its children for a resolved election', () => {
    box.currentResultsElection = ELECTION;
    page.params = { electionTab: ELECTION.id };
    const target = render();
    expect(rendersChildren(target)).toBe(true);
    expect(target.textContent).not.toContain('results.selectElectionFirst');
  });

  it('renders the select-an-election prompt when no election resolves and no drawer is open', () => {
    page.params = { electionTab: 'candidates' };
    const target = render();
    expect(rendersChildren(target)).toBe(false);
    expect(target.textContent).toContain('results.selectElectionFirst');
  });

  it('renders its children for a drawer opened from a bare /results card, whose plural fills the election segment', () => {
    page.params = { electionTab: 'candidates', entity: 'candidate', id: 'candidate-1' };
    const target = render();
    expect(rendersChildren(target)).toBe(true);
    expect(target.textContent).not.toContain('results.selectElectionFirst');
  });
});
