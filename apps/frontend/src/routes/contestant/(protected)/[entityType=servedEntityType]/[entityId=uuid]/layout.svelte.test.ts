/**
 * The Contestant App's entity layout, mounted for real against a fake contestant context, with the real `ReadFailure` below it.
 *
 * What this file holds: a load that answers a failed read, and data the layout cannot use, are both shown as the read-failure view in place of the page, and nothing is applied to the data root or the user data; usable data renders the page and applies both.
 */

import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import type { RouteOptions } from '$lib/routes';

const { init, leaveEntity, setDataRoot } = vi.hoisted(() => ({
  init: vi.fn(),
  leaveEntity: vi.fn(),
  setDataRoot: vi.fn()
}));

const context = {
  t: (key: string) => key,
  getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
  logout: async () => undefined,
  setDataRoot,
  userData: { init, leaveEntity, savedEntityData: undefined },
  appSettings: { admin: { email: 'support@example.org' }, contestantApp: { entityTypes: ['candidate'] } },
  answersLocked: false,
  tasks: [],
  unansweredRequiredInfoQuestions: [],
  unansweredOpinionQuestions: []
};

vi.mock('$lib/contexts/contestant/contestantContext.svelte', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

// jsdom has no `window.matchMedia`, and `svelte/motion` reads it when the logout button's modal is imported. The stub answers "no preference".
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

const Layout = (await import('./+layout.svelte')).default;

const READ_FAILURE = '[data-testid="contestant-read-failure"]';
const PAGE = '[data-testid="the-page"]';

const USER = { id: 'user-1' };
const USER_DATA = {
  entity: { type: 'candidate', id: '11111111-1111-4111-8111-111111111111' },
  nominations: []
};

let teardown: Array<() => void> = [];

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

/** Mount the layout over the given load data and return the element it was mounted into. */
function render(data: Record<string, unknown>): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const children = createRawSnippet(() => ({ render: () => '<p data-testid="the-page">page</p>' }));
  const component = mount(Layout, { target, props: { data, children } as never });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

describe('routes/contestant/(protected)/[entityType]/[entityId]/+layout.svelte — a read that failed', () => {
  it.each([
    ['a load that answers a failed read', { user: USER, entityReadFailed: true }],
    [
      'a failed question read',
      { user: USER, questionData: new Error('questions unavailable'), contestantUserData: USER_DATA }
    ],
    [
      'user data without an entity',
      { user: USER, questionData: { categories: [], questions: [] }, contestantUserData: {} }
    ]
  ] as const)('shows the read-failure view in place of the page for %s, and applies nothing', (_, data) => {
    const target = render({ ...data });

    expect(target.querySelector(READ_FAILURE)).not.toBeNull();
    expect(target.querySelector(PAGE)).toBeNull();
    expect(setDataRoot).not.toHaveBeenCalled();
    expect(init).not.toHaveBeenCalled();
  });
});

describe('routes/contestant/(protected)/[entityType]/[entityId]/+layout.svelte — usable data', () => {
  it('renders the page, not the view, and applies the data', () => {
    const target = render({
      user: USER,
      questionData: { categories: [], questions: [] },
      contestantUserData: USER_DATA
    });

    expect(target.querySelector(PAGE)).not.toBeNull();
    expect(target.querySelector(READ_FAILURE)).toBeNull();
    expect(setDataRoot).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledWith(USER_DATA, USER.id);
  });
});
