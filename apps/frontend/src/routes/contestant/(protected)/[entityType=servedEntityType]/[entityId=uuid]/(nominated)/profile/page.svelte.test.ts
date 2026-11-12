/**
 * The profile page of an entity of the Contestant App, mounted for real against a fake contestant context, with the real `MainContent`, `Input`, `InputGroup`, `QuestionInput` and `Button` below it.
 *
 * What this file holds:
 *
 * 1. **The identity section by entity type and name state.** Which name fields a profile has, whether they are locked, which sentence explains it and what a field is required for, for a candidate and for an organization in each of the three name states, and for a page whose selected entity is not known.
 * 2. **What is in the markup before the entity's data is in the store.** The fake store starts empty unless a case fills it, as the real one is on the server and on first paint.
 * 3. **The image and the colour.** The image's label per type, and the one colour field of an organization.
 * 4. **What an edit hands the store.** A name as a plain value by locale, a colour as an object holding `normal` alone, or `null`.
 * 5. **Nothing of the entity's nominations.** The page has no section, heading or field for them whatever the store holds, and looks nothing up on the data root.
 * 6. **The three outcomes of a save.** A stored save navigates, after the list of the user's entities is read again when it shows a stored property. A refused name and a failed save stay on the page, each with its own sentence in the one message region, and with focus on the Save button. The store's `save` and the navigation module's `goto` and `invalidateAll` are spies.
 * 7. **The Save button's label and where a stored save leads.** The label follows the saved data with the draft, and the target follows the entity's task state as the save leaves it. The fake context's task state is the real `taskStateOf` over the box's saved facts, and a fake save rewrites the box before it resolves, so a case can tell a target read after the save from one computed before it.
 *
 * The fake context's members are reactive behind getters over one raw state box, as the real accessors are. The box is raw so that the user data a case puts in it reaches an `Input` as the plain object the real store hands out. Messages are their keys.
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hasNomination, taskStateOf } from '$lib/contestant/tasks/taskState';
import type { ContestantUserData, EntityNomination, UserEntity } from '$lib/api/base/dataWriter.type';

/** A question as the page and `QuestionInput` read one. */
type FakeQuestion = {
  id: string;
  name: string;
  info: string;
  type: 'text';
  required: boolean;
  customData: { locked?: boolean };
};

/** Everything the page reads from the contestant context. */
type Box = {
  selectedEntity: UserEntity | undefined;
  answersLocked: boolean;
  current: ContestantUserData<true> | undefined;
  hasUnsaved: boolean;
  infoQuestions: Array<FakeQuestion>;
  unansweredRequiredInfoQuestions: Array<FakeQuestion>;
  opinionQuestions: Array<FakeQuestion>;
  unansweredOpinionQuestions: Array<FakeQuestion>;
  questionsReady: boolean;
  profileComplete: boolean;
  /** The nominations the page data holds for the entity, or nothing when it holds no entity. */
  nominations: Array<EntityNomination> | undefined;
};

/** A route as the page hands one to the route builder: its name, or an object that holds it. */
type RouteArgument = string | { route: string };

const EMPTY_BOX: Box = {
  selectedEntity: undefined,
  answersLocked: false,
  current: undefined,
  hasUnsaved: false,
  infoQuestions: [],
  unansweredRequiredInfoQuestions: [],
  opinionQuestions: [],
  unansweredOpinionQuestions: [],
  questionsReady: false,
  profileComplete: false,
  nominations: undefined
};

let box = $state.raw<Box>(EMPTY_BOX);

const {
  setProperty,
  setImage,
  resetImage,
  setAnswer,
  save,
  resetUnsaved,
  goto,
  invalidateAll,
  getElection,
  getConstituency
} = vi.hoisted(() => ({
  getElection: vi.fn(),
  getConstituency: vi.fn(),
  setProperty: vi.fn(),
  setImage: vi.fn(),
  resetImage: vi.fn(),
  setAnswer: vi.fn(),
  save: vi.fn(),
  resetUnsaved: vi.fn(),
  goto: vi.fn(),
  invalidateAll: vi.fn()
}));

const context = {
  t: (key: string) => key,
  getRoute: {
    current: (route: RouteArgument) => `/route/${typeof route === 'string' ? route : route.route}`
  },
  appSettings: { entities: { hideIfMissingAnswers: { candidate: false, organization: false } } },
  dataRoot: { getElection, getConstituency },
  userData: {
    get current() {
      return box.current;
    },
    get hasUnsaved() {
      return box.hasUnsaved;
    },
    setProperty,
    setImage,
    resetImage,
    setAnswer,
    save,
    resetUnsaved
  },
  get selectedEntity() {
    return box.selectedEntity;
  },
  get answersLocked() {
    return box.answersLocked;
  },
  get infoQuestions() {
    return box.infoQuestions;
  },
  get requiredInfoQuestions() {
    return box.infoQuestions.filter((question) => question.required);
  },
  get unansweredRequiredInfoQuestions() {
    return box.unansweredRequiredInfoQuestions;
  },
  get opinionQuestions() {
    return box.opinionQuestions;
  },
  get unansweredOpinionQuestions() {
    return box.unansweredOpinionQuestions;
  },
  get questionsReady() {
    return box.questionsReady;
  },
  get profileComplete() {
    return box.profileComplete;
  },
  get nominations() {
    return box.nominations;
  },
  /** The entity's task state over the box's saved facts. It is not known while the box holds no entity or no list of nominations. */
  get taskState() {
    return taskStateOf({
      entityKnown: !!box.selectedEntity && !!box.nominations,
      hasNomination: hasNomination(box.nominations),
      questionsReady: box.questionsReady,
      unansweredRequiredInfoCount: box.unansweredRequiredInfoQuestions.length,
      requiredNameMissing: false,
      opinionCount: box.opinionQuestions.length,
      unansweredOpinionCount: box.unansweredOpinionQuestions.length,
      firstUnansweredOpinionId: box.unansweredOpinionQuestions[0]?.id
    });
  }
};

vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({
    locale: 'en',
    locales: ['en', 'fi', 'sv'],
    t: (key: string) => key,
    translate: (value: unknown) => (typeof value === 'string' ? value : ''),
    darkMode: false
  })
}));
vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({
    video: { hasContent: false },
    setRouteTitle: () => undefined,
    pageStyles: { use: () => undefined }
  })
}));

// The other members stay the resolvable stubs: components the page reaches import them too.
vi.mock('$app/navigation', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  goto,
  invalidateAll
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

const IDENTITY = '[data-testid="contestant-profile-identity"]';
const LOCKED_NOTE = '[data-testid="contestant-answers-locked-warning"]';
const SUPPORT_BUTTON = '[data-testid="contestant-contact-support"]';
const NAME_NOTE = '[data-testid="contestant-profile-name-note"]';
const NAME_NOTE_ID = 'profile-name-note';
const FIRST_NAME = '[data-testid="profile-first-name"]';
const LAST_NAME = '[data-testid="profile-last-name"]';
const NAME = '[data-testid="profile-name"]';
const SHORT_NAME = '[data-testid="profile-short-name"]';
const COLOR = '[data-testid="profile-color"]';
const COLOR_HEX = '[data-testid="profile-color-hex"]';
const IMAGE = '[data-testid="profile-image-upload"]';
const SUBMIT = '[data-testid="profile-submit"]';
const RETURN = '[data-testid="profile-return"]';
const TOGGLE = '[data-testid="multilingual-toggle"]';
const SAVE_MESSAGE = '[data-testid="profile-save-message"]';

/** The key of the badge's screen-reader text. */
const REQUIRED = 'common.required';
const LOCKED_INFO_SENTENCE = 'dynamic.contestantAppBasicInfo.identity.lockedInfo';

/** The key of the sentence that says answers can no longer be edited. */
const LOCKED_SENTENCE = 'contestantApp.common.editingNotAllowed';

/** The key of the sentence that says the entity is hidden from voters. */
const HIDDEN_SENTENCE = 'contestantApp.common.isHiddenBecauseMissing';

const ENTITY_ID = '11111111-1111-4111-8111-111111111111';

const CANDIDATE: UserEntity = {
  type: 'candidate',
  id: ENTITY_ID,
  firstName: 'Ada',
  lastName: 'Alpha',
  confirmed: false
};
const PARTY: UserEntity = { type: 'organization', id: ENTITY_ID, name: 'Esimerkkipuolue', confirmed: false };

/** The user data of a candidate, as the store hands it out. */
function candidateData(names: { firstName: string; lastName: string } = CANDIDATE_NAMES): ContestantUserData<true> {
  return {
    entity: { type: 'candidate', id: ENTITY_ID, ...names, answers: {} },
    nominations: []
  } as unknown as ContestantUserData<true>;
}
const CANDIDATE_NAMES = { firstName: 'Ada', lastName: 'Alpha' };

/** The user data of an organization, as the store hands it out: its names by locale beside the entity. */
function partyData({
  name = { fi: 'Esimerkkipuolue' },
  shortName = null,
  color
}: {
  name?: Record<string, string> | null;
  shortName?: Record<string, string> | null;
  color?: { normal: string; dark?: string };
} = {}): ContestantUserData<true> {
  return {
    entity: { type: 'organization', id: ENTITY_ID, name: 'Esimerkkipuolue', answers: {}, ...(color && { color }) },
    localizedNames: { name, shortName },
    nominations: []
  } as unknown as ContestantUserData<true>;
}

/** A nomination of the entity, as the store hands one out. */
const NOMINATION: EntityNomination = {
  id: '22222222-2222-4222-8222-222222222222',
  electionId: '33333333-3333-4333-8333-333333333333',
  electionName: 'Vaalit',
  constituencyId: '44444444-4444-4444-8444-444444444444',
  constituencyName: 'Vaalipiiri',
  electionRound: 1,
  electionSymbol: '77',
  confirmed: true,
  customData: null
};

const NOMINATIONS_SECTION = '[data-testid="contestant-profile-nominations"]';
const NOMINATION_FIELDS = '[data-testid="nomination-constituency"], [data-testid="nomination-election-symbol"]';

/** An info question that its custom data locks. */
const LOCKED_QUESTION: FakeQuestion = {
  id: 'q-locked',
  name: 'Locked question',
  info: '',
  type: 'text',
  required: false,
  customData: { locked: true }
};

let teardown: Array<() => void> = [];

beforeEach(() => {
  vi.spyOn(log, 'error').mockImplementation(() => undefined);
  // A data root that holds no election and no constituency: a lookup throws.
  getElection.mockImplementation((id: string) => {
    throw new Error(`Child in collection elections with id ${id} not found`);
  });
  getConstituency.mockImplementation((id: string) => {
    throw new Error(`Child in collection constituencies with id ${id} not found`);
  });
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  box = EMPTY_BOX;
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

/** Mount the page for a state of the context. */
function render(state: Partial<Box>): HTMLElement {
  box = { ...EMPTY_BOX, ...state };
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(Page, { target });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

function identityOf(target: HTMLElement): HTMLElement {
  const section = target.querySelector<HTMLElement>(IDENTITY);
  expect(section, 'the identity section should be rendered').not.toBeNull();
  return section!;
}

function inputOf(target: HTMLElement, selector: string): HTMLInputElement {
  const input = target.querySelector<HTMLInputElement>(selector);
  expect(input, `${selector} should be rendered`).not.toBeNull();
  return input!;
}

/** Every text field of a multilingual field's container. */
function fieldsOf(target: HTMLElement, container: string): Array<HTMLInputElement> {
  const element = target.querySelector(container);
  expect(element, `${container} should be rendered`).not.toBeNull();
  return [...element!.querySelectorAll<HTMLInputElement>('input[type="text"]')];
}

/** The joined row a single-line input sits in, with its label and badges. */
function rowOf(input: HTMLElement): HTMLElement {
  const row = input.closest<HTMLElement>('.vaa-group-join-item');
  expect(row, 'the input should sit in a joined row').not.toBeNull();
  return row!;
}

function submitOf(target: HTMLElement): HTMLButtonElement {
  const submit = target.querySelector<HTMLButtonElement>(SUBMIT);
  expect(submit, 'the Save button should be rendered').not.toBeNull();
  return submit!;
}

function saveMessageOf(target: HTMLElement): HTMLElement {
  const region = target.querySelector<HTMLElement>(SAVE_MESSAGE);
  expect(region, 'the message region should be rendered').not.toBeNull();
  return region!;
}

/** Let the submit handler's awaited calls settle, then apply the state they wrote. */
async function settle(): Promise<void> {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
  flushSync();
}

/** Press Save and let the handler run as far as it can. */
async function pressSave(target: HTMLElement): Promise<void> {
  submitOf(target).click();
  await settle();
}

/** A promise a case settles by hand, for a call that is still in flight. */
function deferred(): { promise: Promise<void>; resolve: () => void; reject: (reason: unknown) => void } {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Commit a value to a field, as leaving the field does. */
function commit(field: HTMLInputElement, value: string): void {
  field.value = value;
  field.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

describe('profile page — a candidate', () => {
  it('renders both name inputs locked for a confirmed candidate before the store holds its data', () => {
    const target = render({ selectedEntity: { ...CANDIDATE, confirmed: true } });

    const identity = identityOf(target);
    expect(identity.dataset.entityType).toBe('candidate');
    expect(identity.dataset.nameState).toBe('locked-confirmed');

    const firstName = inputOf(identity, FIRST_NAME);
    const lastName = inputOf(identity, LAST_NAME);
    expect(firstName.disabled).toBe(true);
    expect(lastName.disabled).toBe(true);
    expect(firstName.value).toBe('Ada');
    expect(lastName.value).toBe('Alpha');
    expect(firstName.getAttribute('autocomplete')).toBe('given-name');
    expect(lastName.getAttribute('autocomplete')).toBe('family-name');
    expect(firstName.compareDocumentPosition(lastName) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(rowOf(firstName).textContent).not.toContain(REQUIRED);

    const note = identity.querySelector(NAME_NOTE);
    expect(note?.id).toBe(NAME_NOTE_ID);
    expect(note?.textContent).toBe('dynamic.contestantAppBasicInfo.identity.name.locked.candidate');
    expect(firstName.getAttribute('aria-describedby')).toContain(NAME_NOTE_ID);

    expect(target.querySelector(NAME)).toBeNull();
    expect(target.querySelector(COLOR)).toBeNull();
  });

  it('renders both name inputs enabled and required for an unconfirmed candidate', () => {
    const target = render({ selectedEntity: CANDIDATE, current: candidateData() });

    const identity = identityOf(target);
    expect(identity.dataset.entityType).toBe('candidate');
    expect(identity.dataset.nameState).toBe('editable');
    for (const selector of [FIRST_NAME, LAST_NAME]) {
      const input = inputOf(identity, selector);
      expect(input.disabled).toBe(false);
      expect(input.getAttribute('aria-required')).toBe('true');
      expect(rowOf(input).textContent).not.toContain(REQUIRED);
    }
    expect(inputOf(identity, FIRST_NAME).getAttribute('autocomplete')).toBe('given-name');
    expect(inputOf(identity, LAST_NAME).getAttribute('autocomplete')).toBe('family-name');
    expect(identity.querySelector(NAME_NOTE)?.textContent).toBe(
      'dynamic.contestantAppBasicInfo.identity.name.editable.candidate'
    );
  });

  it('shows the in-row required badge on a blank first name of an unconfirmed candidate', () => {
    const target = render({
      selectedEntity: CANDIDATE,
      current: candidateData({ firstName: '', lastName: 'Alpha' })
    });

    expect(rowOf(inputOf(target, FIRST_NAME)).textContent).toContain(REQUIRED);
    expect(rowOf(inputOf(target, LAST_NAME)).textContent).not.toContain(REQUIRED);
    expect(inputOf(target, SUBMIT).hasAttribute('disabled')).toBe(false);
  });

  it('labels the image as a candidate’s', () => {
    const target = render({ selectedEntity: CANDIDATE, current: candidateData() });

    expect(target.querySelector(`${IMAGE} label`)?.textContent).toBe('common.entityImage.candidate');
  });
});

describe('profile page — whether the entity’s data is loaded', () => {
  it.each([
    ['a candidate', CANDIDATE, candidateData],
    ['an organization', PARTY, partyData]
  ])('says on the identity section that the data of %s is loaded only once the store holds it', (_, entity, data) => {
    const target = render({ selectedEntity: entity });
    const identity = identityOf(target);
    expect(identity.dataset.entityLoaded).toBe('false');

    box = { ...box, current: data() };
    flushSync();
    expect(identityOf(target)).toBe(identity);
    expect(identity.dataset.entityLoaded).toBe('true');

    box = { ...box, current: undefined };
    flushSync();
    expect(identity.dataset.entityLoaded).toBe('false');
  });
});

describe('profile page — nothing of the entity’s nominations', () => {
  const CASES: Array<[string, UserEntity, ContestantUserData<true>, string]> = [
    [
      'a candidate with a nomination',
      CANDIDATE,
      { ...candidateData(), nominations: [NOMINATION] },
      'dynamic.contestantAppBasicInfo.identity.title.candidate'
    ],
    ['a candidate with none', CANDIDATE, candidateData(), 'dynamic.contestantAppBasicInfo.identity.title.candidate'],
    [
      'an organization with a nomination',
      PARTY,
      { ...partyData(), nominations: [NOMINATION] },
      'dynamic.contestantAppBasicInfo.identity.title.organization'
    ],
    ['an organization with none', PARTY, partyData(), 'dynamic.contestantAppBasicInfo.identity.title.organization']
  ];

  it.each(CASES)(
    'renders no nominations section, heading or field for %s',
    (_, selectedEntity, current, identityTitle) => {
      const target = render({ selectedEntity, current });

      expect(target.querySelector(NOMINATIONS_SECTION)).toBeNull();
      expect(target.querySelectorAll(NOMINATION_FIELDS)).toHaveLength(0);
      expect([...target.querySelectorAll('h2')].map((heading) => heading.textContent)).toEqual([
        identityTitle,
        'contestantApp.basicInfo.editableInfos.title'
      ]);
    }
  );

  it.each(CASES.filter(([, , current]) => current.nominations.length > 0))(
    'looks nothing up on a data root that holds no election, and logs nothing, for %s',
    (_, selectedEntity, current) => {
      render({ selectedEntity, current });

      expect(getElection).not.toHaveBeenCalled();
      expect(getConstituency).not.toHaveBeenCalled();
      expect(log.error).not.toHaveBeenCalled();
    }
  );
});

describe('profile page — an organization', () => {
  it('renders an editable name that requires the default locale, an optional short name and one colour field', () => {
    const target = render({ selectedEntity: PARTY, current: partyData() });

    const identity = identityOf(target);
    expect(identity.dataset.entityType).toBe('organization');
    expect(identity.dataset.nameState).toBe('editable');
    expect(identity.querySelector(NAME_NOTE)?.textContent).toBe(
      'dynamic.contestantAppBasicInfo.identity.name.editable.organization'
    );

    // The name: the required locale's field is shown with the translations hidden, and the value has no entry in it.
    const nameFields = fieldsOf(identity, NAME);
    expect(nameFields.map((field) => field.lang)).toEqual(['en']);
    expect(nameFields[0].disabled).toBe(false);
    expect(nameFields[0].getAttribute('aria-required')).toBe('true');
    expect(nameFields[0].getAttribute('aria-describedby')).toContain(NAME_NOTE_ID);
    expect(identity.querySelector(NAME)?.textContent).toContain(REQUIRED);
    expect(identity.querySelector(NAME)?.textContent).toContain('components.input.requiredLocaleInfo');

    // The short name: never required, with its own help line.
    const shortNameFields = fieldsOf(identity, SHORT_NAME);
    expect(shortNameFields).toHaveLength(1);
    expect(shortNameFields[0].disabled).toBe(false);
    expect(shortNameFields[0].hasAttribute('aria-required')).toBe(false);
    expect(identity.querySelector(SHORT_NAME)?.textContent).not.toContain(REQUIRED);
    expect(identity.querySelector(SHORT_NAME)?.textContent).toContain('contestantApp.basicInfo.shortNameInfo');

    expect(identity.querySelector(FIRST_NAME)).toBeNull();
    expect(identity.querySelector(LAST_NAME)).toBeNull();
    expect(target.querySelectorAll(COLOR)).toHaveLength(1);
    expect(target.querySelector(`${IMAGE} label`)?.textContent).toBe('common.entityImage.organization');
    expect(target.querySelector(IMAGE)?.textContent).toContain('contestantApp.basicInfo.logoInfo');
  });

  it('shows no required badge once the default locale holds a name', () => {
    const target = render({
      selectedEntity: PARTY,
      current: partyData({ name: { en: 'Example Party', fi: 'Esimerkkipuolue' } })
    });

    expect(target.querySelector(NAME)?.textContent).not.toContain(REQUIRED);
    expect(fieldsOf(target, NAME)[0].value).toBe('Example Party');
  });

  it('renders both fields locked with no badge for a confirmed organization, and its colour editable', () => {
    const target = render({
      selectedEntity: { ...PARTY, confirmed: true },
      current: partyData({ shortName: { fi: 'EP' }, color: { normal: '#2546a8' } })
    });

    const identity = identityOf(target);
    expect(identity.dataset.nameState).toBe('locked-confirmed');
    expect(identity.querySelector(NAME_NOTE)?.textContent).toBe(
      'dynamic.contestantAppBasicInfo.identity.name.locked.organization'
    );
    for (const container of [NAME, SHORT_NAME]) {
      const fields = fieldsOf(identity, container);
      expect(fields.length).toBeGreaterThan(0);
      for (const field of fields) {
        expect(field.disabled).toBe(true);
        expect(field.hasAttribute('aria-required')).toBe(false);
        expect(field.getAttribute('aria-describedby')).toContain(NAME_NOTE_ID);
      }
      expect(identity.querySelector(container)?.textContent).not.toContain(REQUIRED);
      expect(identity.querySelector(container)?.textContent).toContain('common.locked');
    }
    expect(identity.querySelector(NAME)?.textContent).not.toContain('components.input.requiredLocaleInfo');
    expect(identity.querySelector(SHORT_NAME)?.textContent).not.toContain('contestantApp.basicInfo.shortNameInfo');

    const hex = inputOf(target, COLOR_HEX);
    expect(hex.disabled).toBe(false);
    expect(hex.value).toBe('#2546a8');
  });

  it('locks the names, the colour and the image without a name sentence while answers are locked', () => {
    const target = render({
      selectedEntity: PARTY,
      answersLocked: true,
      current: partyData({ color: { normal: '#2546a8' } })
    });

    const identity = identityOf(target);
    expect(identity.dataset.entityType).toBe('organization');
    expect(identity.dataset.nameState).toBe('locked-answers');
    expect(identity.querySelector(NAME_NOTE)).toBeNull();
    for (const container of [NAME, SHORT_NAME]) {
      for (const field of fieldsOf(identity, container)) {
        expect(field.disabled).toBe(true);
        expect(field.getAttribute('aria-describedby') ?? '').not.toContain(NAME_NOTE_ID);
      }
      expect(identity.querySelector(container)?.textContent).not.toContain(REQUIRED);
    }
    expect(target.querySelector(`[aria-describedby~="${NAME_NOTE_ID}"]`)).toBeNull();

    expect(inputOf(target, COLOR_HEX).disabled).toBe(true);
    expect(target.querySelector<HTMLButtonElement>(`${IMAGE} button`)?.disabled).toBe(true);
    expect(target.querySelector(SUBMIT)).toBeNull();
    expect(target.querySelector(RETURN)).not.toBeNull();
  });
});

describe('profile page — a selected entity that is not known', () => {
  it('renders a candidate’s fields, every one locked, with no name sentence', () => {
    const target = render({ selectedEntity: undefined });

    const identity = identityOf(target);
    expect(identity.dataset.nameState).toBe('locked-answers');
    expect(identity.hasAttribute('data-entity-type')).toBe(false);
    expect(inputOf(identity, FIRST_NAME).disabled).toBe(true);
    expect(inputOf(identity, LAST_NAME).disabled).toBe(true);
    expect(identity.querySelector(NAME_NOTE)).toBeNull();
    expect(target.querySelector(NAME)).toBeNull();
    expect(target.querySelector(COLOR)).toBeNull();
  });
});

describe('profile page — the locked info questions', () => {
  it('renders neither the locked-info sentence nor an empty group when no locked info question is listed', () => {
    const target = render({ selectedEntity: PARTY, current: partyData() });

    const identity = identityOf(target);
    expect(identity.textContent).not.toContain(LOCKED_INFO_SENTENCE);
    expect(identity.querySelector('fieldset')).toBeNull();
  });

  it('renders the sentence and the group when one is listed, with the placeholder of the entity’s type', () => {
    const target = render({ selectedEntity: PARTY, current: partyData(), infoQuestions: [LOCKED_QUESTION] });

    const identity = identityOf(target);
    expect(identity.textContent).toContain(LOCKED_INFO_SENTENCE);
    const group = identity.querySelector('fieldset');
    expect(group).not.toBeNull();
    const input = inputOf(group!, 'input');
    expect(input.disabled).toBe(true);
    expect(input.placeholder).toBe('dynamic.contestantAppBasicInfo.identity.emptyPlaceholder.organization');
  });

  it('keeps a candidate’s name rows and locked info questions in one group, the names first', () => {
    const target = render({
      selectedEntity: { ...CANDIDATE, confirmed: true },
      current: candidateData(),
      infoQuestions: [LOCKED_QUESTION]
    });

    const groups = identityOf(target).querySelectorAll('fieldset');
    expect(groups).toHaveLength(1);
    const inputs = [...groups[0].querySelectorAll('input')];
    expect(inputs.map((input) => input.dataset.testid)).toEqual(['profile-first-name', 'profile-last-name', undefined]);
    expect(inputs[2].placeholder).toBe('dynamic.contestantAppBasicInfo.identity.emptyPlaceholder.candidate');
  });
});

describe('profile page — what an edit hands the store', () => {
  it('stages an edited name as a plain value by locale', () => {
    const target = render({ selectedEntity: PARTY, current: partyData() });

    commit(fieldsOf(target, NAME)[0], 'Example Party');

    expect(setProperty).toHaveBeenCalledTimes(1);
    const [property, value] = setProperty.mock.calls[0];
    expect(property).toBe('name');
    expect(() => structuredClone(value)).not.toThrow();
    expect(value).toEqual({ fi: 'Esimerkkipuolue', en: 'Example Party' });
  });

  it('stages an edited short name under its own property', () => {
    const target = render({ selectedEntity: PARTY, current: partyData() });

    commit(fieldsOf(target, SHORT_NAME)[0], 'EP');

    expect(setProperty).toHaveBeenCalledTimes(1);
    expect(setProperty.mock.calls[0][0]).toBe('shortName');
    expect(setProperty.mock.calls[0][1]).toEqual({ en: 'EP' });
  });

  it('stages nothing when the translations are expanded', () => {
    const target = render({ selectedEntity: PARTY, current: partyData() });

    target.querySelector<HTMLElement>(`${NAME} ${TOGGLE}`)!.click();
    flushSync();

    expect(fieldsOf(target, NAME).map((field) => field.lang)).toEqual(['en', 'fi', 'sv']);
    expect(setProperty).not.toHaveBeenCalled();
  });

  it('stages a candidate’s edited first name as a string', () => {
    const target = render({ selectedEntity: CANDIDATE, current: candidateData() });

    commit(inputOf(target, FIRST_NAME), 'Adah');

    expect(setProperty).toHaveBeenCalledTimes(1);
    expect(setProperty).toHaveBeenCalledWith('firstName', 'Adah');
  });

  it('stages a colour as an object holding the normal colour alone', () => {
    const target = render({ selectedEntity: PARTY, current: partyData() });

    commit(inputOf(target, COLOR_HEX), '#2546A8');

    expect(setProperty).toHaveBeenCalledTimes(1);
    expect(setProperty).toHaveBeenCalledWith('color', { normal: '#2546a8' });
    expect(Object.keys(setProperty.mock.calls[0][1])).toEqual(['normal']);
  });

  it('stages null when the colour is emptied', () => {
    const target = render({
      selectedEntity: PARTY,
      current: partyData({ color: { normal: '#2546a8', dark: '#8899ff' } })
    });

    commit(inputOf(target, COLOR_HEX), '');

    expect(setProperty).toHaveBeenCalledTimes(1);
    expect(setProperty).toHaveBeenCalledWith('color', null);
  });
});

describe('profile page — the instructions', () => {
  it('reads the standard instructions of the entity’s type while the question data is not loaded', () => {
    const target = render({ selectedEntity: PARTY, current: partyData(), questionsReady: false });

    expect(target.textContent).toContain('contestantApp.basicInfo.instructions.organization');
    expect(target.textContent).not.toContain('contestantApp.basicInfo.instructionsNoQuestions.organization');
  });

  it('reads the standard instructions when the entity has an opinion question to answer', () => {
    const target = render({
      selectedEntity: CANDIDATE,
      current: candidateData(),
      questionsReady: true,
      opinionQuestions: [{ ...LOCKED_QUESTION, id: 'q-opinion', customData: {} }]
    });

    expect(target.textContent).toContain('contestantApp.basicInfo.instructions.candidate');
    expect(target.textContent).not.toContain('contestantApp.basicInfo.instructionsNoQuestions.candidate');
  });

  it('reads the no-questions instructions of the entity’s type once the question data shows none', () => {
    const target = render({ selectedEntity: PARTY, current: partyData(), questionsReady: true, opinionQuestions: [] });

    expect(target.textContent).toContain('contestantApp.basicInfo.instructionsNoQuestions.organization');
  });
});

describe('profile page — the outcomes of a save', () => {
  /** What the database's refusal of a write reads like: it names the row. */
  const RAISED_TEXT = 'Entity name is immutable once confirmed: column public.organizations.name on row 11111111';

  beforeEach(() => {
    invalidateAll.mockResolvedValue(undefined);
    goto.mockResolvedValue(undefined);
  });

  it('holds an empty alert region before any save', () => {
    const target = render({ selectedEntity: PARTY, current: partyData() });

    const region = saveMessageOf(target);
    expect(region.getAttribute('role')).toBe('alert');
    expect(region.hasAttribute('data-outcome')).toBe(false);
    expect(region.textContent?.trim()).toBe('');
  });

  it('navigates without reading the list again when no listed property was stored', async () => {
    save.mockResolvedValue({ type: 'success', listedPropertySaved: false });
    const target = render({ selectedEntity: PARTY, current: partyData() });

    await pressSave(target);

    expect(save).toHaveBeenCalledTimes(1);
    expect(invalidateAll).not.toHaveBeenCalled();
    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith('/route/ContestantAppEntityHome');
    expect(saveMessageOf(target).hasAttribute('data-outcome')).toBe(false);
  });

  it('reads the list again before it navigates when a listed property was stored, and keeps saving until then', async () => {
    save.mockResolvedValue({ type: 'success', listedPropertySaved: true });
    const reread = deferred();
    invalidateAll.mockReturnValue(reread.promise);
    const target = render({ selectedEntity: PARTY, current: partyData() });

    await pressSave(target);

    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(goto).not.toHaveBeenCalled();
    expect(submitOf(target).disabled).toBe(true);
    expect(submitOf(target).textContent).toContain('common.saving');
    // The fields stay as they are while the save is in flight.
    expect(fieldsOf(target, NAME)[0].disabled).toBe(false);

    reread.resolve();
    await settle();

    expect(goto).toHaveBeenCalledTimes(1);
    expect(saveMessageOf(target).hasAttribute('data-outcome')).toBe(false);
  });

  it('navigates and reports no failure when the list cannot be read again after a stored save', async () => {
    save.mockResolvedValue({ type: 'success', listedPropertySaved: true });
    invalidateAll.mockRejectedValue(new Error('the load failed'));
    const target = render({ selectedEntity: PARTY, current: partyData() });

    await pressSave(target);

    expect(goto).toHaveBeenCalledTimes(1);
    expect(saveMessageOf(target).hasAttribute('data-outcome')).toBe(false);
    expect(saveMessageOf(target).textContent?.trim()).toBe('');
  });

  it('stays, says that the name was refused in the entity’s own sentence, and reads the list again', async () => {
    save.mockResolvedValue({ type: 'nameRefused', listedPropertySaved: true });
    const reread = deferred();
    // What the rerun loads bring: the entity is confirmed, and the store holds the stored names again.
    invalidateAll.mockImplementation(() => {
      box = { ...box, selectedEntity: { ...PARTY, confirmed: true }, current: partyData() };
      return reread.promise;
    });
    const target = render({ selectedEntity: PARTY, current: partyData({ name: { en: 'Edited', fi: 'Muokattu' } }) });

    await pressSave(target);

    expect(goto).not.toHaveBeenCalled();
    expect(invalidateAll).toHaveBeenCalledTimes(1);
    const region = saveMessageOf(target);
    expect(region.dataset.outcome).toBe('name-refused');
    expect(region.textContent).toContain('contestantApp.error.nameLocked.organization');

    reread.resolve();
    await settle();

    // The page is the one that was mounted: its message is still there, and its fields are locked with the stored names.
    expect(saveMessageOf(target)).toBe(region);
    expect(region.dataset.outcome).toBe('name-refused');
    expect(region.textContent).toContain('contestantApp.error.nameLocked.organization');
    expect(identityOf(target).dataset.nameState).toBe('locked-confirmed');
    for (const field of fieldsOf(target, NAME)) expect(field.disabled).toBe(true);
    expect(fieldsOf(target, NAME)[0].value).toBe('');
    expect(goto).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(submitOf(target));
  });

  it('says a candidate’s refused name in the candidate’s sentence', async () => {
    save.mockResolvedValue({ type: 'nameRefused', listedPropertySaved: false });
    const target = render({ selectedEntity: CANDIDATE, current: candidateData() });

    await pressSave(target);

    const region = saveMessageOf(target);
    expect(region.dataset.outcome).toBe('name-refused');
    expect(region.textContent).toContain('contestantApp.error.nameLocked.candidate');
    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(submitOf(target));
  });

  it('locks the name fields after a refused name even when the list cannot be read again', async () => {
    save.mockResolvedValue({ type: 'nameRefused', listedPropertySaved: false });
    invalidateAll.mockRejectedValue(new Error('the load failed'));
    const target = render({ selectedEntity: PARTY, current: partyData() });

    await pressSave(target);

    expect(saveMessageOf(target).dataset.outcome).toBe('name-refused');
    expect(identityOf(target).dataset.nameState).toBe('locked-confirmed');
    for (const container of [NAME, SHORT_NAME]) {
      for (const field of fieldsOf(target, container)) expect(field.disabled).toBe(true);
    }
    expect(target.textContent).not.toContain('contestantApp.error.saveFailed');
  });

  it('stays and says that the save failed when the store reports a failure', async () => {
    save.mockResolvedValue({ type: 'failure' });
    const target = render({ selectedEntity: PARTY, current: partyData() });

    await pressSave(target);

    expect(goto).not.toHaveBeenCalled();
    expect(invalidateAll).not.toHaveBeenCalled();
    const region = saveMessageOf(target);
    expect(region.dataset.outcome).toBe('failed');
    expect(region.textContent).toContain('contestantApp.error.saveFailed');
    expect(identityOf(target).dataset.nameState).toBe('editable');
    expect(document.activeElement).toBe(submitOf(target));
  });

  it('stays and says that the save failed when the save rejects, without the rejection’s text', async () => {
    save.mockRejectedValue(new Error(`updateEntityProperties: ${RAISED_TEXT}`));
    const target = render({ selectedEntity: PARTY, current: partyData() });

    await pressSave(target);

    expect(goto).not.toHaveBeenCalled();
    expect(invalidateAll).not.toHaveBeenCalled();
    const region = saveMessageOf(target);
    expect(region.dataset.outcome).toBe('failed');
    expect(region.textContent).toContain('contestantApp.error.saveFailed');
    expect(target.textContent).not.toContain('immutable');
    expect(target.textContent).not.toContain('updateEntityProperties');
    expect(document.activeElement).toBe(submitOf(target));
  });

  it('empties the region when a second save starts', async () => {
    save.mockResolvedValueOnce({ type: 'failure' });
    const target = render({ selectedEntity: PARTY, current: partyData() });
    await pressSave(target);
    expect(saveMessageOf(target).dataset.outcome).toBe('failed');

    const second = deferred();
    save.mockReturnValueOnce(second.promise.then(() => ({ type: 'success', listedPropertySaved: false })));
    await pressSave(target);

    expect(save).toHaveBeenCalledTimes(2);
    expect(saveMessageOf(target).hasAttribute('data-outcome')).toBe(false);
    expect(saveMessageOf(target).textContent?.trim()).toBe('');
    expect(submitOf(target).disabled).toBe(true);

    second.resolve();
    await settle();
    expect(goto).toHaveBeenCalledTimes(1);
  });
});

describe('profile page — the label of the Save button and where a stored save leads', () => {
  const SAVE_AND_CONTINUE = 'common.saveAndContinue';
  const CONTINUE = 'common.continue';
  const SAVE_AND_RETURN = 'common.saveAndReturn';
  const RETURN_LABEL = 'common.return';

  const QUESTIONS_ROUTE = '/route/ContestantAppQuestions';
  const HOME_ROUTE = '/route/ContestantAppEntityHome';

  /** A required info question the entity can edit. */
  const REQUIRED_QUESTION: FakeQuestion = {
    id: 'q-required',
    name: 'Required question',
    info: '',
    type: 'text',
    required: true,
    customData: {}
  };

  /** An opinion question, of which the page reads only that it is there. */
  const OPINION_QUESTION: FakeQuestion = {
    id: 'q-opinion',
    name: 'Opinion question',
    info: '',
    type: 'text',
    required: true,
    customData: {}
  };

  /** A candidate with a nomination and loaded question lists: one required info question and one opinion question, neither with a saved answer. */
  const NOTHING_SAVED: Partial<Box> = {
    selectedEntity: CANDIDATE,
    nominations: [NOMINATION],
    questionsReady: true,
    infoQuestions: [REQUIRED_QUESTION],
    unansweredRequiredInfoQuestions: [REQUIRED_QUESTION],
    opinionQuestions: [OPINION_QUESTION],
    unansweredOpinionQuestions: [OPINION_QUESTION]
  };

  /** The candidate's data as the store hands it out, holding `answers`: the saved ones with the draft. */
  function candidateDataWith(answers: Record<string, { value: unknown }>): ContestantUserData<true> {
    const data = candidateData();
    return { ...data, entity: { ...data.entity, answers } } as unknown as ContestantUserData<true>;
  }

  /** The store's data once the draft holds an answer to the required info question. */
  const DRAFT_FILLS_REQUIRED = candidateDataWith({ [REQUIRED_QUESTION.id]: { value: 'An answer' } });

  /** Make the store's save a stored one that leaves the box as `after` describes before it resolves. */
  function storeOnSave(after: Partial<Box> = {}): void {
    save.mockImplementation(async () => {
      box = { ...box, hasUnsaved: false, ...after };
      return { type: 'success', listedPropertySaved: false };
    });
  }

  beforeEach(() => {
    invalidateAll.mockResolvedValue(undefined);
    goto.mockResolvedValue(undefined);
  });

  it('reads "Save and Continue" as soon as the draft fills the last required field, before any save', () => {
    const target = render({ ...NOTHING_SAVED, current: DRAFT_FILLS_REQUIRED, hasUnsaved: true });

    expect(submitOf(target).textContent).toContain(SAVE_AND_CONTINUE);
    expect(save).not.toHaveBeenCalled();
  });

  it('leads to the questions list once the save has stored the draft that fills the last required field', async () => {
    storeOnSave({ unansweredRequiredInfoQuestions: [] });
    const target = render({ ...NOTHING_SAVED, current: DRAFT_FILLS_REQUIRED, hasUnsaved: true });

    await pressSave(target);

    expect(save).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(QUESTIONS_ROUTE);
  });

  it('reads "Save and Return" while the draft leaves a required field empty, and a stored save leads home', async () => {
    storeOnSave();
    const target = render({ ...NOTHING_SAVED, current: candidateDataWith({}), hasUnsaved: true });
    expect(submitOf(target).textContent).toContain(SAVE_AND_RETURN);

    await pressSave(target);

    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(HOME_ROUTE);
  });

  it('reads "Continue" with the required info saved, an opinion question unanswered and nothing unsaved', () => {
    const target = render({
      ...NOTHING_SAVED,
      unansweredRequiredInfoQuestions: [],
      current: DRAFT_FILLS_REQUIRED,
      hasUnsaved: false
    });

    expect(submitOf(target).textContent).toContain(CONTINUE);
    expect(submitOf(target).textContent).not.toContain(SAVE_AND_CONTINUE);
  });

  it('reads "Return" with everything answered and nothing unsaved, and leads home', async () => {
    storeOnSave();
    const target = render({
      ...NOTHING_SAVED,
      unansweredRequiredInfoQuestions: [],
      unansweredOpinionQuestions: [],
      current: DRAFT_FILLS_REQUIRED,
      hasUnsaved: false
    });
    expect(submitOf(target).textContent).toContain(RETURN_LABEL);
    expect(submitOf(target).textContent).not.toContain(SAVE_AND_RETURN);

    await pressSave(target);

    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(HOME_ROUTE);
  });

  it('takes the target from the task state as the save leaves it: the questions list, although the draft the label was read from left a required field empty', async () => {
    storeOnSave({ unansweredRequiredInfoQuestions: [] });
    const target = render({ ...NOTHING_SAVED, current: candidateDataWith({}), hasUnsaved: true });
    expect(submitOf(target).textContent).toContain(SAVE_AND_RETURN);

    await pressSave(target);

    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(QUESTIONS_ROUTE);
  });

  it('takes the target from the task state as the save leaves it: home, while the saved profile is still incomplete', async () => {
    storeOnSave();
    const target = render({ ...NOTHING_SAVED, current: DRAFT_FILLS_REQUIRED, hasUnsaved: true });
    expect(submitOf(target).textContent).toContain(SAVE_AND_CONTINUE);

    await pressSave(target);

    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(HOME_ROUTE);
  });

  it('keeps its label and chooses no target when the store reports a failure', async () => {
    save.mockResolvedValue({ type: 'failure' });
    const target = render({ ...NOTHING_SAVED, current: DRAFT_FILLS_REQUIRED, hasUnsaved: true });

    await pressSave(target);

    expect(goto).not.toHaveBeenCalled();
    expect(saveMessageOf(target).dataset.outcome).toBe('failed');
    expect(submitOf(target).textContent).toContain(SAVE_AND_CONTINUE);
  });

  it('keeps its label and chooses no target when the save rejects', async () => {
    save.mockRejectedValue(new Error('the write was refused'));
    const target = render({ ...NOTHING_SAVED, current: DRAFT_FILLS_REQUIRED, hasUnsaved: true });

    await pressSave(target);

    expect(goto).not.toHaveBeenCalled();
    expect(saveMessageOf(target).dataset.outcome).toBe('failed');
    expect(submitOf(target).textContent).toContain(SAVE_AND_CONTINUE);
  });
});

describe('profile page — the note while answers are locked', () => {
  /** A required info question the entity has not answered. */
  const UNANSWERED_REQUIRED: FakeQuestion = {
    id: 'q-required',
    name: 'Required question',
    info: '',
    type: 'text',
    required: true,
    customData: {}
  };

  it('names the answers-locked reason, holds its sentence and offers one support button', () => {
    const target = render({ selectedEntity: PARTY, answersLocked: true, current: partyData() });

    const notes = target.querySelectorAll<HTMLElement>(LOCKED_NOTE);
    expect(notes).toHaveLength(1);
    expect(notes[0].getAttribute('data-reason')).toBe('answersLocked');
    expect(notes[0].textContent).toContain(LOCKED_SENTENCE);
    expect(notes[0].textContent).not.toContain(HIDDEN_SENTENCE);
    expect(notes[0].querySelectorAll(SUPPORT_BUTTON)).toHaveLength(1);
    expect(target.querySelectorAll(SUPPORT_BUTTON)).toHaveLength(1);
  });

  it('puts the hidden sentence after the sentence of the reason and before the support button', () => {
    const target = render({
      selectedEntity: PARTY,
      answersLocked: true,
      current: partyData(),
      infoQuestions: [UNANSWERED_REQUIRED],
      unansweredRequiredInfoQuestions: [UNANSWERED_REQUIRED]
    });

    const note = target.querySelector<HTMLElement>(LOCKED_NOTE);
    expect(note, 'the note should be rendered').not.toBeNull();
    const text = note!.textContent ?? '';
    expect(text.indexOf(LOCKED_SENTENCE)).toBeGreaterThanOrEqual(0);
    expect(text.indexOf(LOCKED_SENTENCE)).toBeLessThan(text.indexOf(HIDDEN_SENTENCE));
    expect(text.indexOf(HIDDEN_SENTENCE)).toBeLessThan(text.indexOf('contestantApp.common.contactSupport'));
    expect(target.querySelectorAll(SUPPORT_BUTTON)).toHaveLength(1);
  });

  it('is absent, with no support button, while answers are not locked', () => {
    const target = render({ selectedEntity: PARTY, current: partyData() });

    expect(target.querySelector(LOCKED_NOTE)).toBeNull();
    expect(target.querySelector(SUPPORT_BUTTON)).toBeNull();
  });

  it('is not rendered for a name that is locked while answers are not, and the identity section holds no support button', () => {
    const target = render({ selectedEntity: { ...PARTY, confirmed: true }, current: partyData() });

    const identity = identityOf(target);
    expect(identity.dataset.nameState).toBe('locked-confirmed');
    expect(identity.querySelector(NAME_NOTE)).not.toBeNull();
    expect(target.querySelector(LOCKED_NOTE)).toBeNull();
    expect(target.querySelector(SUPPORT_BUTTON)).toBeNull();
  });

  it('stays outside the identity section while answers are locked, with one support button on the page', () => {
    const target = render({
      selectedEntity: { ...PARTY, confirmed: true },
      answersLocked: true,
      current: partyData()
    });

    const identity = identityOf(target);
    expect(identity.querySelector(LOCKED_NOTE)).toBeNull();
    expect(identity.querySelector(SUPPORT_BUTTON)).toBeNull();
    expect(target.querySelectorAll(LOCKED_NOTE)).toHaveLength(1);
    expect(target.querySelectorAll(SUPPORT_BUTTON)).toHaveLength(1);
  });
});
