/**
 * The nominations page of an entity of the Contestant App, mounted for real against a fake contestant context and the page's data, with the real `MainContent`, `NotEditableNote`, `ContactSupport` and `Button` below it.
 *
 * What this file holds:
 *
 * 1. **The listed view.** One card per nomination in the list's order, each an article named by its heading and an item of a list, with the rows a nomination has and no row it lacks, its real state, and the line under an unconfirmed one. A nomination stored with a typed parent name shows that name as text, with the line that says it is a request.
 * 2. **The six states.** With nominations or with none; nominations editable or not; an election that admits the entity or none. For each: the note and its reason, the sentence, what the empty sentence says of itself, the number of Contact support buttons, whether the link to the editor is rendered and where it leads, the main button, and the two state attributes of the container.
 * 3. **The note.** Shown under either lock, one note and never two, with the reason of the lock. No state of the view holds two Contact support buttons.
 * 4. **The button.** A return to the entity's home, a continue to the next task, or the way into the editor for an entity with no nomination that can define one, and the loading form while the entity's tasks are not known.
 * 5. **What the page does not do.** It reads no data root, logs nothing, holds no form control, puts no control on a card and gives no element a view-transition name.
 *
 * The fake context's members are reactive behind getters over one raw state box, as the real accessors are, and its `dataRoot` throws when it is read. The page's data is a raw state too, handed over behind a getter, so that a load run again reaches the mounted page. Task states are built with the real `taskStateOf`. Messages are their keys, and a route is its name.
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { taskStateOf } from '$lib/contestant/tasks';
import type { EntityNomination, UserEntity } from '$lib/api/base/dataWriter.type';
import type { TaskState, TaskStateInput } from '$lib/contestant/tasks';
import type { RouteOptions } from '$lib/routes';
import type { NominationFacts } from './nominationFacts';

/** Everything the page reads from the contestant context. */
type Box = {
  selectedEntity: UserEntity | undefined;
  nominations: ReadonlyArray<EntityNomination> | undefined;
  nominationsLocked: boolean;
  answersLocked: boolean;
  taskState: TaskState;
};

/** What the page reads of its data. */
type PageData = { nominationFacts: NominationFacts | undefined };

/** The facts of an entity with a nomination whose every task is complete, while nominations cannot be edited. */
const ALL_COMPLETE: TaskStateInput = {
  entityKnown: true,
  hasNomination: true,
  nominationsEditable: false,
  questionsReady: true,
  unansweredRequiredInfoCount: 0,
  requiredNameMissing: false,
  opinionCount: 2,
  unansweredOpinionCount: 0,
  firstUnansweredOpinionId: undefined
};

const STATE = {
  /** Nothing is known of the entity. */
  unknownEntity: taskStateOf({ ...ALL_COMPLETE, entityKnown: false }),
  /** The entity has no nomination, and nominations cannot be edited. */
  noNomination: taskStateOf({ ...ALL_COMPLETE, hasNomination: false }),
  /** The entity has no nomination, and nominations can be edited. */
  noNominationEditable: taskStateOf({ ...ALL_COMPLETE, hasNomination: false, nominationsEditable: true }),
  /** The entity has a nomination and its question lists are not loaded. */
  notKnown: taskStateOf({ ...ALL_COMPLETE, questionsReady: false }),
  /** A required info question is unanswered. */
  profileNext: taskStateOf({ ...ALL_COMPLETE, unansweredRequiredInfoCount: 1, unansweredOpinionCount: 2 }),
  /** The profile is complete and an opinion question is unanswered. */
  questionsNext: taskStateOf({ ...ALL_COMPLETE, unansweredOpinionCount: 1, firstUnansweredOpinionId: 'q-2' }),
  /** Every task is complete. */
  allComplete: taskStateOf(ALL_COMPLETE)
};

const EMPTY_BOX: Box = {
  selectedEntity: undefined,
  nominations: undefined,
  nominationsLocked: false,
  answersLocked: false,
  taskState: STATE.unknownEntity
};

/** Nominations can be edited and an election admits the entity. */
const EDITABLE: NominationFacts = {
  editable: true,
  admissibleElectionIds: ['election-1', 'election-2'],
  inReachNominationIds: []
};
/** A lock is on. */
const NOT_EDITABLE: NominationFacts = { ...EDITABLE, editable: false };
/** Nominations can be edited and no election admits the entity. */
const NO_ELECTION: NominationFacts = { ...EDITABLE, admissibleElectionIds: [] };

let box = $state.raw<Box>(EMPTY_BOX);
let pageData = $state.raw<PageData>({ nominationFacts: undefined });

const push = vi.fn();
const revert = vi.fn();

const context = {
  t: (key: string) => key,
  getRoute: {
    current: (options: RouteOptions) => {
      const { route, questionId } = typeof options === 'string' ? { route: options, questionId: undefined } : options;
      return `/route/${route}${questionId ? `/${questionId}` : ''}`;
    }
  },
  appSettings: { admin: { email: 'support@example.org' } },
  get dataRoot(): never {
    throw new Error('the page read the data root');
  },
  get selectedEntity() {
    return box.selectedEntity;
  },
  get nominations() {
    return box.nominations;
  },
  get nominationsLocked() {
    return box.nominationsLocked;
  },
  get answersLocked() {
    return box.answersLocked;
  },
  get taskState() {
    return box.taskState;
  }
};

vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ locale: 'en', t: (key: string) => key, darkMode: { current: false } })
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

const VIEW = '[data-testid="contestant-nominations"]';
const LIST = '[data-testid="contestant-nominations-list"]';
const CARD = '[data-testid="contestant-nomination"]';
const ELECTION = '[data-testid="nomination-election"]';
const CONSTITUENCY = '[data-testid="nomination-constituency"]';
const PARENT = '[data-testid="nomination-parent"]';
const SYMBOL = '[data-testid="nomination-election-symbol"]';
const CARD_STATE = '[data-testid="nomination-state"]';
const PENDING_NOTE = '[data-testid="nomination-pending-note"]';
const EMPTY = '[data-testid="contestant-nominations-empty"]';
const LOCKED_NOTE = '[data-testid="contestant-nominations-locked-note"]';
const BUTTON = '[data-testid="contestant-nominations-continue"]';
const EDIT = '[data-testid="contestant-nominations-edit"]';
const REQUESTED_PARENT = '[data-testid="nomination-requested-parent"]';
const SUPPORT_BUTTON = '[data-testid="contestant-contact-support"]';

const TITLE = 'contestantApp.nominations.title';
const DESCRIPTION = {
  candidate: 'contestantApp.nominations.description.candidate',
  organization: 'contestantApp.nominations.description.organization'
};
const DESCRIPTION_EDITABLE = {
  candidate: 'contestantApp.nominations.descriptionEditable.candidate',
  organization: 'contestantApp.nominations.descriptionEditable.organization'
};
const EMPTY_SENTENCE = {
  candidate: 'contestantApp.nominations.empty.candidate',
  organization: 'contestantApp.nominations.empty.organization'
};
const EMPTY_EDITABLE_SENTENCE = {
  candidate: 'contestantApp.nominations.emptyEditable.candidate',
  organization: 'contestantApp.nominations.emptyEditable.organization'
};
const EMPTY_NO_ELECTION_SENTENCE = {
  candidate: 'contestantApp.nominations.emptyNoElection.candidate',
  organization: 'contestantApp.nominations.emptyNoElection.organization'
};
const EDIT_LABEL = 'contestantApp.nominations.edit';
const DEFINE_LABEL = 'contestantApp.home.nomination.enter';
const REQUESTED_PARENT_LINE = 'contestantApp.nominations.requestedParent';
const EDITOR_ENTRY = '/route/ContestantAppNominationElections';
const HOME = '/route/ContestantAppEntityHome';
const CONSTITUENCY_LABEL = 'common.constituency';
const PARENT_LABEL = { candidate: 'common.electionList', organization: 'common.alliance.singular' };
const SYMBOL_LABEL = {
  candidate: 'common.electionSymbol.candidate',
  organization: 'common.electionSymbol.organization'
};
const STATE_LABEL = 'contestantApp.nominations.state.label';
const CONFIRMED = 'common.confirmed';
const PENDING = 'contestantApp.nominations.state.pending';
const PENDING_INFO = 'contestantApp.nominations.state.pendingInfo';
const LOCKED_SENTENCE = 'contestantApp.common.nominationsNotEditable';
const ANSWERS_LOCKED_SENTENCE = 'contestantApp.common.nominationsNotEditableAnswersLocked';
const SHADED = { drawer: { background: 'bg-base-200' } };

const ENTITY_ID = '11111111-1111-4111-8111-111111111111';

const CANDIDATE: UserEntity = {
  type: 'candidate',
  id: ENTITY_ID,
  firstName: 'Ada',
  lastName: 'Alpha',
  confirmed: true
};
const PARTY: UserEntity = { type: 'organization', id: ENTITY_ID, name: 'Esimerkkipuolue', confirmed: true };

/** A confirmed nomination with a symbol and no parent. */
function nomination(overrides: Partial<EntityNomination> = {}): EntityNomination {
  return {
    id: 'nomination-1',
    electionId: 'election-1',
    electionName: 'Parliamentary Election',
    constituencyId: 'constituency-1',
    constituencyName: 'Northern District',
    electionRound: 1,
    electionSymbol: '42',
    confirmed: true,
    customData: null,
    ...overrides
  };
}

const FIRST = nomination();
const SECOND = nomination({
  id: 'nomination-2',
  electionId: 'election-2',
  electionName: 'Municipal Election',
  constituencyName: 'Harbour Town',
  electionSymbol: '7'
});

let teardown: Array<() => void> = [];

beforeEach(() => {
  vi.spyOn(log, 'error').mockImplementation(() => undefined);
  vi.spyOn(log, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  box = EMPTY_BOX;
  pageData = { nominationFacts: undefined };
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

/**
 * Mount the page for a state of the context and the facts of its data.
 * @param state - What the context holds.
 * @param facts - The facts of the page's data, or `null` for data that holds none. Left out, nominations can be edited and an election admits the entity.
 */
function render(state: Partial<Box>, facts: NominationFacts | null = EDITABLE): HTMLElement {
  box = { ...EMPTY_BOX, ...state };
  pageData = { nominationFacts: facts ?? undefined };
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(Page, {
    target,
    props: {
      get data() {
        return pageData as never;
      }
    }
  });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/** Replace part of the context's state under a mounted page and, when given, the facts of the page's data. */
function update(state: Partial<Box>, facts?: NominationFacts): void {
  box = { ...box, ...state };
  if (facts) pageData = { nominationFacts: facts };
  flushSync();
}

/** The one element a selector names under `root`. */
function one(root: ParentNode, selector: string): HTMLElement {
  const found = root.querySelectorAll<HTMLElement>(selector);
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

/** The label and value of each row of a card, in order. */
function rowsOf(card: Element): Array<[string, string]> {
  const list = one(card, 'dl');
  return [...list.children].map((row) => {
    expect(row.children, 'a row holds one label and one value').toHaveLength(2);
    const [label, value] = [...row.children];
    expect(label.tagName).toBe('DT');
    expect(value.tagName).toBe('DD');
    return [textOf(label), textOf(value)];
  });
}

/** The cards of the view, in document order. */
function cardsOf(target: ParentNode): Array<HTMLElement> {
  return [...one(target, LIST).querySelectorAll<HTMLElement>(CARD)];
}

describe('the nominations page — an entity with nominations', () => {
  it('lists one card per nomination in the order of the list, under the sentence of the entity type', () => {
    const target = render({ selectedEntity: CANDIDATE, nominations: [FIRST, SECOND], taskState: STATE.allComplete });

    const view = one(target, VIEW);
    expect(view.getAttribute('data-nominations-state')).toBe('listed');
    expect(view.getAttribute('data-nominations-locked')).toBe('false');
    expect(textOf(one(view, 'h1'))).toBe(TITLE);
    expect(textOf(view)).toContain(DESCRIPTION_EDITABLE.candidate);

    const list = one(view, LIST);
    expect(list.tagName).toBe('UL');
    expect(list.getAttribute('role')).toBe('list');
    const cards = cardsOf(view);
    expect(cards.map((card) => textOf(one(card, ELECTION)))).toEqual(['Parliamentary Election', 'Municipal Election']);
    for (const card of cards) {
      expect(card.tagName).toBe('ARTICLE');
      expect(card.parentElement?.tagName).toBe('LI');
      const heading = one(card, 'h2');
      expect(heading.matches(ELECTION)).toBe(true);
      expect(heading.id).not.toBe('');
      expect(card.getAttribute('aria-labelledby')).toBe(heading.id);
    }
    expect(new Set(cards.map((card) => one(card, 'h2').id)).size).toBe(2);

    expect(count(view, LOCKED_NOTE)).toBe(0);
    expect(count(view, SUPPORT_BUTTON)).toBe(0);
    expect(count(view, EMPTY)).toBe(0);
  });

  it('mounts without reading the data root and logs nothing', () => {
    const target = render({ selectedEntity: CANDIDATE, nominations: [FIRST, SECOND], taskState: STATE.allComplete });

    expect(cardsOf(target)).toHaveLength(2);
    expect(log.error).not.toHaveBeenCalled();
    expect(log.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('shades the page while it lists cards', () => {
    render({ selectedEntity: CANDIDATE, nominations: [FIRST], taskState: STATE.allComplete });

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(SHADED);
  });

  it('shows four rows for a confirmed nomination with a parent and a symbol, and no pending line', () => {
    const target = render({
      selectedEntity: CANDIDATE,
      nominations: [
        nomination({
          parent: {
            entityType: 'organization',
            entityId: 'organization-1',
            name: 'The Example Party',
            shortName: 'TEP'
          }
        })
      ],
      taskState: STATE.allComplete
    });

    const [card] = cardsOf(target);
    expect(card.getAttribute('data-confirmed')).toBe('true');
    expect(rowsOf(card)).toEqual([
      [CONSTITUENCY_LABEL, 'Northern District'],
      [PARENT_LABEL.candidate, 'The Example Party'],
      [SYMBOL_LABEL.candidate, '42'],
      [STATE_LABEL, CONFIRMED]
    ]);
    expect(textOf(one(card, CONSTITUENCY))).toBe('Northern District');
    expect(textOf(one(card, PARENT))).toBe('The Example Party');
    expect(textOf(one(card, SYMBOL))).toBe('42');
    expect(textOf(one(card, CARD_STATE))).toBe(CONFIRMED);
    expect(count(card, PENDING_NOTE)).toBe(0);
  });

  it("shows a parent's short name when its name is empty", () => {
    const target = render({
      selectedEntity: CANDIDATE,
      nominations: [
        nomination({ parent: { entityType: 'organization', entityId: 'organization-1', name: '', shortName: 'TEP' } })
      ],
      taskState: STATE.allComplete
    });

    expect(textOf(one(cardsOf(target)[0], PARENT))).toBe('TEP');
  });

  it('shows two rows for a nomination with no parent and no symbol', () => {
    const target = render({
      selectedEntity: CANDIDATE,
      nominations: [nomination({ electionSymbol: '' })],
      taskState: STATE.allComplete
    });

    const [card] = cardsOf(target);
    expect(rowsOf(card)).toEqual([
      [CONSTITUENCY_LABEL, 'Northern District'],
      [STATE_LABEL, CONFIRMED]
    ]);
    expect(count(card, PARENT)).toBe(0);
    expect(count(card, SYMBOL)).toBe(0);
  });

  it('says that an unconfirmed nomination is pending, with the line that voters do not see it yet', () => {
    const target = render({
      selectedEntity: CANDIDATE,
      nominations: [nomination({ confirmed: false })],
      taskState: STATE.allComplete
    });

    const [card] = cardsOf(target);
    expect(card.getAttribute('data-confirmed')).toBe('false');
    expect(textOf(one(card, CARD_STATE))).toBe(PENDING);
    expect(textOf(one(card, PENDING_NOTE))).toBe(PENDING_INFO);
  });

  it('renders a name as text, whatever it holds', () => {
    const markup = '<img src=x onerror=alert(1)><b>Party</b>';
    const target = render({
      selectedEntity: CANDIDATE,
      nominations: [
        nomination({
          electionName: markup,
          constituencyName: markup,
          parent: { entityType: 'organization', entityId: 'organization-1', name: markup }
        })
      ],
      taskState: STATE.allComplete
    });

    const [card] = cardsOf(target);
    expect(textOf(one(card, ELECTION))).toBe(markup);
    expect(textOf(one(card, CONSTITUENCY))).toBe(markup);
    expect(textOf(one(card, PARENT))).toBe(markup);
    expect(count(card, 'img, b')).toBe(0);
  });

  it("uses the party's sentence and labels for an organization", () => {
    const target = render({
      selectedEntity: PARTY,
      nominations: [
        nomination({ parent: { entityType: 'alliance', entityId: 'alliance-1', name: 'The Example Alliance' } })
      ],
      taskState: STATE.allComplete
    });

    const view = one(target, VIEW);
    expect(textOf(view)).toContain(DESCRIPTION_EDITABLE.organization);
    expect(textOf(view)).not.toContain(DESCRIPTION_EDITABLE.candidate);
    expect(rowsOf(cardsOf(view)[0])).toEqual([
      [CONSTITUENCY_LABEL, 'Northern District'],
      [PARENT_LABEL.organization, 'The Example Alliance'],
      [SYMBOL_LABEL.organization, '42'],
      [STATE_LABEL, CONFIRMED]
    ]);
  });
});

describe('the nominations page — a parent the user typed', () => {
  it('shows the typed name on the parent row of a nomination with no parent, with the line that it is a request', () => {
    const target = render({
      selectedEntity: CANDIDATE,
      nominations: [nomination({ confirmed: false, customData: { requestedParentOrganization: 'A Party I Typed' } })],
      taskState: STATE.allComplete
    });

    const [card] = cardsOf(target);
    const parent = one(card, PARENT);
    expect(parent.tagName).toBe('DD');
    expect(textOf(parent.previousElementSibling!)).toBe(PARENT_LABEL.candidate);
    expect(textOf(parent).startsWith('A Party I Typed')).toBe(true);
    const line = one(card, REQUESTED_PARENT);
    expect(parent.contains(line)).toBe(true);
    expect(textOf(line)).toBe(REQUESTED_PARENT_LINE);
    expect(line.className).toContain('small-info');
    expect(rowsOf(card).map(([label]) => label)).toEqual([
      CONSTITUENCY_LABEL,
      PARENT_LABEL.candidate,
      SYMBOL_LABEL.candidate,
      STATE_LABEL
    ]);
  });

  it("uses the party's label for an organization that typed an alliance", () => {
    const target = render({
      selectedEntity: PARTY,
      nominations: [nomination({ customData: { requestedParentOrganization: 'An Alliance I Typed' } })],
      taskState: STATE.allComplete
    });

    const [card] = cardsOf(target);
    expect(textOf(one(card, PARENT).previousElementSibling!)).toBe(PARENT_LABEL.organization);
    expect(count(card, REQUESTED_PARENT)).toBe(1);
  });

  it('renders the typed name as text, whatever it holds', () => {
    const markup = '<img src=x onerror=alert(1)><b>Party</b>';
    const target = render({
      selectedEntity: CANDIDATE,
      nominations: [nomination({ customData: { requestedParentOrganization: markup } })],
      taskState: STATE.allComplete
    });

    const [card] = cardsOf(target);
    expect(textOf(one(card, PARENT))).toContain(markup);
    expect(count(card, 'img, b')).toBe(0);
  });

  it('shows the parent itself, and no line of a request, for a nomination that has a parent', () => {
    const target = render({
      selectedEntity: CANDIDATE,
      nominations: [
        nomination({
          parent: { entityType: 'organization', entityId: 'organization-1', name: 'The Example Party' },
          customData: { requestedParentOrganization: 'A Party I Typed' }
        })
      ],
      taskState: STATE.allComplete
    });

    const [card] = cardsOf(target);
    expect(textOf(one(card, PARENT))).toBe('The Example Party');
    expect(count(card, REQUESTED_PARENT)).toBe(0);
  });

  it.each([
    ['no custom data', null],
    ['custom data that holds no typed name', { other: 'value' }],
    ['a typed name of white space alone', { requestedParentOrganization: '   ' }],
    ['a typed name that is no text', { requestedParentOrganization: 7 }]
  ])('shows no parent row for a nomination with no parent and %s', (_, customData) => {
    const target = render({
      selectedEntity: CANDIDATE,
      nominations: [nomination({ customData })],
      taskState: STATE.allComplete
    });

    const [card] = cardsOf(target);
    expect(count(card, PARENT)).toBe(0);
    expect(count(card, REQUESTED_PARENT)).toBe(0);
  });
});

/** What a state of the view is expected to show. */
type ViewCase = {
  title: string;
  entity: UserEntity;
  nominations: ReadonlyArray<EntityNomination>;
  locks: Pick<Box, 'nominationsLocked' | 'answersLocked'>;
  /** The facts of the page's data, or `null` for data that holds none. */
  facts: NominationFacts | null;
  taskState: TaskState;
  expected: {
    /** The note's reason, or `null` for no note. */
    note: 'nominationsLocked' | 'nominationsAnswersLocked' | null;
    /** The key of the sentence. */
    sentence: string;
    /** What the empty sentence says of itself, or `null` where nominations are listed. */
    empty: 'define' | 'locked' | 'noElection' | null;
    /** How many Contact support buttons the page holds. */
    support: number;
    /** Whether the link to the editor is rendered. */
    edit: boolean;
    /** The main button: its action, the key of its label and its address. */
    button: { action: 'continue' | 'return' | 'define'; label: string; href: string };
    /** Whether the container says an entry to the editor is offered. */
    editable: boolean;
  };
};

const NO_LOCK = { nominationsLocked: false, answersLocked: false };
const NOMINATIONS_LOCK = { nominationsLocked: true, answersLocked: false };
const ANSWERS_LOCK = { nominationsLocked: false, answersLocked: true };
const BOTH_LOCKS = { nominationsLocked: true, answersLocked: true };

const RETURN_BUTTON = { action: 'return' as const, label: 'common.return', href: HOME };
const CONTINUE_BUTTON = { action: 'continue' as const, label: 'common.continue', href: '/route/ContestantAppProfile' };
const DEFINE_BUTTON = { action: 'define' as const, label: DEFINE_LABEL, href: EDITOR_ENTRY };

const VIEW_CASES: Array<ViewCase> = [
  {
    title: 'nominations, editable, an admissible election: the editable sentence and the link to the editor',
    entity: CANDIDATE,
    nominations: [FIRST, SECOND],
    locks: NO_LOCK,
    facts: EDITABLE,
    taskState: STATE.profileNext,
    expected: {
      note: null,
      sentence: DESCRIPTION_EDITABLE.candidate,
      empty: null,
      support: 0,
      edit: true,
      button: CONTINUE_BUTTON,
      editable: true
    }
  },
  {
    title: 'the same for a party with nothing left to do',
    entity: PARTY,
    nominations: [FIRST],
    locks: NO_LOCK,
    facts: EDITABLE,
    taskState: STATE.allComplete,
    expected: {
      note: null,
      sentence: DESCRIPTION_EDITABLE.organization,
      empty: null,
      support: 0,
      edit: true,
      button: RETURN_BUTTON,
      editable: true
    }
  },
  {
    title: 'nominations under the nominations lock: the note and the earlier sentence',
    entity: CANDIDATE,
    nominations: [FIRST],
    locks: NOMINATIONS_LOCK,
    facts: NOT_EDITABLE,
    taskState: STATE.profileNext,
    expected: {
      note: 'nominationsLocked',
      sentence: DESCRIPTION.candidate,
      empty: null,
      support: 1,
      edit: false,
      button: CONTINUE_BUTTON,
      editable: false
    }
  },
  {
    title: "nominations under the answers lock alone: the note with that lock's reason",
    entity: CANDIDATE,
    nominations: [FIRST],
    locks: ANSWERS_LOCK,
    facts: NOT_EDITABLE,
    taskState: STATE.allComplete,
    expected: {
      note: 'nominationsAnswersLocked',
      sentence: DESCRIPTION.candidate,
      empty: null,
      support: 1,
      edit: false,
      button: RETURN_BUTTON,
      editable: false
    }
  },
  {
    title: 'nominations under both locks: one note, with the reason of the nominations lock',
    entity: PARTY,
    nominations: [FIRST],
    locks: BOTH_LOCKS,
    facts: NOT_EDITABLE,
    taskState: STATE.allComplete,
    expected: {
      note: 'nominationsLocked',
      sentence: DESCRIPTION.organization,
      empty: null,
      support: 1,
      edit: false,
      button: RETURN_BUTTON,
      editable: false
    }
  },
  {
    title:
      'no nomination, editable, an admissible election: the sentence that one can be defined and the way into the editor',
    entity: CANDIDATE,
    nominations: [],
    locks: NO_LOCK,
    facts: EDITABLE,
    taskState: STATE.noNominationEditable,
    expected: {
      note: null,
      sentence: EMPTY_EDITABLE_SENTENCE.candidate,
      empty: 'define',
      support: 0,
      edit: false,
      button: DEFINE_BUTTON,
      editable: true
    }
  },
  {
    title: 'the same for a party, in its own sentence',
    entity: PARTY,
    nominations: [],
    locks: NO_LOCK,
    facts: EDITABLE,
    taskState: STATE.noNominationEditable,
    expected: {
      note: null,
      sentence: EMPTY_EDITABLE_SENTENCE.organization,
      empty: 'define',
      support: 0,
      edit: false,
      button: DEFINE_BUTTON,
      editable: true
    }
  },
  {
    title: 'no nomination under the nominations lock: the note, the earlier sentence and a return',
    entity: CANDIDATE,
    nominations: [],
    locks: NOMINATIONS_LOCK,
    facts: NOT_EDITABLE,
    taskState: STATE.noNomination,
    expected: {
      note: 'nominationsLocked',
      sentence: EMPTY_SENTENCE.candidate,
      empty: 'locked',
      support: 1,
      edit: false,
      button: RETURN_BUTTON,
      editable: false
    }
  },
  {
    title:
      "no nomination under the answers lock alone: the note with that lock's reason, the earlier sentence and a return",
    entity: PARTY,
    nominations: [],
    locks: ANSWERS_LOCK,
    facts: NOT_EDITABLE,
    taskState: STATE.noNomination,
    expected: {
      note: 'nominationsAnswersLocked',
      sentence: EMPTY_SENTENCE.organization,
      empty: 'locked',
      support: 1,
      edit: false,
      button: RETURN_BUTTON,
      editable: false
    }
  },
  {
    title:
      'no nomination and no election that admits the entity: the sentence that says so, one support button and a return',
    entity: CANDIDATE,
    nominations: [],
    locks: NO_LOCK,
    facts: NO_ELECTION,
    taskState: STATE.noNominationEditable,
    expected: {
      note: null,
      sentence: EMPTY_NO_ELECTION_SENTENCE.candidate,
      empty: 'noElection',
      support: 1,
      edit: false,
      button: RETURN_BUTTON,
      editable: false
    }
  },
  {
    title: 'the same for a party, in its own sentence',
    entity: PARTY,
    nominations: [],
    locks: NO_LOCK,
    facts: NO_ELECTION,
    taskState: STATE.noNominationEditable,
    expected: {
      note: null,
      sentence: EMPTY_NO_ELECTION_SENTENCE.organization,
      empty: 'noElection',
      support: 1,
      edit: false,
      button: RETURN_BUTTON,
      editable: false
    }
  },
  {
    title:
      'nominations, editable, and no election that admits the entity: the earlier sentence and no link to the editor',
    entity: CANDIDATE,
    nominations: [FIRST],
    locks: NO_LOCK,
    facts: NO_ELECTION,
    taskState: STATE.profileNext,
    expected: {
      note: null,
      sentence: DESCRIPTION.candidate,
      empty: null,
      support: 0,
      edit: false,
      button: CONTINUE_BUTTON,
      editable: false
    }
  },
  {
    title: 'nominations and no facts in the data: no entry to the editor is offered',
    entity: CANDIDATE,
    nominations: [FIRST],
    locks: NO_LOCK,
    facts: null,
    taskState: STATE.allComplete,
    expected: {
      note: null,
      sentence: DESCRIPTION.candidate,
      empty: null,
      support: 0,
      edit: false,
      button: RETURN_BUTTON,
      editable: false
    }
  }
];

describe('the nominations page — its six states', () => {
  it.each(VIEW_CASES)('$title', ({ entity, nominations, locks, facts, taskState, expected }) => {
    const target = render({ selectedEntity: entity, nominations, ...locks, taskState }, facts);
    const view = one(target, VIEW);

    // The container's state attributes.
    expect(view.getAttribute('data-nominations-state')).toBe(nominations.length ? 'listed' : 'empty');
    expect(view.getAttribute('data-nominations-locked')).toBe(String(expected.note !== null));
    expect(view.getAttribute('data-nominations-editable')).toBe(String(expected.editable));

    // The note: one, with its reason and its one support button, above the title; or none.
    if (expected.note === null) {
      expect(count(view, LOCKED_NOTE)).toBe(0);
      expect(count(view, '[data-reason]')).toBe(0);
    } else {
      const note = one(view, LOCKED_NOTE);
      expect(note.getAttribute('data-reason')).toBe(expected.note);
      expect(textOf(note)).toContain(expected.note === 'nominationsLocked' ? LOCKED_SENTENCE : ANSWERS_LOCKED_SENTENCE);
      expect(note.compareDocumentPosition(one(view, 'h1')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(count(note, SUPPORT_BUTTON)).toBe(1);
      expect(count(view, '[data-reason]')).toBe(1);
    }

    // The sentence, and for an empty view what it says of itself.
    const sentences = [
      ...Object.values(DESCRIPTION),
      ...Object.values(DESCRIPTION_EDITABLE),
      ...Object.values(EMPTY_SENTENCE),
      ...Object.values(EMPTY_EDITABLE_SENTENCE),
      ...Object.values(EMPTY_NO_ELECTION_SENTENCE)
    ];
    expect(sentences.filter((sentence) => textOf(view).includes(sentence))).toEqual([expected.sentence]);
    if (expected.empty === null) {
      expect(count(view, EMPTY)).toBe(0);
      expect(cardsOf(view)).toHaveLength(nominations.length);
    } else {
      const sentence = one(view, EMPTY);
      expect(textOf(sentence)).toBe(expected.sentence);
      expect(sentence.getAttribute('data-empty')).toBe(expected.empty);
      expect(count(view, LIST)).toBe(0);
      expect(count(view, CARD)).toBe(0);
    }

    // Never two support buttons; outside a note, one in the body exactly where no election admits the entity.
    expect(count(view, SUPPORT_BUTTON)).toBe(expected.support);
    if (expected.empty === 'noElection') {
      const support = one(view, SUPPORT_BUTTON);
      expect(one(view, EMPTY).compareDocumentPosition(support) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }

    // The main button.
    const button = one(view, BUTTON);
    expect(button.getAttribute('data-action')).toBe(expected.button.action);
    expect(button.getAttribute('href')).toBe(expected.button.href);
    expect(textOf(button)).toBe(expected.button.label);

    // The link to the editor: one anchor after the main button, or nothing at all.
    if (expected.edit) {
      const edit = one(view, EDIT);
      expect(edit.tagName).toBe('A');
      expect(edit.getAttribute('href')).toBe(EDITOR_ENTRY);
      expect(textOf(edit)).toBe(EDIT_LABEL);
      expect(edit.getAttribute('aria-disabled')).toBeNull();
      expect(button.compareDocumentPosition(edit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    } else {
      expect(count(view, EDIT)).toBe(0);
      expect(textOf(view)).not.toContain(EDIT_LABEL);
    }

    // No control but the main button, the link to the editor and the support button; none of them on a card.
    expect(count(view, 'input, select, textarea, [contenteditable]')).toBe(0);
    const controls = [...view.querySelectorAll('a, button, [role="button"], [role="link"]')];
    expect(controls.every((control) => control.matches(`${BUTTON}, ${EDIT}, ${SUPPORT_BUTTON}`))).toBe(true);
    for (const card of view.querySelectorAll(CARD))
      expect(count(card, 'a, button, input, select, textarea, [role="button"], [role="link"]')).toBe(0);
    expect(count(view, '[style*="view-transition-name"]')).toBe(0);
    expect(count(view, 'dialog')).toBe(0);
  });

  it('does not shade the page while it lists no card', () => {
    render({ selectedEntity: CANDIDATE, nominations: [], taskState: STATE.noNominationEditable });

    expect(push).not.toHaveBeenCalled();
  });

  it('says nothing in place of the nominations, and offers no entry, where the list is empty and the data holds no facts', () => {
    const target = render({ selectedEntity: CANDIDATE, nominations: [], taskState: STATE.noNominationEditable }, null);

    const view = one(target, VIEW);
    expect(view.getAttribute('data-nominations-state')).toBe('empty');
    expect(view.getAttribute('data-nominations-editable')).toBe('false');
    expect(count(view, EMPTY)).toBe(0);
    expect(count(view, SUPPORT_BUTTON)).toBe(0);
    expect(count(view, EDIT)).toBe(0);
    const button = one(view, BUTTON);
    expect(button.getAttribute('data-action')).toBe('return');
    expect(button.getAttribute('href')).toBe(HOME);
  });

  it('shows neither the empty sentence nor a card for a list that is not known', () => {
    const target = render({ selectedEntity: undefined, nominations: undefined }, null);

    const view = one(target, VIEW);
    expect(view.hasAttribute('data-nominations-state')).toBe(false);
    expect(view.getAttribute('data-nominations-editable')).toBe('false');
    expect(count(view, EMPTY)).toBe(0);
    expect(count(view, LIST)).toBe(0);
    expect(count(view, CARD)).toBe(0);
    expect(count(view, EDIT)).toBe(0);
    expect(count(view, SUPPORT_BUTTON)).toBe(0);
    expect(push).not.toHaveBeenCalled();
  });
});

describe('the nominations page — a state that changes under the mounted page', () => {
  it('follows a lock that comes on: the note appears, and the link to the editor and the editable sentence go', () => {
    const target = render({ selectedEntity: CANDIDATE, nominations: [FIRST], taskState: STATE.allComplete });
    expect(count(target, EDIT)).toBe(1);
    expect(count(target, LOCKED_NOTE)).toBe(0);

    update({ nominationsLocked: true }, NOT_EDITABLE);

    const view = one(target, VIEW);
    expect(view.getAttribute('data-nominations-locked')).toBe('true');
    expect(view.getAttribute('data-nominations-editable')).toBe('false');
    expect(one(view, LOCKED_NOTE).getAttribute('data-reason')).toBe('nominationsLocked');
    expect(count(view, EDIT)).toBe(0);
    expect(textOf(view)).toContain(DESCRIPTION.candidate);
    expect(textOf(view)).not.toContain(DESCRIPTION_EDITABLE.candidate);
    expect(count(view, SUPPORT_BUTTON)).toBe(1);
  });

  it('follows a first nomination that was saved: the way into the editor becomes the list with its link, and the button leads on', () => {
    const target = render({ selectedEntity: CANDIDATE, nominations: [], taskState: STATE.noNominationEditable });
    expect(one(target, BUTTON).getAttribute('data-action')).toBe('define');

    update({ nominations: [nomination({ confirmed: false })], taskState: STATE.profileNext });

    const view = one(target, VIEW);
    expect(view.getAttribute('data-nominations-state')).toBe('listed');
    expect(count(view, EMPTY)).toBe(0);
    expect(cardsOf(view)).toHaveLength(1);
    expect(count(view, EDIT)).toBe(1);
    const button = one(view, BUTTON);
    expect(button.getAttribute('data-action')).toBe('continue');
    expect(button.getAttribute('href')).toBe('/route/ContestantAppProfile');
  });

  it('follows the facts when an election that admitted the entity no longer does', () => {
    const target = render({ selectedEntity: PARTY, nominations: [], taskState: STATE.noNominationEditable });
    expect(one(target, EMPTY).getAttribute('data-empty')).toBe('define');

    update({}, NO_ELECTION);

    expect(one(target, EMPTY).getAttribute('data-empty')).toBe('noElection');
    expect(textOf(one(target, EMPTY))).toBe(EMPTY_NO_ELECTION_SENTENCE.organization);
    expect(one(target, BUTTON).getAttribute('data-action')).toBe('return');
    expect(count(target, SUPPORT_BUTTON)).toBe(1);
  });
});

describe('the nominations page — its button', () => {
  it('continues to the questions list when the questions are the next step', () => {
    const target = render({ selectedEntity: CANDIDATE, nominations: [FIRST], taskState: STATE.questionsNext });

    const button = one(target, BUTTON);
    expect(button.getAttribute('data-action')).toBe('continue');
    expect(button.getAttribute('href')).toBe('/route/ContestantAppQuestions');
    expect(textOf(button)).toBe('common.continue');
  });

  it("returns to the entity's home for an entity with no nomination whose first task leads to this view", () => {
    const target = render({ selectedEntity: CANDIDATE, nominations: [], taskState: STATE.noNomination });

    const button = one(target, BUTTON);
    expect(button.getAttribute('data-action')).toBe('return');
    expect(button.getAttribute('href')).toBe(HOME);
    expect(textOf(button)).toBe('common.return');
  });

  it('is in its loading form while the tasks of an entity with a nomination are not known, and leads on once they are', () => {
    const target = render({ selectedEntity: CANDIDATE, nominations: [FIRST], taskState: STATE.notKnown });

    const loading = one(target, BUTTON);
    expect(loading.hasAttribute('data-action')).toBe(false);
    expect(loading.hasAttribute('href')).toBe(false);
    expect(loading.getAttribute('aria-disabled') === 'true' || loading.hasAttribute('disabled')).toBe(true);
    expect(textOf(loading)).toContain('common.loading');

    update({ taskState: STATE.profileNext });

    const button = one(target, BUTTON);
    expect(button.getAttribute('data-action')).toBe('continue');
    expect(button.getAttribute('href')).toBe('/route/ContestantAppProfile');
  });
});
