/**
 * What the details step of the nomination editor does after a save, once the entity's data has been replaced as a rerun of the entity-level load replaces it.
 *
 * Mounted for real: the details page inside the entity layout, the contestant context with its user-data store, the data context with its data root, and `MainContent`, `EntitySelector`, `Input` and `Button` below the page.
 *
 * Stood in for: the root layout and the Contestant App's layout, by the two harness components beside this file, which initialise the two contexts where those layouts do and hold the root layout's data-root effect; the layout between the Contestant App's layout and the entity layout, which is left out; the app, auth, i18n, component and layout contexts; the page state; the navigation functions; and the data writer, whose two nomination functions are spies.
 *
 * A rerun load replaces the page state's data and the `data` of every layout and page in place, and flushes nothing. The fake `invalidateAll` does the same and no more, so whatever the page waits for after it is what brings the replaced data to the entity's tasks.
 *
 * What this file holds:
 *
 * 1. **The entity's tasks are current when the page asks where to go.** After a save that gave the entity its first nomination, the page navigates once, to the profile and not to the entity's home.
 * 2. **The page stays mounted through the replacement.** The list of cards is the node it was, and nothing was put in its place meanwhile.
 * 3. **A save that was not stored keeps the cards and what was typed** through the same replacement.
 * 4. **The harness's own control.** With the data left as it was, the same save leads to the entity's home: case 1 passes because of the replacement and not without it.
 */

import { dynamicSettings, staticSettings } from '@openvaa/app-shared';
import { NOMINATION_SHAPE, QUESTION_CATEGORY_TYPE, QUESTION_TYPE } from '@openvaa/data';
import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTE } from '$lib/routes';
import { load } from './+page';
import type { ElectionData } from '@openvaa/data';
import type {
  DesiredNomination,
  EntityNomination,
  NominationContest,
  SetEntityNominationsResult,
  UserEntity
} from '$lib/api/base/dataWriter.type';
import type { RouteOptions } from '$lib/routes';

const ENTITY_ID = '11111111-1111-4111-8111-111111111111';

const PARTY: UserEntity = { type: 'organization', id: ENTITY_ID, name: 'Alpha Party', confirmed: true };

/** An election held in the whole country, in which a party may stand under an alliance or under none. */
const ELECTION_DATA: Array<ElectionData> = [
  {
    id: 'national',
    name: 'National',
    constituencyGroupIds: ['nation'],
    nominationShape: NOMINATION_SHAPE.OrganizationListAndIndependents
  }
];

const CONSTITUENCY_DATA = {
  groups: [{ id: 'nation', name: 'Nation', constituencyIds: ['whole-country'] }],
  constituencies: [{ id: 'whole-country', name: 'The whole country' }]
};

/** One required info question, asked of every entity in every election, so that a nominated entity's profile is incomplete. */
const QUESTION_DATA = {
  categories: [{ id: 'category-info', name: 'Basic information', type: QUESTION_CATEGORY_TYPE.Info }],
  questions: [
    { id: 'question-info', type: QUESTION_TYPE.Text, categoryId: 'category-info', name: 'Describe', required: true }
  ]
};

const SETTINGS: AppSettings = { ...staticSettings, ...dynamicSettings };

/** The party's nomination in the national election. */
const NATIONAL: EntityNomination = {
  id: 'nomination-national',
  electionId: 'national',
  electionName: 'National',
  constituencyId: 'whole-country',
  constituencyName: 'The whole country',
  electionRound: 1,
  electionSymbol: '21',
  confirmed: false,
  customData: null
};

const SAVED: SetEntityNominationsResult = {
  type: 'saved',
  inserted: 1,
  updated: 0,
  deleted: 0,
  unchanged: 0,
  parentsCreated: 0
};

const { goto, invalidateAll, pageBox, writer } = vi.hoisted(() => ({
  goto: vi.fn<(address: string) => Promise<void>>(),
  invalidateAll: vi.fn<() => Promise<void>>(),
  /** The page state the application reads. A case puts an object over reactive state in the box before it mounts. */
  pageBox: { page: { data: {}, params: {}, route: { id: null }, url: new URL('http://localhost/') } as unknown },
  writer: {
    setEntityNominations: vi.fn<(options: { nominations: ReadonlyArray<DesiredNomination> }) => Promise<unknown>>(),
    getNominationParentOptions: vi.fn<(options: { contests: ReadonlyArray<NominationContest> }) => Promise<unknown>>()
  }
}));

vi.mock('$app/navigation', () => ({
  goto: (address: string) => goto(address),
  invalidateAll: () => invalidateAll(),
  beforeNavigate: () => undefined
}));

vi.mock('$app/state', () => ({
  get page() {
    return pageBox.page;
  }
}));

// A fake app context over the real data context: `dataRoot` is forwarded as a live accessor and `setDataRoot` is the real writer.
vi.mock('$lib/contexts/app', async () => {
  const { getDataContext } = await import('$lib/contexts/data');
  return {
    getAppContext: () => {
      const dataContext = getDataContext();
      return {
        appType: { current: 'contestant' },
        get appSettings() {
          return SETTINGS;
        },
        get dataRoot() {
          return dataContext.dataRoot;
        },
        setDataRoot: dataContext.setDataRoot,
        locale: 'en',
        t: (key: string) => key,
        getRoute: { current: (options: RouteOptions) => JSON.stringify(options) },
        startEvent: () => undefined
      };
    }
  };
});

vi.mock('$lib/contexts/i18n', () => ({
  getI18nContext: () => ({
    locale: 'en',
    locales: ['en'],
    t: (key: string) => key,
    translate: (value: unknown) => (typeof value === 'string' ? value : '')
  })
}));

vi.mock('$lib/contexts/auth', () => ({
  getAuthContext: () => ({
    isAuthenticated: true,
    logout: async () => undefined,
    setPassword: async () => undefined
  })
}));

vi.mock('$lib/contexts/utils/prepareDataWriter', () => ({ prepareDataWriter: () => writer }));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ locale: 'en', t: (key: string) => key, darkMode: { current: false } })
}));
vi.mock('$lib/contexts/voter', () => ({ getVoterContext: () => undefined }));
vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({
    video: { hasContent: false },
    setRouteTitle: () => undefined,
    pageStyles: { push: () => () => undefined }
  })
}));

// jsdom has no `window.matchMedia`, and `svelte/motion` reads it when the `$layouts/main` barrel loads the header. The stub answers "no preference".
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

const Harness = (await import('./AfterSaveRoot.svelte')).default;

const STEP = '[data-testid="contestant-nomination-details"]';
const LIST = '[data-testid="contestant-nomination-details-list"]';
const CARD = '[data-testid="nomination-editor-card"]';
const SYMBOL = '[data-testid="nomination-editor-symbol-input"]';
const MESSAGE = '[data-testid="contestant-nomination-save-message"]';
const SUBMIT = '[data-testid="contestant-nomination-submit"]';

/** The data of the page state: what the loads above the page returned. Replaced whole, as a rerun replaces it. */
let pageData = $state.raw<Record<string, unknown>>({});

let teardown: Array<() => void> = [];

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  goto.mockResolvedValue(undefined);
  invalidateAll.mockResolvedValue(undefined);
  writer.setEntityNominations.mockResolvedValue(SAVED);
  writer.getNominationParentOptions.mockResolvedValue([]);
  pageBox.page = {
    get data() {
      return pageData;
    },
    params: { entityType: PARTY.type, entityId: ENTITY_ID },
    route: { id: ROUTE.ContestantAppNominationDetails },
    url: new URL(`http://localhost/contestant/organization/${ENTITY_ID}/nominations/details`)
  };
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  pageData = {};
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

/** Everything the loads return for an entity that holds the nominations given, with the national election chosen. */
type Loaded = {
  /** The data of the page state. */
  pageState: Record<string, unknown>;
  /** The data of the entity layout. */
  layoutData: Record<string, unknown>;
  /** The data of the details page: what its real load answers, and the facts of the nominations. */
  detailsData: Record<string, unknown>;
};

/** What the loads return for the party with the nominations given. Every object is new, as it is after a rerun. */
async function loadedWith(nominations: Array<EntityNomination>): Promise<Loaded> {
  const contestantUserData = {
    entity: { type: 'organization', id: ENTITY_ID, name: 'Alpha Party', answers: {} },
    localizedNames: { name: { en: 'Alpha Party' }, shortName: null },
    nominations: nominations.map((nomination) => ({ ...nomination }))
  };
  const nominationFacts = {
    editable: true,
    admissibleElectionIds: ELECTION_DATA.map((election) => election.id),
    inReachNominationIds: nominations.map((nomination) => nomination.id)
  };
  const event = {
    params: { entityType: PARTY.type, entityId: ENTITY_ID },
    parent: async () => ({
      gate: null,
      nominationFacts,
      contestantUserData,
      appSettingsData: {},
      electionData: ELECTION_DATA,
      constituencyData: CONSTITUENCY_DATA
    }),
    url: new URL(
      `http://localhost/contestant/organization/${ENTITY_ID}/nominations/details?nominationElectionId=national`
    )
  };
  return {
    pageState: { entities: [{ ...PARTY }], contestantUserData },
    layoutData: {
      questionData: { categories: [...QUESTION_DATA.categories], questions: [...QUESTION_DATA.questions] },
      contestantUserData
    },
    detailsData: { ...(await load(event as never)), nominationFacts }
  };
}

/** The one element a selector names under `root`. */
function one<TElement extends HTMLElement = HTMLElement>(root: ParentNode, selector: string): TElement {
  const found = root.querySelectorAll<TElement>(selector);
  expect(found, `elements matching ${selector}`).toHaveLength(1);
  return found[0];
}

/** Let what a press started run to its end. */
async function afterPress(): Promise<void> {
  for (let turn = 0; turn < 10; turn++) {
    await tick();
    await Promise.resolve();
    flushSync();
  }
}

/** The page mounted under its layouts, and the function that replaces every load's data in place without flushing. */
type Mounted = {
  root: HTMLElement;
  replaceWith: (next: Loaded) => void;
};

/** Mount the page under its layouts for the party with the nominations given, and wait until its cards are shown. */
async function render(nominations: Array<EntityNomination>): Promise<Mounted> {
  const loaded = await loadedWith(nominations);
  pageData = loaded.pageState;
  const props = $state({
    electionData: ELECTION_DATA,
    constituencyData: CONSTITUENCY_DATA,
    layoutData: loaded.layoutData as unknown,
    pageData: loaded.detailsData as unknown
  });
  const root = document.createElement('div');
  document.body.appendChild(root);
  const component = mount(Harness, { target: root, props: props as never });
  flushSync();
  teardown.push(() => {
    unmount(component);
    root.remove();
  });
  await vi.waitFor(() => {
    flushSync();
    expect(one(root, STEP).getAttribute('data-editor-state')).toBe('ready');
  });
  return {
    root,
    replaceWith: (next) => {
      pageData = next.pageState;
      props.layoutData = next.layoutData;
      props.pageData = next.detailsData;
    }
  };
}

describe('after a save that gave the entity its first nomination', () => {
  it("navigates once, to the profile and not to the entity's home, when the loads' data was replaced", async () => {
    const { root, replaceWith } = await render([]);
    expect(one(root, CARD).getAttribute('data-card-state')).toBe('new');
    expect(one(root, SUBMIT).getAttribute('data-action')).toBe('continue');
    const next = await loadedWith([NATIONAL]);
    invalidateAll.mockImplementation(async () => replaceWith(next));

    one<HTMLButtonElement>(root, SUBMIT).click();
    await afterPress();

    expect(writer.setEntityNominations).toHaveBeenCalledTimes(1);
    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledTimes(1);
    expect(JSON.parse(goto.mock.calls[0][0])).toEqual({ route: 'ContestantAppProfile' });
  });

  it('keeps the list of cards mounted through the replacement, with nothing put in its place', async () => {
    const { root, replaceWith } = await render([]);
    const list = one(root, LIST);
    const card = one(root, CARD);
    const next = await loadedWith([NATIONAL]);
    invalidateAll.mockImplementation(async () => replaceWith(next));

    const removed: Array<Node> = [];
    const states: Array<string | null> = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        removed.push(...record.removedNodes);
        if (record.type === 'attributes') states.push((record.target as Element).getAttribute('data-editor-state'));
      }
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-editor-state']
    });
    teardown.push(() => observer.disconnect());

    one<HTMLButtonElement>(root, SUBMIT).click();
    await afterPress();

    expect(goto).toHaveBeenCalledTimes(1);
    expect(one(root, LIST)).toBe(list);
    expect(one(root, CARD)).toBe(card);
    expect(list.isConnected).toBe(true);
    expect(removed.some((node) => node === list || node.contains(list))).toBe(false);
    expect(states).not.toContain('loading');
    expect(states).not.toContain('error');
  });

  it("goes to the entity's home when the loads' data was left as it was", async () => {
    const { root } = await render([]);

    one<HTMLButtonElement>(root, SUBMIT).click();
    await afterPress();

    expect(writer.setEntityNominations).toHaveBeenCalledTimes(1);
    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledTimes(1);
    expect(JSON.parse(goto.mock.calls[0][0])).toEqual({ route: 'ContestantAppEntityHome' });
  });
});

describe('after a save that was not stored', () => {
  it("keeps the cards and what was typed through the replacement of the loads' data", async () => {
    const { root, replaceWith } = await render([NATIONAL]);
    const list = one(root, LIST);
    const card = one(root, CARD);
    const symbol = one<HTMLInputElement>(root, SYMBOL);
    symbol.value = '99';
    symbol.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    writer.setEntityNominations.mockResolvedValue({ type: 'refused', reason: 'hasCandidates' });
    const next = await loadedWith([NATIONAL]);
    invalidateAll.mockImplementation(async () => replaceWith(next));

    one<HTMLButtonElement>(root, SUBMIT).click();
    await afterPress();

    expect(goto).not.toHaveBeenCalled();
    expect(one(root, MESSAGE).getAttribute('data-outcome')).toBe('hasCandidates');
    expect(one(root, LIST)).toBe(list);
    expect(one(root, CARD)).toBe(card);
    expect(one<HTMLInputElement>(root, SYMBOL)).toBe(symbol);
    expect(symbol.value).toBe('99');
    expect(writer.getNominationParentOptions).toHaveBeenCalledTimes(1);
  });
});
