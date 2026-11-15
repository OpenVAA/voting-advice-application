/**
 * The details step of the nomination editor, mounted for real against a fake contestant context, with the real `MainContent`, `EntitySelector`, `Input`, `Warning`, `Loading` and `Button` below it.
 *
 * What this file holds:
 *
 * 1. **Which cards there are.** Every nomination of the entity in the editor's reach has a card, whatever the address chose: kept where its election is chosen, about to be removed where it is not, moved where its election is chosen with another constituency. A nomination outside the reach has none, and no card is built while the entity's nominations are not known.
 * 2. **What a card shows.** The status row and the two notes, the previous constituency of a moved card, the stored symbol and the stored parent, and a stored name as text whatever it holds.
 * 3. **Remove and Keep.** Neither writes. A removed card says so as a status, shows no field and hands focus to its Keep; Keep restores what was typed and hands focus to its Remove.
 * 4. **The main button.** With nothing to write it calls no write and goes on to the target; a removed card is not checked and is left out of the set that is written.
 * 5. **What the main button says.** Its label and its action for an untouched set, a changed card, every card removed and an entity that had no nomination, with a task left and with none.
 * 6. **A save that is not stored.** Which of its four messages the page shows, that the message is the page's own, what becomes of the cards and of what was typed, where focus is, and that the page navigates nowhere. And a re-read that led away from the page: nothing further when it led out of the editor, the target when a stored save's re-read led to another step.
 * 7. **Leaving.** The navigation guard asks while the draft differs from what is stored, and not for an untouched set, after Cancel or while a save is under way.
 *
 * The fake context's members are reactive behind getters over one raw state box, as the real accessors are, its data root is a real `DataRoot`, and its two nomination functions are spies. The page state is the suite's stub, whose route a case sets, and the navigation guards the page registers are kept so that a case can run them as a navigation does. The page's data is what the step's real load answers for the same elections, nominations and address, with the facts of the nominations beside it. No entity is listed as a parent option, so every option of a parent group is a plain row. Messages are their keys, followed by their payload when they have one, and a route is the options it was asked for.
 */

import { dynamicSettings, log, staticSettings } from '@openvaa/app-shared';
import { DataRoot, NOMINATION_SHAPE } from '@openvaa/data';
import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from '$app/state';
import { ROUTE } from '$lib/routes';
import { load } from './+page';
import type { ElectionData } from '@openvaa/data';
import type { DesiredNomination, EntityNomination, NominationContest, UserEntity } from '$lib/api/base/dataWriter.type';
import type { TaskState } from '$lib/contestant/tasks';
import type { RouteOptions } from '$lib/routes';

/** Everything the page reads from the contestant context. */
type Box = {
  selectedEntity: UserEntity | undefined;
  dataRoot: DataRoot;
  appSettings: AppSettings;
  locale: string;
  nominations: ReadonlyArray<EntityNomination> | undefined;
  taskState: TaskState;
};

const ENTITY_ID = '11111111-1111-4111-8111-111111111111';

const PARTY: UserEntity = { type: 'organization', id: ENTITY_ID, name: 'Alpha Party', confirmed: true };
const CANDIDATE: UserEntity = {
  type: 'candidate',
  id: ENTITY_ID,
  firstName: 'Ada',
  lastName: 'Alpha',
  confirmed: true
};

/** A closed-list election held by region, and an open election held in the whole country. */
const ELECTION_DATA: Array<ElectionData> = [
  {
    id: 'regional',
    name: 'Regional',
    constituencyGroupIds: ['regions'],
    nominationShape: NOMINATION_SHAPE.OrganizationList
  },
  {
    id: 'national',
    name: 'National',
    constituencyGroupIds: ['nation'],
    nominationShape: NOMINATION_SHAPE.OrganizationListAndIndependents
  }
];

const CONSTITUENCY_DATA = {
  groups: [
    { id: 'regions', name: 'Regions', constituencyIds: ['region-1', 'region-2'] },
    { id: 'nation', name: 'Nation', constituencyIds: ['whole-country'] }
  ],
  constituencies: [
    { id: 'region-1', name: 'Region 1' },
    { id: 'region-2', name: 'Region 2' },
    { id: 'whole-country', name: 'The whole country' }
  ]
};

const CONSTITUENCY_NAMES: Record<string, string> = Object.fromEntries(
  CONSTITUENCY_DATA.constituencies.map(({ id, name }) => [id, name])
);

/** A stored nomination of the entity. */
function nomination(
  id: string,
  electionId: 'regional' | 'national',
  constituencyId: string,
  rest: Partial<EntityNomination> = {}
): EntityNomination {
  return {
    id,
    electionId,
    electionName: electionId === 'regional' ? 'Regional' : 'National',
    constituencyId,
    constituencyName: CONSTITUENCY_NAMES[constituencyId],
    electionRound: 1,
    electionSymbol: '',
    confirmed: true,
    customData: null,
    ...rest
  };
}

/** The task state of an entity whose next task is its profile, and one of which nothing is known. */
const NEXT_IS_PROFILE = {
  tasks: [],
  nextStep: { task: 'profile', route: { route: 'ContestantAppProfile' } },
  previewOpen: false,
  known: true,
  allComplete: false
} as unknown as TaskState;
const NOT_KNOWN = {
  tasks: [],
  nextStep: undefined,
  previewOpen: false,
  known: false,
  allComplete: false
} as unknown as TaskState;

/** The task state of an entity with nothing left to do, and of one that has no nomination. */
const NOTHING_LEFT = {
  tasks: [],
  nextStep: undefined,
  previewOpen: true,
  known: true,
  allComplete: true
} as unknown as TaskState;
const NO_NOMINATION = {
  tasks: [],
  nextStep: { task: 'nomination', route: { route: 'ContestantAppNominations' } },
  previewOpen: false,
  known: true,
  allComplete: false
} as unknown as TaskState;

const SETTINGS: AppSettings = { ...staticSettings, ...dynamicSettings };

/** A data root that holds the two elections and their constituencies. */
function dataRootOf(): DataRoot {
  const dataRoot = new DataRoot();
  dataRoot.provideElectionData(ELECTION_DATA);
  dataRoot.provideConstituencyData(CONSTITUENCY_DATA);
  return dataRoot;
}

const EMPTY_BOX: Box = {
  selectedEntity: undefined,
  dataRoot: new DataRoot(),
  appSettings: SETTINGS,
  locale: 'en',
  nominations: undefined,
  taskState: NOT_KNOWN
};

let box = $state.raw<Box>(EMPTY_BOX);

const goto = vi.fn<(address: string) => Promise<void>>();
const invalidateAll = vi.fn<() => Promise<void>>();
const setEntityNominations =
  vi.fn<(nominations: ReadonlyArray<DesiredNomination>) => Promise<{ type: string; reason?: string }>>();
const getNominationParentOptions = vi.fn<(contests: ReadonlyArray<NominationContest>) => Promise<Array<never>>>();

/** The guards the page registered for a navigation away from it. */
const guards: Array<(navigation: { cancel: () => void }) => void> = [];

const context = {
  t: (key: string, payload?: Record<string, unknown>) => (payload ? `${key} ${JSON.stringify(payload)}` : key),
  getRoute: { current: (options: RouteOptions) => JSON.stringify(options) },
  setDataRoot: (updater: (dataRoot: DataRoot) => void) => updater(box.dataRoot),
  setEntityNominations: (nominations: ReadonlyArray<DesiredNomination>) => setEntityNominations(nominations),
  getNominationParentOptions: (contests: ReadonlyArray<NominationContest>) => getNominationParentOptions(contests),
  get appSettings() {
    return box.appSettings;
  },
  get dataRoot() {
    return box.dataRoot;
  },
  get locale() {
    return box.locale;
  },
  get nominations() {
    return box.nominations;
  },
  get selectedEntity() {
    return box.selectedEntity;
  },
  get taskState() {
    return box.taskState;
  }
};

vi.mock('$app/navigation', () => ({
  goto: (address: string) => goto(address),
  invalidateAll: () => invalidateAll(),
  beforeNavigate: (guard: (navigation: { cancel: () => void }) => void) => {
    guards.push(guard);
  }
}));
vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ locale: 'en', t: (key: string) => key, darkMode: { current: false } })
}));
vi.mock('$lib/contexts/app', () => ({
  getAppContext: () => ({
    appType: { current: 'contestant' },
    getRoute: { current: () => '/unused' },
    startEvent: () => undefined,
    t: (key: string) => key,
    appSettings: {},
    dataRoot: {}
  })
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

const Page = (await import('./+page.svelte')).default;

const STEP = '[data-testid="contestant-nomination-details"]';
const CARD = '[data-testid="nomination-editor-card"]';
const ELECTION = '[data-testid="nomination-editor-election"]';
const CONSTITUENCY = '[data-testid="nomination-editor-constituency"]';
const PREVIOUS = '[data-testid="nomination-editor-previous-constituency"]';
const STATUS = '[data-testid="nomination-editor-state"]';
const CONFIRMED_NOTE = '[data-testid="nomination-editor-confirmed-note"]';
const NEW_NOTE = '[data-testid="nomination-editor-new-note"]';
const REMOVED_NOTE = '[data-testid="nomination-editor-removed-note"]';
const SYMBOL = '[data-testid="nomination-editor-symbol-input"]';
const PARENT = '[data-testid="nomination-editor-parent"]';
const OPTION = '[data-testid="entity-selector-option"]';
const OPTION_INPUT = '[data-testid="entity-selector-option-input"]';
const OTHER_NAME = '[data-testid="nomination-editor-other-input"]';
const REMOVE = '[data-testid="nomination-editor-remove"]';
const KEEP = '[data-testid="nomination-editor-keep"]';
const MESSAGE = '[data-testid="contestant-nomination-save-message"]';
const SUBMIT = '[data-testid="contestant-nomination-submit"]';

const CANCEL = '[data-testid="contestant-nomination-cancel"]';

const KEYS = {
  confirmed: 'common.confirmed',
  pending: 'contestantApp.nominations.state.pending',
  confirmedNote: 'contestantApp.nominations.details.confirmedNote',
  newNote: 'contestantApp.nominations.details.newNote',
  removedNote: 'contestantApp.nominations.details.removedNote',
  removedConfirmedNote: 'contestantApp.nominations.details.removedConfirmedNote',
  previousConstituency: 'contestantApp.nominations.details.previousConstituency',
  unlisted: 'contestantApp.nominations.parent.unlisted',
  changed: 'contestantApp.nominations.error.changed',
  hasCandidates: 'contestantApp.nominations.error.hasCandidates',
  tooManyPending: 'contestantApp.nominations.error.tooManyPending',
  saveFailed: 'contestantApp.nominations.error.saveFailed'
};

let teardown: Array<() => void> = [];

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  goto.mockResolvedValue(undefined);
  invalidateAll.mockResolvedValue(undefined);
  setEntityNominations.mockResolvedValue({ type: 'saved' });
  getNominationParentOptions.mockResolvedValue([]);
  page.route.id = ROUTE.ContestantAppNominationDetails;
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  guards.length = 0;
  page.route.id = null;
  box = EMPTY_BOX;
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

/** What a case states: the entity, its nominations in the editor's reach and those outside it, the address's selection, and what is known of the entity's tasks. */
type World = {
  entity?: UserEntity;
  nominations?: Array<EntityNomination>;
  outOfReach?: Array<EntityNomination>;
  elections: Array<string>;
  constituencies?: Array<string>;
  taskState?: TaskState;
};

/** The data the page is given for a world: what the step's load answers for the address, and the facts of the entity's nominations. */
async function pageDataOf(world: World): Promise<Record<string, unknown>> {
  const nominations = [...(world.outOfReach ?? []), ...(world.nominations ?? [])];
  const nominationFacts = {
    editable: true,
    admissibleElectionIds: ELECTION_DATA.map((election) => election.id),
    inReachNominationIds: (world.nominations ?? []).map((row) => row.id)
  };
  const search = new URLSearchParams();
  for (const id of world.elections) search.append('nominationElectionId', id);
  for (const id of world.constituencies ?? []) search.append('nominationConstituencyId', id);
  const event = {
    params: { entityType: (world.entity ?? PARTY).type, entityId: ENTITY_ID },
    parent: async () => ({
      gate: null,
      nominationFacts,
      contestantUserData: { nominations },
      appSettingsData: {},
      electionData: ELECTION_DATA,
      constituencyData: CONSTITUENCY_DATA
    }),
    url: new URL(`http://localhost/contestant/organization/${ENTITY_ID}/nominations/details?${search}`)
  };
  return { ...(await load(event as never)), nominationFacts };
}

/** Wait until the page says it is in the state given. */
async function settled(root: ParentNode, state = 'ready'): Promise<void> {
  await vi.waitFor(() => {
    flushSync();
    expect(one(root, STEP).getAttribute('data-editor-state')).toBe(state);
  });
}

/** Let what a press started run to its end. */
async function afterPress(): Promise<void> {
  for (let turn = 0; turn < 10; turn++) {
    await tick();
    await Promise.resolve();
    flushSync();
  }
}

/** Mount the page in a world and wait until its cards are shown. */
async function render(world: World): Promise<HTMLElement> {
  return (await renderRemovable(world)).root;
}

/** Mount the page in a world, wait until its cards are shown, and hand over the function that takes the page away, as a navigation to another page does. */
async function renderRemovable(world: World): Promise<{ root: HTMLElement; takeAway: () => void }> {
  const data = await pageDataOf(world);
  box = {
    ...EMPTY_BOX,
    selectedEntity: world.entity ?? PARTY,
    dataRoot: dataRootOf(),
    nominations: [...(world.outOfReach ?? []), ...(world.nominations ?? [])],
    taskState: world.taskState ?? NEXT_IS_PROFILE
  };
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(Page, { target, props: { data: data as never } });
  flushSync();
  let mounted = true;
  function takeAway(): void {
    if (!mounted) return;
    mounted = false;
    unmount(component);
  }
  teardown.push(() => {
    takeAway();
    target.remove();
  });
  await settled(target);
  return { root: target, takeAway };
}

/** The one element a selector names under `root`. */
function one<TElement extends HTMLElement = HTMLElement>(root: ParentNode, selector: string): TElement {
  const found = root.querySelectorAll<TElement>(selector);
  expect(found, `elements matching ${selector}`).toHaveLength(1);
  return found[0];
}

/** How many elements a selector names under `root`. */
function count(root: ParentNode, selector: string): number {
  return root.querySelectorAll(selector).length;
}

/** The text of an element with its white space collapsed. */
function textOf(element: Element): string {
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** The cards, in the page's order. */
function cardsOf(root: ParentNode): Array<HTMLElement> {
  return [...root.querySelectorAll<HTMLElement>(CARD)];
}

/** Each card's election, constituency and state, in the page's order. */
function summaryOf(root: ParentNode): Array<[string, string, string | null]> {
  return cardsOf(root).map((card) => [
    textOf(one(card, ELECTION)),
    textOf(one(card, CONSTITUENCY)),
    card.getAttribute('data-card-state')
  ]);
}

/** Commit a value into a text field, as a user who types it and leaves the field does. */
function commit(field: HTMLInputElement, value: string): void {
  field.value = value;
  field.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** The radio of the option of the kind given in a card's parent group. */
function radioOf(card: ParentNode, kind: string): HTMLInputElement {
  return one<HTMLInputElement>(card, `${OPTION}[data-option-kind="${kind}"] ${OPTION_INPUT}`);
}

/** Press a button of a card and let the page settle. */
async function press(card: ParentNode, selector: string): Promise<void> {
  one<HTMLButtonElement>(card, selector).click();
  await afterPress();
}

const REGIONAL = nomination('nomination-regional', 'regional', 'region-1');
const NATIONAL = nomination('nomination-national', 'national', 'whole-country', { electionSymbol: '21' });

describe('which cards there are', () => {
  it('shows a kept card for each stored nomination whose election is chosen, with what is stored', async () => {
    const root = await render({
      nominations: [REGIONAL, NATIONAL],
      elections: ['regional', 'national'],
      constituencies: ['region-1']
    });

    expect(summaryOf(root)).toEqual([
      ['Regional', 'Region 1', 'kept'],
      ['National', 'The whole country', 'kept']
    ]);
    const [regional, national] = cardsOf(root);
    expect(one<HTMLInputElement>(regional, SYMBOL).value).toBe('');
    expect(one<HTMLInputElement>(national, SYMBOL).value).toBe('21');
    expect(regional.getAttribute('data-moved')).toBe('false');
    expect(count(regional, PREVIOUS)).toBe(0);
    expect(radioOf(national, 'none').checked).toBe(true);
  });

  it('shows the card of a nomination whose election is not chosen as about to be removed, with Keep', async () => {
    const root = await render({
      nominations: [REGIONAL, NATIONAL],
      elections: ['regional'],
      constituencies: ['region-1']
    });

    expect(summaryOf(root)).toEqual([
      ['Regional', 'Region 1', 'kept'],
      ['National', 'The whole country', 'removed']
    ]);
    const national = cardsOf(root)[1];
    expect(count(national, KEEP)).toBe(1);
    expect(count(national, REMOVE)).toBe(0);
    expect(setEntityNominations).not.toHaveBeenCalled();
  });

  it('shows one moved card for a nomination whose election is chosen with another constituency, naming the previous one', async () => {
    const root = await render({
      nominations: [nomination('nomination-regional', 'regional', 'region-1', { electionSymbol: '7' })],
      elections: ['regional'],
      constituencies: ['region-2']
    });

    expect(summaryOf(root)).toEqual([['Regional', 'Region 2', 'kept']]);
    const card = one(root, CARD);
    expect(card.getAttribute('data-moved')).toBe('true');
    expect(textOf(one(card, PREVIOUS))).toBe(`${KEYS.previousConstituency} {"constituency":"Region 1"}`);
    expect(one<HTMLInputElement>(card, SYMBOL).value).toBe('7');

    await press(root, SUBMIT);
    expect(setEntityNominations).toHaveBeenCalledTimes(1);
    expect(setEntityNominations.mock.calls[0][0]).toEqual([
      {
        id: 'nomination-regional',
        electionId: 'regional',
        constituencyId: 'region-2',
        electionSymbol: '7',
        parent: { kind: 'none' }
      }
    ]);
  });

  it('shows a card for each of several nominations in one election, each as stored, and reads the parent options for every card', async () => {
    const second = nomination('nomination-regional-2', 'regional', 'region-2', {
      confirmed: false,
      electionSymbol: '9'
    });
    const root = await render({ nominations: [REGIONAL, second, NATIONAL], elections: ['regional'] });

    expect(summaryOf(root)).toEqual([
      ['Regional', 'Region 1', 'kept'],
      ['Regional', 'Region 2', 'kept'],
      ['National', 'The whole country', 'removed']
    ]);
    expect(cardsOf(root).map((card) => card.getAttribute('data-moved'))).toEqual(['false', 'false', 'false']);
    expect(one<HTMLInputElement>(cardsOf(root)[1], SYMBOL).value).toBe('9');
    expect(getNominationParentOptions).toHaveBeenCalledTimes(1);
    expect(getNominationParentOptions.mock.calls[0][0]).toEqual([
      { electionId: 'regional', constituencyId: 'region-1' },
      { electionId: 'regional', constituencyId: 'region-2' },
      { electionId: 'national', constituencyId: 'whole-country' }
    ]);
  });

  it("shows no card for a nomination outside the editor's reach, and a new card for a chosen pair with no nomination", async () => {
    const root = await render({
      nominations: [NATIONAL],
      outOfReach: [nomination('nomination-other-round', 'regional', 'region-1', { electionRound: 2 })],
      elections: ['regional', 'national'],
      constituencies: ['region-2']
    });

    expect(summaryOf(root)).toEqual([
      ['Regional', 'Region 2', 'new'],
      ['National', 'The whole country', 'kept']
    ]);
    expect(cardsOf(root)[0].getAttribute('data-moved')).toBe('false');
  });

  it('builds no card and reads no option while the nominations of the entity are not known', async () => {
    const data = await pageDataOf({ nominations: [REGIONAL], elections: ['regional'], constituencies: ['region-1'] });
    box = { ...EMPTY_BOX, selectedEntity: PARTY, dataRoot: dataRootOf(), nominations: undefined };
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(Page, { target, props: { data: data as never } });
    teardown.push(() => {
      unmount(component);
      target.remove();
    });
    await afterPress();

    expect(one(target, STEP).getAttribute('data-editor-state')).toBe('loading');
    expect(count(target, CARD)).toBe(0);
    expect(getNominationParentOptions).not.toHaveBeenCalled();

    box = { ...box, nominations: [REGIONAL] };
    await settled(target);
    expect(summaryOf(target)).toEqual([['Regional', 'Region 1', 'kept']]);
  });

  it('keeps the draft when the nominations are read again for the same address', async () => {
    const root = await render({ nominations: [NATIONAL], elections: ['national'] });
    commit(one<HTMLInputElement>(root, SYMBOL), '99');

    box = { ...box, nominations: [{ ...NATIONAL }] };
    await afterPress();

    expect(one<HTMLInputElement>(root, SYMBOL).value).toBe('99');
    expect(getNominationParentOptions).toHaveBeenCalledTimes(1);
  });
});

describe('what a card shows', () => {
  it('shows the status of an existing card, the confirmed note on a confirmed one, and Remove', async () => {
    const pending = nomination('nomination-regional', 'regional', 'region-1', { confirmed: false });
    const root = await render({
      nominations: [pending, NATIONAL],
      elections: ['regional', 'national'],
      constituencies: ['region-1']
    });
    const [regional, national] = cardsOf(root);

    expect(textOf(one(regional, STATUS))).toBe(KEYS.pending);
    expect(regional.getAttribute('data-confirmed')).toBe('false');
    expect(count(regional, CONFIRMED_NOTE)).toBe(0);
    expect(count(regional, NEW_NOTE)).toBe(0);
    expect(count(regional, REMOVE)).toBe(1);

    expect(textOf(one(national, STATUS))).toBe(KEYS.confirmed);
    expect(national.getAttribute('data-confirmed')).toBe('true');
    expect(textOf(one(national, CONFIRMED_NOTE))).toBe(KEYS.confirmedNote);
    expect(count(national, NEW_NOTE)).toBe(0);
    expect(count(national, REMOVE)).toBe(1);
  });

  it('shows the new note on a new card, and no status, no confirmed note and no Remove', async () => {
    const root = await render({ nominations: [], elections: ['national'] });
    const card = one(root, CARD);

    expect(card.getAttribute('data-card-state')).toBe('new');
    expect(textOf(one(card, NEW_NOTE))).toBe(KEYS.newNote);
    expect(count(card, STATUS)).toBe(0);
    expect(count(card, CONFIRMED_NOTE)).toBe(0);
    expect(count(card, REMOVE)).toBe(0);
    expect(count(card, KEEP)).toBe(0);
  });

  it('holds a stored parent that is not listed as the first option, chosen, with its line, and renders its name as text', async () => {
    const markup = '<img src="x" onerror="alert(1)"><b>Bold Alliance</b>';
    const under = nomination('nomination-national', 'national', 'whole-country', {
      parent: { entityType: 'alliance', entityId: 'alliance-gone', name: markup, shortName: '' }
    });
    const root = await render({ nominations: [under], elections: ['national'] });
    const card = one(root, CARD);
    const options = [...card.querySelectorAll<HTMLElement>(OPTION)];

    expect(options.map((option) => option.getAttribute('data-option-kind'))).toEqual(['unlisted', 'none', 'other']);
    expect(radioOf(card, 'unlisted').checked).toBe(true);
    expect(one(card, PARENT).getAttribute('data-selected-kind')).toBe('unlisted');
    expect(options[0].textContent).toContain(markup);
    expect(options[0].textContent).toContain(KEYS.unlisted);
    expect(count(card, 'img')).toBe(0);
    expect(count(card, 'b')).toBe(0);

    // Left chosen, the stored parent is kept and nothing is written.
    await press(root, SUBMIT);
    expect(setEntityNominations).not.toHaveBeenCalled();
  });

  it('starts from a stored typed name, and renders it as the value of its field', async () => {
    const markup = '<script>alert(1)</script> Party';
    const typed = nomination('nomination-national', 'national', 'whole-country', {
      confirmed: false,
      customData: { requestedParentOrganization: markup }
    });
    const root = await render({ nominations: [typed], elections: ['national'] });
    const card = one(root, CARD);

    expect(radioOf(card, 'other').checked).toBe(true);
    expect(one<HTMLInputElement>(card, OTHER_NAME).value).toBe(markup);
    expect(count(card, 'script')).toBe(0);
  });
});

describe('Remove and Keep', () => {
  it('Remove writes nothing, puts the card in the removed state, says so as a status and moves focus to Keep', async () => {
    const pending = nomination('nomination-regional', 'regional', 'region-1', { confirmed: false });
    const root = await render({
      nominations: [pending, NATIONAL],
      elections: ['regional', 'national'],
      constituencies: ['region-1']
    });
    const [regional, national] = cardsOf(root);

    await press(national, REMOVE);

    expect(national.getAttribute('data-card-state')).toBe('removed');
    const note = one(national, REMOVED_NOTE);
    expect(note.getAttribute('role')).toBe('status');
    expect(textOf(note)).toBe(KEYS.removedConfirmedNote);
    expect(count(national, SYMBOL)).toBe(0);
    expect(count(national, PARENT)).toBe(0);
    expect(count(national, CONFIRMED_NOTE)).toBe(0);
    expect(count(national, REMOVE)).toBe(0);
    expect(document.activeElement).toBe(one(national, KEEP));
    expect(textOf(one(national, ELECTION))).toBe('National');
    expect(textOf(one(national, CONSTITUENCY))).toBe('The whole country');

    await press(regional, REMOVE);

    expect(textOf(one(regional, REMOVED_NOTE))).toBe(KEYS.removedNote);
    expect(document.activeElement).toBe(one(regional, KEEP));
    expect(count(root, CARD)).toBe(2);
    expect(setEntityNominations).not.toHaveBeenCalled();
    expect(invalidateAll).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    expect(count(root, 'dialog')).toBe(0);
  });

  it('Keep restores the symbol and the parent choice that were typed, and moves focus to Remove', async () => {
    const root = await render({ nominations: [NATIONAL], elections: ['national'] });
    const card = one(root, CARD);
    commit(one<HTMLInputElement>(card, SYMBOL), '99');
    radioOf(card, 'other').click();
    flushSync();
    commit(one<HTMLInputElement>(card, OTHER_NAME), 'Typed Alliance');

    await press(card, REMOVE);
    expect(count(card, SYMBOL)).toBe(0);
    expect(count(card, OTHER_NAME)).toBe(0);

    await press(card, KEEP);

    expect(card.getAttribute('data-card-state')).toBe('kept');
    expect(count(card, REMOVED_NOTE)).toBe(0);
    expect(one<HTMLInputElement>(card, SYMBOL).value).toBe('99');
    expect(radioOf(card, 'other').checked).toBe(true);
    expect(one<HTMLInputElement>(card, OTHER_NAME).value).toBe('Typed Alliance');
    expect(document.activeElement).toBe(one(card, REMOVE));
    expect(setEntityNominations).not.toHaveBeenCalled();
  });
});

describe('the main button', () => {
  const STORED = {
    nominations: [REGIONAL, NATIONAL],
    elections: ['regional', 'national'],
    constituencies: ['region-1']
  };

  it('with a set as stored calls no write and goes on to the next task', async () => {
    const root = await render(STORED);

    await press(root, SUBMIT);

    expect(setEntityNominations).not.toHaveBeenCalled();
    expect(invalidateAll).not.toHaveBeenCalled();
    expect(goto).toHaveBeenCalledTimes(1);
    expect(JSON.parse(goto.mock.calls[0][0])).toEqual({ route: 'ContestantAppProfile' });
  });

  it("with a set as stored goes to the entity's home while its tasks are not known", async () => {
    const root = await render({ ...STORED, taskState: NOT_KNOWN });

    await press(root, SUBMIT);

    expect(setEntityNominations).not.toHaveBeenCalled();
    expect(JSON.parse(goto.mock.calls[0][0])).toEqual({ route: 'ContestantAppEntityHome' });
  });

  it('writes the set once when a symbol was changed, with every card that is not removed', async () => {
    const root = await render(STORED);
    commit(one<HTMLInputElement>(cardsOf(root)[1], SYMBOL), '22');

    await press(root, SUBMIT);

    expect(setEntityNominations).toHaveBeenCalledTimes(1);
    expect(setEntityNominations.mock.calls[0][0]).toEqual([
      {
        id: 'nomination-regional',
        electionId: 'regional',
        constituencyId: 'region-1',
        electionSymbol: '',
        parent: { kind: 'none' }
      },
      {
        id: 'nomination-national',
        electionId: 'national',
        constituencyId: 'whole-country',
        electionSymbol: '22',
        parent: { kind: 'none' }
      }
    ]);
    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(JSON.parse(goto.mock.calls[0][0])).toEqual({ route: 'ContestantAppProfile' });
  });

  it('does not check a removed card, and leaves it out of the set it writes', async () => {
    // A candidate must stand under a party in the closed-list election, and this stored nomination names none.
    const root = await render({
      entity: CANDIDATE,
      nominations: [REGIONAL, NATIONAL],
      elections: ['regional', 'national'],
      constituencies: ['region-1']
    });
    const regional = cardsOf(root)[0];

    await press(root, SUBMIT);
    expect(one(root, MESSAGE).getAttribute('data-outcome')).toBe('invalid');
    expect(setEntityNominations).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();

    await press(regional, REMOVE);
    await press(root, SUBMIT);

    expect(setEntityNominations).toHaveBeenCalledTimes(1);
    expect(setEntityNominations.mock.calls[0][0]).toEqual([
      {
        id: 'nomination-national',
        electionId: 'national',
        constituencyId: 'whole-country',
        electionSymbol: '21',
        parent: { kind: 'none' }
      }
    ]);
    expect(goto).toHaveBeenCalledTimes(1);
  });

  it('writes an empty set when every card is removed, with every card still shown before the press', async () => {
    const root = await render(STORED);
    for (const card of cardsOf(root)) await press(card, REMOVE);

    expect(summaryOf(root).map(([, , state]) => state)).toEqual(['removed', 'removed']);

    await press(root, SUBMIT);

    expect(setEntityNominations).toHaveBeenCalledTimes(1);
    expect(setEntityNominations.mock.calls[0][0]).toEqual([]);
  });
});

/** The main button's label and action. */
function buttonOf(root: ParentNode): { label: string; action: string | null } {
  const button = one(root, SUBMIT);
  return { label: textOf(button), action: button.getAttribute('data-action') };
}

describe('what the main button says', () => {
  const STORED = {
    nominations: [REGIONAL, NATIONAL],
    elections: ['regional', 'national'],
    constituencies: ['region-1']
  };

  it('reads Continue for an untouched set while a task is left, and Return when none is', async () => {
    const root = await render(STORED);
    expect(buttonOf(root)).toEqual({ label: 'common.continue', action: 'continue' });

    box = { ...box, taskState: NOTHING_LEFT };
    flushSync();
    expect(buttonOf(root)).toEqual({ label: 'common.return', action: 'return' });
  });

  it('reads Save and Continue for a changed card while a task is left, and Save and Return when none is', async () => {
    const root = await render(STORED);
    const symbol = one<HTMLInputElement>(cardsOf(root)[1], SYMBOL);
    commit(symbol, '22');
    expect(buttonOf(root)).toEqual({ label: 'common.saveAndContinue', action: 'continue' });

    box = { ...box, taskState: NOTHING_LEFT };
    flushSync();
    expect(buttonOf(root)).toEqual({ label: 'common.saveAndReturn', action: 'return' });

    // The stored symbol typed back leaves nothing to write.
    commit(symbol, '21');
    expect(buttonOf(root)).toEqual({ label: 'common.return', action: 'return' });
  });

  it('reads Save and Return when every card is removed, also while a task is left', async () => {
    const root = await render(STORED);
    await press(cardsOf(root)[0], REMOVE);
    expect(buttonOf(root)).toEqual({ label: 'common.saveAndContinue', action: 'continue' });

    await press(cardsOf(root)[1], REMOVE);
    expect(buttonOf(root)).toEqual({ label: 'common.saveAndReturn', action: 'return' });
  });

  it('reads Save and Continue for an entity that had no nomination', async () => {
    const root = await render({ nominations: [], elections: ['national'], taskState: NO_NOMINATION });

    expect(one(root, CARD).getAttribute('data-card-state')).toBe('new');
    expect(buttonOf(root)).toEqual({ label: 'common.saveAndContinue', action: 'continue' });
  });

  it('reads the saving label while a save is under way', async () => {
    const root = await render(STORED);
    commit(one<HTMLInputElement>(cardsOf(root)[1], SYMBOL), '22');
    setEntityNominations.mockReturnValue(new Promise(() => undefined));

    one<HTMLButtonElement>(root, SUBMIT).click();
    await afterPress();

    expect(one(root, STEP).getAttribute('data-editor-state')).toBe('saving');
    expect(textOf(one(root, SUBMIT))).toContain('common.saving');
    expect(textOf(one(root, SUBMIT))).not.toContain('common.saveAndContinue');
  });
});

describe('a save that is not stored', () => {
  const STORED = {
    nominations: [REGIONAL, NATIONAL],
    elections: ['regional', 'national'],
    constituencies: ['region-1']
  };

  /** The re-read that follows a save: the context holds the nominations given, as new objects. */
  function rereadAs(nominations: Array<EntityNomination>): void {
    invalidateAll.mockImplementation(async () => {
      box = { ...box, nominations: nominations.map((row) => ({ ...row })) };
    });
  }

  it('builds the cards again from the nominations as they now are, drops the draft and says they have changed', async () => {
    const root = await render({ nominations: [NATIONAL], elections: ['national'] });
    commit(one<HTMLInputElement>(root, SYMBOL), '99');
    expect(buttonOf(root).label).toBe('common.saveAndContinue');
    setEntityNominations.mockRejectedValue(new Error('setEntityNominations: no such nomination'));
    rereadAs([{ ...NATIONAL, electionSymbol: '55', confirmed: false }]);

    await press(root, SUBMIT);
    await settled(root);
    await afterPress();

    const message = one(root, MESSAGE);
    expect(message.getAttribute('data-outcome')).toBe('changed');
    expect(textOf(message)).toContain(KEYS.changed);
    expect(one<HTMLInputElement>(root, SYMBOL).value).toBe('55');
    expect(textOf(one(root, STATUS))).toBe(KEYS.pending);
    expect(getNominationParentOptions).toHaveBeenCalledTimes(2);
    expect(buttonOf(root)).toEqual({ label: 'common.continue', action: 'continue' });
    expect(document.activeElement).toBe(one(root, SUBMIT));
    expect(goto).not.toHaveBeenCalled();
  });

  it('says that candidates are listed under a nomination, and keeps the cards, the removal and what was typed', async () => {
    const root = await render(STORED);
    const [regional, national] = cardsOf(root);
    await press(regional, REMOVE);
    const symbol = one<HTMLInputElement>(national, SYMBOL);
    commit(symbol, '22');
    const before = buttonOf(root);
    setEntityNominations.mockResolvedValue({ type: 'refused', reason: 'hasCandidates' });
    rereadAs([REGIONAL, NATIONAL]);

    await press(root, SUBMIT);

    const message = one(root, MESSAGE);
    expect(message.getAttribute('data-outcome')).toBe('hasCandidates');
    expect(textOf(message)).toContain(KEYS.hasCandidates);
    expect(cardsOf(root)).toEqual([regional, national]);
    expect(cardsOf(root)[0]).toBe(regional);
    expect(regional.getAttribute('data-card-state')).toBe('removed');
    expect(count(regional, KEEP)).toBe(1);
    expect(one<HTMLInputElement>(national, SYMBOL)).toBe(symbol);
    expect(symbol.value).toBe('22');
    expect(getNominationParentOptions).toHaveBeenCalledTimes(1);
    expect(buttonOf(root)).toEqual(before);
    expect(document.activeElement).toBe(one(root, SUBMIT));
    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(goto).not.toHaveBeenCalled();
  });

  it('says that the limit on nominations waiting for confirmation is reached, and keeps what was typed', async () => {
    const root = await render(STORED);
    const symbol = one<HTMLInputElement>(cardsOf(root)[1], SYMBOL);
    commit(symbol, '22');
    const before = buttonOf(root);
    setEntityNominations.mockResolvedValue({ type: 'refused', reason: 'tooManyPending' });
    rereadAs([REGIONAL, NATIONAL]);

    await press(root, SUBMIT);

    const message = one(root, MESSAGE);
    expect(message.getAttribute('data-outcome')).toBe('tooManyPending');
    expect(textOf(message)).toContain(KEYS.tooManyPending);
    expect(one<HTMLInputElement>(cardsOf(root)[1], SYMBOL)).toBe(symbol);
    expect(symbol.value).toBe('22');
    expect(buttonOf(root)).toEqual(before);
    expect(document.activeElement).toBe(one(root, SUBMIT));
    expect(goto).not.toHaveBeenCalled();
  });

  it('shows its own message for a rejection, never the text it was rejected with, and tries again on a second press', async () => {
    const marker = 'MARKER-0f3c-policy-nominations_update';
    const logged = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const root = await render(STORED);
    const symbol = one<HTMLInputElement>(cardsOf(root)[1], SYMBOL);
    commit(symbol, '22');
    const before = buttonOf(root);
    setEntityNominations.mockRejectedValue(new Error(`setEntityNominations: ${marker}`));
    rereadAs([REGIONAL, NATIONAL]);

    await press(root, SUBMIT);

    const message = one(root, MESSAGE);
    expect(message.getAttribute('data-outcome')).toBe('failed');
    expect(textOf(message)).toContain(KEYS.saveFailed);
    expect(document.documentElement.outerHTML).not.toContain(marker);
    expect(logged.mock.calls.some(([text]) => String(text).includes(marker))).toBe(true);
    expect(symbol.value).toBe('22');
    expect(buttonOf(root)).toEqual(before);
    expect(document.activeElement).toBe(one(root, SUBMIT));
    expect(goto).not.toHaveBeenCalled();

    await press(root, SUBMIT);

    expect(setEntityNominations).toHaveBeenCalledTimes(2);
    expect(one(root, MESSAGE).getAttribute('data-outcome')).toBe('failed');
  });

  it('shows the general message for an answer it cannot name', async () => {
    const root = await render(STORED);
    commit(one<HTMLInputElement>(cardsOf(root)[1], SYMBOL), '22');
    setEntityNominations.mockResolvedValue({ type: 'refused', reason: 'somethingNew' });
    rereadAs([REGIONAL, NATIONAL]);

    await press(root, SUBMIT);

    expect(one(root, MESSAGE).getAttribute('data-outcome')).toBe('failed');
    expect(textOf(one(root, MESSAGE))).toContain(KEYS.saveFailed);
  });

  it('navigates nowhere and shows nothing when the re-read led out of the editor', async () => {
    const { root, takeAway } = await renderRemovable(STORED);
    commit(one<HTMLInputElement>(cardsOf(root)[1], SYMBOL), '22');
    setEntityNominations.mockRejectedValue(new Error('setEntityNominations: refused under the lock'));
    invalidateAll.mockImplementation(async () => {
      page.route.id = ROUTE.ContestantAppNominations;
      takeAway();
    });

    await press(root, SUBMIT);

    expect(setEntityNominations).toHaveBeenCalledTimes(1);
    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(goto).not.toHaveBeenCalled();
    expect(count(document, MESSAGE)).toBe(0);
  });
});

describe('a save that is stored, when the re-read led away from the page', () => {
  const STORED = {
    nominations: [REGIONAL, NATIONAL],
    elections: ['regional', 'national'],
    constituencies: ['region-1']
  };

  it('navigates nowhere further when the re-read led out of the editor', async () => {
    const { root, takeAway } = await renderRemovable(STORED);
    commit(one<HTMLInputElement>(cardsOf(root)[1], SYMBOL), '22');
    invalidateAll.mockImplementation(async () => {
      page.route.id = ROUTE.ContestantAppNominations;
      takeAway();
    });

    await press(root, SUBMIT);

    expect(setEntityNominations).toHaveBeenCalledTimes(1);
    expect(goto).not.toHaveBeenCalled();
  });

  it('still leads on to the next task when the re-read led to another step of the editor', async () => {
    const { root, takeAway } = await renderRemovable(STORED);
    commit(one<HTMLInputElement>(cardsOf(root)[1], SYMBOL), '22');
    invalidateAll.mockImplementation(async () => {
      page.route.id = ROUTE.ContestantAppNominationConstituencies;
      takeAway();
    });

    await press(root, SUBMIT);

    expect(setEntityNominations).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledTimes(1);
    expect(JSON.parse(goto.mock.calls[0][0])).toEqual({ route: 'ContestantAppProfile' });
  });
});

describe('leaving with changes that are not saved', () => {
  const STORED = {
    nominations: [REGIONAL, NATIONAL],
    elections: ['regional', 'national'],
    constituencies: ['region-1']
  };

  /** Run the page's navigation guards as a navigation away does, with the user's answer standing by, and say whether the user was asked and whether the navigation was cancelled. */
  function tryToLeave(answer: boolean): { asked: number; cancelled: boolean } {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(answer);
    const cancel = vi.fn();
    for (const guard of guards) guard({ cancel });
    const asked = confirm.mock.calls.length;
    confirm.mockRestore();
    return { asked, cancelled: cancel.mock.calls.length > 0 };
  }

  it('registers one guard, which does not ask for an untouched set', async () => {
    await render(STORED);

    expect(guards).toHaveLength(1);
    expect(tryToLeave(false)).toEqual({ asked: 0, cancelled: false });
  });

  it('asks while a field differs from what is stored, cancels the navigation on "stay" and lets it through on "leave"', async () => {
    const root = await render(STORED);
    const symbol = one<HTMLInputElement>(cardsOf(root)[1], SYMBOL);
    commit(symbol, '22');

    expect(tryToLeave(false)).toEqual({ asked: 1, cancelled: true });
    expect(symbol.value).toBe('22');
    expect(tryToLeave(true)).toEqual({ asked: 1, cancelled: false });

    // The stored value typed back is nothing to ask about.
    commit(symbol, '21');
    expect(tryToLeave(false)).toEqual({ asked: 0, cancelled: false });
  });

  it('asks while a card is about to be removed', async () => {
    const root = await render(STORED);
    await press(cardsOf(root)[0], REMOVE);

    expect(tryToLeave(false)).toEqual({ asked: 1, cancelled: true });
  });

  it('does not ask when Cancel leaves for the nominations view with a draft', async () => {
    const root = await render(STORED);
    commit(one<HTMLInputElement>(cardsOf(root)[1], SYMBOL), '22');
    let onLeaving: { asked: number; cancelled: boolean } | undefined;
    goto.mockImplementation(async () => {
      onLeaving = tryToLeave(false);
    });

    await press(root, CANCEL);

    expect(goto).toHaveBeenCalledTimes(1);
    expect(JSON.parse(goto.mock.calls[0][0])).toBe('ContestantAppNominations');
    expect(onLeaving).toEqual({ asked: 0, cancelled: false });
    expect(setEntityNominations).not.toHaveBeenCalled();
  });

  it('does not ask while a save is under way, nor at the navigation that follows a stored one', async () => {
    const root = await render(STORED);
    commit(one<HTMLInputElement>(cardsOf(root)[1], SYMBOL), '22');
    let duringReread: { asked: number; cancelled: boolean } | undefined;
    let onLeaving: { asked: number; cancelled: boolean } | undefined;
    invalidateAll.mockImplementation(async () => {
      duringReread = tryToLeave(false);
    });
    goto.mockImplementation(async () => {
      onLeaving = tryToLeave(false);
    });

    await press(root, SUBMIT);

    expect(duringReread).toEqual({ asked: 0, cancelled: false });
    expect(onLeaving).toEqual({ asked: 0, cancelled: false });
    expect(goto).toHaveBeenCalledTimes(1);
  });

  it('asks again after a save that was not stored left the draft on the page', async () => {
    const root = await render(STORED);
    commit(one<HTMLInputElement>(cardsOf(root)[1], SYMBOL), '22');
    setEntityNominations.mockResolvedValue({ type: 'refused', reason: 'hasCandidates' });

    await press(root, SUBMIT);

    expect(one(root, MESSAGE).getAttribute('data-outcome')).toBe('hasCandidates');
    expect(tryToLeave(false)).toEqual({ asked: 1, cancelled: true });
  });

  it('adds no dialog element to the page', async () => {
    const root = await render(STORED);
    commit(one<HTMLInputElement>(cardsOf(root)[1], SYMBOL), '22');
    tryToLeave(false);

    expect(count(root, 'dialog')).toBe(0);
  });
});
