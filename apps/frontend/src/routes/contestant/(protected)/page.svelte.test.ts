/**
 * The Contestant App's root page, mounted for real against a fake contestant context and a real `DataRoot`, with the real `NothingToEdit`, `MainContent`, `EntityList` and `EntityCard` below it.
 *
 * The fake context's `entities` and `dataRoot` are reactive behind getters, as the real accessors are: `setDataRoot` runs its updater untracked and bumps a version the `dataRoot` getter reads. The data root holds no question, and the settings name one as card content, so a card that looked its questions up would throw.
 *
 * Routes are built with the real `buildRoute` from an empty set of route params, as on a page whose URL names no entity.
 */

import { DataRoot } from '@openvaa/data';
import { flushSync, mount, unmount, untrack } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import type { UserEntity } from '$lib/api/base/dataWriter.type';
import type { RouteOptions } from '$lib/routes';

const ZOE: UserEntity = {
  type: 'candidate',
  id: '11111111-1111-4111-8111-111111111111',
  firstName: 'Zoe',
  lastName: 'Zeta',
  confirmed: true
};
const ADA: UserEntity = {
  type: 'candidate',
  id: '22222222-2222-4222-8222-222222222222',
  firstName: 'Ada',
  lastName: 'Alpha',
  confirmed: false
};
const PARTY: UserEntity = {
  type: 'organization',
  id: '33333333-3333-4333-8333-333333333333',
  name: 'The Example Party',
  confirmed: true
};

const state = $state<{ entities: ReadonlyArray<UserEntity>; version: number }>({ entities: [], version: 0 });

let dataRoot = new DataRoot();
/** How the fake `setDataRoot` treats an updater: it runs it, throws, or reports success having provided nothing. */
let provision: 'run' | 'throw' | 'skip' = 'run';

/** The write the fake `setDataRoot` makes. */
function provide(updater: (dr: DataRoot) => void): void {
  if (provision === 'throw') throw new Error('provision failed');
  if (provision === 'run') updater(dataRoot);
}

const push = vi.fn();
const revert = vi.fn();

const appSettings = {
  admin: { email: 'support@example.org' },
  contestantApp: { entityTypes: ['candidate', 'organization'] },
  results: { cardContents: { candidate: [{ question: 'q1' }], organization: [{ question: 'q1' }] } }
};

const context = {
  appType: { current: 'contestant' },
  t: (key: string) => key,
  getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
  startEvent: () => undefined,
  logout: async () => undefined,
  setDataRoot: (updater: (dr: DataRoot) => void) =>
    untrack(() => {
      provide(updater);
      state.version++;
    }),
  appSettings,
  locale: 'en',
  answersLocked: false,
  unansweredRequiredInfoQuestions: [],
  unansweredOpinionQuestions: [],
  userData: { savedEntityData: undefined },
  user: { email: 'user@example.org' },
  get entities() {
    return state.entities;
  },
  get dataRoot() {
    void state.version;
    return dataRoot;
  }
};

vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/app', () => ({ getAppContext: () => context }));
vi.mock('$lib/contexts/voter', () => ({ getVoterContext: () => undefined }));
vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));
vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({
    video: { hasContent: false },
    setRouteTitle: () => undefined,
    pageStyles: {
      push: (overlay: unknown) => {
        push(overlay);
        return revert;
      }
    }
  })
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

const Page = (await import('./+page.svelte')).default;

const NOTHING_TO_EDIT = '[data-testid="contestant-nothing-to-edit"]';
const LIST = '[data-testid="contestant-entity-selection-list"]';
const GROUP = '[data-testid="contestant-entity-selection-group"]';
const GROUP_HEADING = '[data-testid="contestant-entity-selection-group-heading"]';
const CARD = '[data-testid="entity-card"]';
const CARD_ACTION = '[data-testid="entity-card-action"]';
const CARD_TYPE = '[data-testid="entity-card-type"]';
const LOADING = '[data-testid="loading-indicator"]';
const ERROR = '[data-testid="error-message"]';
const SHOW_MORE = '[data-testid="entity-list-show-more"]';

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  dataRoot = new DataRoot();
  provision = 'run';
  state.entities = [];
  push.mockClear();
  revert.mockClear();
});

/**
 * Mount the page for a view and a list of entities.
 * @param flush - Whether to run the page's effects before returning. Default: `true`
 * @returns The element the page was mounted into.
 */
function render(
  view: 'nothingToEdit' | 'select' | undefined,
  entities: ReadonlyArray<UserEntity>,
  { flush = true }: { flush?: boolean } = {}
): HTMLElement {
  state.entities = entities;
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(Page, { target, props: { data: { view } } as never });
  if (flush) flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/** The titles of the cards, in document order. */
function cardTitles(root: ParentNode): Array<string> {
  return [...root.querySelectorAll(`${CARD} h3`)].map((title) => title.textContent?.trim() ?? '');
}

/** Every element below a card, by tag and classes. */
function shapeOf(card: HTMLElement): Array<string> {
  return [...card.querySelectorAll('*')].map((el) => `${el.tagName}.${el.className}`);
}

describe('contestant root page — the "nothing to edit" view', () => {
  it('shows the view and no list, and leaves the background as it is', () => {
    const target = render('nothingToEdit', []);

    expect(target.querySelector(NOTHING_TO_EDIT)).not.toBeNull();
    expect(target.querySelector(LIST)).toBeNull();
    expect(target.querySelector(CARD)).toBeNull();
    expect(target.querySelectorAll('h1')).toHaveLength(1);
    expect(push).not.toHaveBeenCalled();
  });

  it('renders nothing when the load names no view', () => {
    const target = render(undefined, []);

    expect(target.querySelector(NOTHING_TO_EDIT)).toBeNull();
    expect(target.querySelector(LIST)).toBeNull();
    expect(target.querySelector('h1')).toBeNull();
  });
});

describe('contestant root page — the selection view', () => {
  it('shows one card per entity in the display order, a heading per group and one h1', () => {
    const target = render('select', [PARTY, ZOE, ADA]);

    expect(target.querySelector(NOTHING_TO_EDIT)).toBeNull();
    const headings = target.querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent?.trim()).toBe('contestantApp.entitySelection.title');
    expect(target.textContent).toContain('contestantApp.entitySelection.ingress');

    expect(cardTitles(target)).toEqual(['Ada Alpha', 'Zoe Zeta', 'The Example Party']);
    expect(target.querySelectorAll(`${LIST} ${CARD}`)).toHaveLength(3);

    const groups = [...target.querySelectorAll<HTMLElement>(GROUP)];
    expect(groups.map((group) => group.dataset.entityType)).toEqual(['candidate', 'organization']);
    expect(groups.map((group) => group.tagName)).toEqual(['SECTION', 'SECTION']);
    const groupHeadings = [...target.querySelectorAll<HTMLElement>(GROUP_HEADING)];
    expect(groupHeadings.map((heading) => heading.tagName)).toEqual(['H2', 'H2']);
    expect(groupHeadings.map((heading) => heading.textContent?.trim())).toEqual([
      'Common.candidate.plural',
      'Common.organization.plural'
    ]);
    // Each heading labels its own section.
    for (const group of groups) {
      const heading = group.querySelector(GROUP_HEADING)!;
      expect(heading.id).not.toBe('');
      expect(group.getAttribute('aria-labelledby')).toBe(heading.id);
    }
    expect(new Set(groupHeadings.map((heading) => heading.id)).size).toBe(2);
    expect(target.querySelector(LOADING)).toBeNull();
    expect(target.querySelector(ERROR)).toBeNull();
  });

  it('shows no group heading when one type is listed, and still renders the group', () => {
    const target = render('select', [ZOE, ADA]);

    expect(target.querySelector(GROUP_HEADING)).toBeNull();
    expect(target.querySelector('h2')).toBeNull();
    const groups = target.querySelectorAll<HTMLElement>(GROUP);
    expect(groups).toHaveLength(1);
    expect(groups[0].hasAttribute('aria-labelledby')).toBe(false);
    expect(cardTitles(target)).toEqual(['Ada Alpha', 'Zoe Zeta']);
  });

  it('shows the loading state and no card until its effect has provided the entities', () => {
    // The root already holds both entities, as it would after a visit to one of them.
    dataRoot.provideEntityData([
      { type: 'candidate', id: ZOE.id, firstName: 'Stale', lastName: 'Zeta' },
      { type: 'candidate', id: ADA.id, firstName: 'Stale', lastName: 'Alpha' }
    ]);

    const target = render('select', [ZOE, ADA], { flush: false });

    expect(push, 'no effect of the page has run yet').not.toHaveBeenCalled();
    expect(target.querySelector('h1')?.textContent?.trim()).toBe('contestantApp.entitySelection.title');
    expect(target.textContent).toContain('contestantApp.entitySelection.ingress');
    expect(target.querySelector(`${LIST} ${LOADING}`)).not.toBeNull();
    expect(target.querySelector(CARD)).toBeNull();

    flushSync();

    expect(target.querySelector(LOADING)).toBeNull();
    expect(cardTitles(target)).toEqual(['Ada Alpha', 'Zoe Zeta']);
  });

  it('follows the list when it changes', () => {
    const target = render('select', [ZOE, ADA]);

    state.entities = [ZOE, ADA, PARTY];
    flushSync();

    expect(cardTitles(target)).toEqual(['Ada Alpha', 'Zoe Zeta', 'The Example Party']);
    expect(target.querySelectorAll(GROUP_HEADING)).toHaveLength(2);
  });

  it('renders the card of an unconfirmed entity with no image and no colour like any other', () => {
    const target = render('select', [ZOE, ADA]);

    const cards = [...target.querySelectorAll<HTMLElement>(CARD)];
    expect(cards).toHaveLength(2);
    const [unconfirmed, confirmed] = cards;
    expect(unconfirmed.querySelector('h3')?.textContent?.trim()).toBe('Ada Alpha');
    expect(unconfirmed.querySelector('img')).toBeNull();
    expect(unconfirmed.querySelector(CARD_TYPE)?.textContent?.trim()).toBe('common.candidate.singular');
    // Nothing on a card tells a confirmed entity from an unconfirmed one.
    expect(shapeOf(unconfirmed)).toEqual(shapeOf(confirmed));
  });

  it('makes each card one link to the entity home, named by the name and the type, that does not keep the scroll position', () => {
    const target = render('select', [PARTY, ZOE, ADA]);

    const links = [...target.querySelectorAll<HTMLAnchorElement>(`${LIST} a`)];
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      `/contestant/candidate/${ADA.id}`,
      `/contestant/candidate/${ZOE.id}`,
      `/contestant/organization/${PARTY.id}`
    ]);
    for (const link of links) {
      expect(link.matches(CARD_ACTION)).toBe(true);
      expect(link.hasAttribute('data-sveltekit-noscroll')).toBe(false);
      expect(link.hasAttribute('aria-label')).toBe(false);
    }
    expect(links[0].textContent).toContain('Ada Alpha');
    expect(links[0].textContent).toContain('common.candidate.singular');
    expect(links[2].textContent).toContain('The Example Party');
    expect(links[2].textContent).toContain('common.organization.singular');
    expect(target.querySelectorAll(`${CARD} h3`)).toHaveLength(3);
  });

  it('shows an inline error in the list region, under the title, when the entities cannot be provided', () => {
    provision = 'throw';
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const target = render('select', [ZOE, ADA]);

    expect(target.querySelector(`${LIST} ${ERROR}`)).not.toBeNull();
    expect(target.querySelector(CARD)).toBeNull();
    expect(target.querySelector(LOADING)).toBeNull();
    expect(target.querySelector('h1')?.textContent?.trim()).toBe('contestantApp.entitySelection.title');
    logged.mockRestore();
  });

  it('shows an inline error when a provided entity cannot be resolved', () => {
    provision = 'skip';
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const target = render('select', [ZOE, ADA]);

    expect(target.querySelector(`${LIST} ${ERROR}`)).not.toBeNull();
    expect(target.querySelector(CARD)).toBeNull();
    logged.mockRestore();
  });

  it('pages a list of more than fifty entities', () => {
    const many: Array<UserEntity> = Array.from({ length: 70 }, (_, i) => ({
      type: 'candidate',
      id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      firstName: 'Candidate',
      lastName: String(i).padStart(3, '0'),
      confirmed: true
    }));

    const target = render('select', many);

    expect(target.querySelectorAll(CARD)).toHaveLength(50);
    expect(target.querySelectorAll(SHOW_MORE)).toHaveLength(1);
  });

  it('shades the background while it is shown and reverts it when the page is left', () => {
    render('select', [ZOE, ADA]);

    expect(push.mock.calls).toEqual([[{ drawer: { background: 'bg-base-300' } }]]);
    expect(revert).not.toHaveBeenCalled();

    for (const fn of teardown.reverse()) fn();
    teardown = [];

    expect(revert).toHaveBeenCalledTimes(1);
  });

  it('adds no view-transition name below the frame and writes nothing to storage', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    const target = render('select', [PARTY, ZOE, ADA]);

    // `MainContent` carries the frame's own standing name; the list and its cards add none.
    expect(target.querySelector(LIST)!.outerHTML).not.toContain('view-transition-name');
    expect(target.querySelectorAll(`${LIST} ${CARD}`)).toHaveLength(3);
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});
