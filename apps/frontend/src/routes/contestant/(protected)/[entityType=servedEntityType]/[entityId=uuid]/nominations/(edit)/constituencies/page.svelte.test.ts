/**
 * The constituency step of the nomination editor, mounted for real against a fake contestant context, with the real `MainContent`, `ConstituencySelector`, `Select`, `Loading` and `Button` below it.
 *
 * What this file holds:
 *
 * 1. **The sentence for a constituency with no election.** While a constituency group is chosen first and no election that admits the entity's type is held in the selected constituency, one sentence says so as a status message, Continue is disabled and the sentence describes it.
 * 2. **No sentence otherwise.** With an admissible election held in the selected constituency, in the constituency itself or in the one it lies in, and without a constituency group chosen first, the page holds no sentence and Continue follows the selection.
 * 3. **The loading form.** While the data root holds no constituency, a loading indicator stands in the selector's place and the page holds no sentence.
 * 4. **An entity that has nominations.** The constituency of its one nomination in an election is selected on arrival. An election in which it holds several nominations has no selector: a section headed by the election says that they are kept, and the selector is given the other elections alone.
 *
 * The fake context's members are reactive behind getters over one raw state box, as the real accessors are, and its data root is a real `DataRoot`. The page's data is what the step's real load answers for the same elections, settings, nominations and address. A constituency is selected as a user selects it: the selector's field is focused and an option of its list is pressed. Messages are their keys, and a route is the options it was asked for.
 */

import { dynamicSettings, staticSettings } from '@openvaa/app-shared';
import { DataRoot, NOMINATION_SHAPE } from '@openvaa/data';
import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { admissibleElectionsOf } from '$lib/contestant/nominations';
import { load } from './+page';
import type { ElectionData } from '@openvaa/data';
import type { UserEntity } from '$lib/api/base/dataWriter.type';
import type { RouteOptions } from '$lib/routes';
import type { NominationSelection } from '../stepSelection';

/** Everything the page reads from the contestant context. */
type Box = {
  selectedEntity: UserEntity | undefined;
  dataRoot: DataRoot;
  appSettings: AppSettings;
};

const ENTITY_ID = '11111111-1111-4111-8111-111111111111';

const CANDIDATE: UserEntity = {
  type: 'candidate',
  id: ENTITY_ID,
  firstName: 'Ada',
  lastName: 'Alpha',
  confirmed: true
};

/** The election held by region, and the election held by municipality in the shape given. */
function electionsOf(municipalShape: ElectionData['nominationShape']): Array<ElectionData> {
  return [
    { id: 'regional', name: 'Regional', constituencyGroupIds: ['regions'] },
    { id: 'municipal', name: 'Municipal', constituencyGroupIds: ['municipalities'], nominationShape: municipalShape }
  ];
}

/** Two regions, and three municipalities: one in each region and one that lies in no region. */
const CONSTITUENCY_DATA = {
  groups: [
    { id: 'regions', name: 'Regions', constituencyIds: ['region-1', 'region-2'] },
    {
      id: 'municipalities',
      name: 'Municipalities',
      constituencyIds: ['municipality-1a', 'municipality-2a', 'municipality-x']
    }
  ],
  constituencies: [
    { id: 'region-1', name: 'Region 1' },
    { id: 'region-2', name: 'Region 2' },
    { id: 'municipality-1a', name: 'Municipality 1a', parentId: 'region-1' },
    { id: 'municipality-2a', name: 'Municipality 2a', parentId: 'region-2' },
    { id: 'municipality-x', name: 'Municipality X' }
  ]
};

/** A data root that holds the two elections and their constituencies. A candidate can stand in the municipal election only in a shape that admits one. */
function dataRootOf(municipalShape: ElectionData['nominationShape']): DataRoot {
  const dataRoot = new DataRoot();
  dataRoot.provideElectionData(electionsOf(municipalShape));
  dataRoot.provideConstituencyData(CONSTITUENCY_DATA);
  return dataRoot;
}

/** The settings, with the constituency group that is chosen first, if any. */
function settingsOf(startFromConstituencyGroup?: string): AppSettings {
  return {
    ...staticSettings,
    ...dynamicSettings,
    elections: { ...dynamicSettings.elections, startFromConstituencyGroup }
  };
}

const EMPTY_BOX: Box = { selectedEntity: undefined, dataRoot: new DataRoot(), appSettings: settingsOf() };

let box = $state.raw<Box>(EMPTY_BOX);

const goto = vi.fn(async (_address: string) => undefined);

const context = {
  t: (key: string) => key,
  getRoute: { current: (options: RouteOptions) => JSON.stringify(options) },
  get appSettings() {
    return box.appSettings;
  },
  get dataRoot() {
    return box.dataRoot;
  },
  get selectedEntity() {
    return box.selectedEntity;
  }
};

vi.mock('$app/navigation', () => ({ goto: (address: string) => goto(address) }));
vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ locale: 'en', t: (key: string) => key, darkMode: { current: false } })
}));
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

const STEP = '[data-testid="contestant-nomination-constituencies"]';
const LIST = '[data-testid="contestant-nomination-constituencies-list"]';
const SENTENCE = '[data-testid="contestant-nomination-constituencies-no-election"]';
const KEPT = '[data-testid="contestant-nomination-constituencies-kept"]';
const CONTINUE = '[data-testid="contestant-nomination-constituencies-continue"]';
const LOADING = '[data-testid="loading-indicator"]';
const PICKER = 'input[role="combobox"]';
const OPTION = '[role="option"]';

const NO_ELECTION = 'contestantApp.nominations.constituencies.noElection.candidate';
const SEVERAL_KEPT = 'contestantApp.nominations.constituencies.severalKept';

let teardown: Array<() => void> = [];

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  box = EMPTY_BOX;
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

/** What a case states: the shape of the municipal election, the constituency group that is chosen first, if any, the candidate's nominations, and whether the context's data root holds nothing yet. */
type World = {
  municipalShape: ElectionData['nominationShape'];
  startFromConstituencyGroup?: string;
  nominations?: Array<{ electionId: string; constituencyId: string }>;
  emptyDataRoot?: boolean;
};

/** The data the step's load answers for a world and the selection of an address. */
async function pageDataOf(world: World, { electionIds, constituencyIds }: NominationSelection): Promise<unknown> {
  const nominations = (world.nominations ?? []).map((nomination, index) => ({
    id: `nomination-${index}`,
    ...nomination
  }));
  const search = new URLSearchParams();
  for (const id of electionIds) search.append('nominationElectionId', id);
  for (const id of constituencyIds) search.append('nominationConstituencyId', id);
  const event = {
    params: { entityType: 'candidate', entityId: ENTITY_ID },
    parent: async () => ({
      gate: null,
      nominationFacts: {
        editable: true,
        admissibleElectionIds: admissibleElectionsOf(dataRootOf(world.municipalShape).elections, 'candidate').map(
          (election) => election.id
        ),
        inReachNominationIds: nominations.map((nomination) => nomination.id)
      },
      contestantUserData: { nominations },
      appSettingsData: { elections: { startFromConstituencyGroup: world.startFromConstituencyGroup } },
      electionData: electionsOf(world.municipalShape),
      constituencyData: CONSTITUENCY_DATA
    }),
    url: new URL(`http://localhost/contestant/candidate/${ENTITY_ID}/nominations/constituencies?${search}`)
  };
  return load(event as never);
}

/** Mount the page in a world, with the data the step's load answers for the selection of its address. */
async function render(world: World, selection: NominationSelection): Promise<HTMLElement> {
  const data = await pageDataOf(world, selection);
  box = {
    selectedEntity: CANDIDATE,
    dataRoot: world.emptyDataRoot ? new DataRoot() : dataRootOf(world.municipalShape),
    appSettings: settingsOf(world.startFromConstituencyGroup)
  };
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(Page, { target, props: { data: data as never } });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
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

/** Select the constituency of that name in the page's one picker, as a user does: focus the field, then press the option. */
async function choose(root: ParentNode, name: string): Promise<void> {
  one(root, PICKER).focus();
  await tick();
  flushSync();
  const option = [...root.querySelectorAll<HTMLElement>(OPTION)].filter((element) => textOf(element) === name);
  expect(option, `options named ${name}`).toHaveLength(1);
  option[0].click();
  await tick();
  flushSync();
}

/** The selection the page went on with, as the options the route was asked for. */
function wentOnWith(): Record<string, unknown> {
  expect(goto).toHaveBeenCalledTimes(1);
  return JSON.parse(goto.mock.calls[0][0]) as Record<string, unknown>;
}

const NOTHING_CHOSEN: NominationSelection = { electionIds: [], constituencyIds: [] };

describe('while a constituency group is chosen first', () => {
  it('says that no election the entity can stand in is held in the selected constituency, and describes the disabled Continue by it', async () => {
    const root = await render(
      { municipalShape: NOMINATION_SHAPE.OrganizationOnly, startFromConstituencyGroup: 'municipalities' },
      { electionIds: ['regional'], constituencyIds: [] }
    );
    expect(count(root, SENTENCE)).toBe(0);
    expect(one<HTMLButtonElement>(root, CONTINUE).disabled).toBe(true);
    expect(one(root, CONTINUE).hasAttribute('aria-describedby')).toBe(false);

    await choose(root, 'Municipality X');

    const sentence = one(root, SENTENCE);
    expect(textOf(sentence)).toBe(NO_ELECTION);
    expect(sentence.closest(STEP)).not.toBeNull();
    expect(sentence.id).not.toBe('');
    expect(sentence.getAttribute('role')).toBe('status');
    const button = one<HTMLButtonElement>(root, CONTINUE);
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-describedby')).toBe(sentence.id);

    button.click();
    flushSync();
    expect(goto).not.toHaveBeenCalled();
  });

  it('holds no sentence for a constituency that lies in one where the one admissible election is held, and goes on to the details step with both', async () => {
    const root = await render(
      { municipalShape: NOMINATION_SHAPE.OrganizationOnly, startFromConstituencyGroup: 'municipalities' },
      { electionIds: ['regional'], constituencyIds: [] }
    );
    await choose(root, 'Municipality 1a');

    expect(count(root, SENTENCE)).toBe(0);
    const button = one<HTMLButtonElement>(root, CONTINUE);
    expect(button.disabled).toBe(false);
    expect(button.hasAttribute('aria-describedby')).toBe(false);

    button.click();
    flushSync();
    expect(wentOnWith()).toEqual({
      route: 'ContestantAppNominationDetails',
      nominationElectionId: ['regional'],
      nominationConstituencyId: ['municipality-1a', 'region-1']
    });
  });

  it('takes the sentence away when a constituency with an admissible election is selected instead', async () => {
    const root = await render(
      { municipalShape: NOMINATION_SHAPE.OrganizationOnly, startFromConstituencyGroup: 'municipalities' },
      { electionIds: ['regional'], constituencyIds: [] }
    );
    await choose(root, 'Municipality X');
    expect(count(root, SENTENCE)).toBe(1);

    await choose(root, 'Municipality 2a');
    expect(count(root, SENTENCE)).toBe(0);
    expect(one<HTMLButtonElement>(root, CONTINUE).disabled).toBe(false);
  });

  it('holds no sentence when one of several admissible elections is held in the selected constituency', async () => {
    const root = await render(
      {
        municipalShape: NOMINATION_SHAPE.OrganizationListAndIndependents,
        startFromConstituencyGroup: 'municipalities'
      },
      NOTHING_CHOSEN
    );
    await choose(root, 'Municipality X');

    expect(count(root, SENTENCE)).toBe(0);
    const button = one<HTMLButtonElement>(root, CONTINUE);
    expect(button.disabled).toBe(false);

    button.click();
    flushSync();
    expect(wentOnWith()).toEqual({
      route: 'ContestantAppNominationDetails',
      nominationElectionId: ['municipal'],
      nominationConstituencyId: ['municipality-x']
    });
  });
});

describe('without a constituency group chosen first', () => {
  it('holds no sentence, and Continue follows the selection', async () => {
    const root = await render(
      { municipalShape: NOMINATION_SHAPE.OrganizationOnly },
      { electionIds: ['regional'], constituencyIds: [] }
    );
    expect(count(root, LIST)).toBe(1);
    expect(count(root, SENTENCE)).toBe(0);
    expect(one<HTMLButtonElement>(root, CONTINUE).disabled).toBe(true);

    await choose(root, 'Region 1');

    expect(count(root, SENTENCE)).toBe(0);
    const button = one<HTMLButtonElement>(root, CONTINUE);
    expect(button.disabled).toBe(false);
    expect(button.hasAttribute('aria-describedby')).toBe(false);
  });
});

describe('while the data root holds no constituency', () => {
  it('shows a loading indicator in the place of the selector, and no sentence', async () => {
    const root = await render(
      {
        municipalShape: NOMINATION_SHAPE.OrganizationListAndIndependents,
        startFromConstituencyGroup: 'municipalities',
        emptyDataRoot: true
      },
      NOTHING_CHOSEN
    );
    expect(count(root, STEP)).toBe(1);
    expect(count(root, LIST)).toBe(0);
    expect(count(root, PICKER)).toBe(0);
    expect(count(root, SENTENCE)).toBe(0);
    expect(root.querySelectorAll(`${STEP} ${LOADING}`).length).toBeGreaterThan(0);
    const button = one<HTMLButtonElement>(root, CONTINUE);
    expect(button.disabled).toBe(true);
    expect(button.hasAttribute('aria-describedby')).toBe(false);
  });
});

describe('for an entity that has nominations', () => {
  const OPEN = NOMINATION_SHAPE.OrganizationListAndIndependents;
  const BOTH: NominationSelection = { electionIds: ['regional', 'municipal'], constituencyIds: [] };

  it("selects the constituency of the entity's one nomination in an election on arrival, and goes on with it", async () => {
    const root = await render(
      { municipalShape: OPEN, nominations: [{ electionId: 'municipal', constituencyId: 'municipality-2a' }] },
      { electionIds: ['municipal'], constituencyIds: [] }
    );
    await tick();
    flushSync();

    expect(one<HTMLInputElement>(root, PICKER).value).toContain('Municipality 2a');
    expect(count(root, KEPT)).toBe(0);
    const button = one<HTMLButtonElement>(root, CONTINUE);
    expect(button.disabled).toBe(false);

    button.click();
    flushSync();
    expect(wentOnWith()).toEqual({
      route: 'ContestantAppNominationDetails',
      nominationElectionId: ['municipal'],
      nominationConstituencyId: ['municipality-2a']
    });
  });

  it('selects the constituency the address names in place of the stored one', async () => {
    const root = await render(
      { municipalShape: OPEN, nominations: [{ electionId: 'municipal', constituencyId: 'municipality-2a' }] },
      { electionIds: ['municipal'], constituencyIds: ['municipality-x'] }
    );
    await tick();
    flushSync();

    expect(one<HTMLInputElement>(root, PICKER).value).toContain('Municipality X');
  });

  it('shows a section in the place of a selector for an election with several nominations, and hands the selector the other election alone', async () => {
    const root = await render(
      {
        municipalShape: OPEN,
        nominations: [
          { electionId: 'regional', constituencyId: 'region-1' },
          { electionId: 'regional', constituencyId: 'region-2' }
        ]
      },
      BOTH
    );

    const kept = one(root, KEPT);
    expect(kept.tagName).toBe('SECTION');
    expect(kept.closest(STEP)).not.toBeNull();
    expect(textOf(one(kept, 'h3'))).toBe('Regional');
    expect(textOf(one(kept, 'p'))).toBe(SEVERAL_KEPT);
    expect(count(kept, PICKER)).toBe(0);

    // One selector, for the election left to choose: a single selector has no heading of its own.
    expect(count(root, PICKER)).toBe(1);
    expect(count(root, `${LIST} h3`)).toBe(0);
    expect(one<HTMLButtonElement>(root, CONTINUE).disabled).toBe(true);

    await choose(root, 'Municipality 1a');

    const button = one<HTMLButtonElement>(root, CONTINUE);
    expect(button.disabled).toBe(false);
    button.click();
    flushSync();
    expect(wentOnWith()).toEqual({
      route: 'ContestantAppNominationDetails',
      nominationElectionId: ['regional', 'municipal'],
      nominationConstituencyId: ['municipality-1a']
    });
  });

  it('shows no such section for an election with one nomination, which is left to the selector', async () => {
    const root = await render(
      { municipalShape: OPEN, nominations: [{ electionId: 'regional', constituencyId: 'region-2' }] },
      BOTH
    );

    expect(count(root, KEPT)).toBe(0);
    expect(count(root, LIST)).toBe(1);
    expect(root.querySelectorAll(PICKER).length).toBeGreaterThan(0);
  });

  it('while a constituency group is chosen first, selects the stored constituency only where the group holds it, and shows no such section', async () => {
    const inGroup = await render(
      {
        municipalShape: OPEN,
        startFromConstituencyGroup: 'municipalities',
        nominations: [{ electionId: 'municipal', constituencyId: 'municipality-1a' }]
      },
      NOTHING_CHOSEN
    );
    await tick();
    flushSync();
    expect(one<HTMLInputElement>(inGroup, PICKER).value).toContain('Municipality 1a');
    expect(count(inGroup, KEPT)).toBe(0);

    const outsideGroup = await render(
      {
        municipalShape: OPEN,
        startFromConstituencyGroup: 'municipalities',
        nominations: [
          { electionId: 'regional', constituencyId: 'region-1' },
          { electionId: 'regional', constituencyId: 'region-2' }
        ]
      },
      NOTHING_CHOSEN
    );
    await tick();
    flushSync();
    expect(one<HTMLInputElement>(outsideGroup, PICKER).value).toBe('');
    expect(count(outsideGroup, KEPT)).toBe(0);
    expect(one<HTMLButtonElement>(outsideGroup, CONTINUE).disabled).toBe(true);
  });
});
