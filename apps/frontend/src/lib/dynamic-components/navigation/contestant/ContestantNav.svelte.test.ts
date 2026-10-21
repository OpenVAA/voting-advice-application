/**
 * The Contestant App's navigation menu, mounted for real against a fake context.
 *
 * What this file holds:
 *
 * 1. **Signed in on a page whose URL names no entity**, the menu renders the home item, Help and Privacy, and no nominations, profile, questions, preview or settings item. Rendering does not throw: no link into the entity pages is built where the URL has no entity to build it from.
 * 2. **Signed in on a page whose URL names an entity the user edits**, the six items are present in their order — home, nominations, profile, questions, preview, settings — each linking below that entity.
 * 3. **The items the entity's task state closes** are disabled, not removed: a closed item has no link target and is announced as an unavailable link, described by the one reason line that follows the preview item. The profile and the questions are closed while their tasks are blocked, and the preview while the state says it is not open.
 * 4. **The questions item** is left out only for a state that is known and lists no questions task, and its badge shows the count the task carries.
 * 5. **The group of those items is titled with the type and the name of the entity the URL names**, the name `userEntityDisplayName` gives, and carries no title on a page whose URL names none.
 * 6. **A user who edits several entities gets the switch item**, the last of that group and a link to the app root, on a page whose URL names an entity, and nowhere else. A user who edits one never gets it.
 * 7. **Signed out**, the menu holds none of the signed-in items.
 *
 * The fake context builds routes with the real `buildRoute` from the route params of the page the case names, as the context's `getRoute` does. A link into the entity pages built without the two entity params therefore throws here as it does in the app, and the first case of the last block shows that it does.
 *
 * The fake context's values are rune state behind getters, as the real accessors are, and its task state is built by the real `taskStateOf`. Its question lists hold values that contradict every task state a case sets: a menu that read them would leave the questions item out, or disable it.
 *
 * The assertions are on the DOM rather than on component state: what matters is what the user is shown.
 */

import { REGISTRATION_MODE } from '@openvaa/app-shared';
import { DataRoot } from '@openvaa/data';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { taskStateOf } from '$lib/contestant/tasks/taskState';
import { userEntityDisplayName } from '$lib/contestant/utils/userEntityDisplayName';
import { buildRoute, contestantHomeRoute } from '$lib/routes';
import type { UserEntity } from '$lib/api/base/dataWriter.type';
import type { TaskState, TaskStateInput } from '$lib/contestant/tasks/taskState';
import type { RouteOptions } from '$lib/routes';

const CANDIDATE_ID = '11111111-1111-4111-8111-111111111111';
const CANDIDATE: UserEntity = { type: 'candidate', id: CANDIDATE_ID, firstName: 'A', lastName: 'B', confirmed: true };
const ENTITY_HOME = `/contestant/candidate/${CANDIDATE_ID}`;
const ORGANIZATION_ID = '22222222-2222-4222-8222-222222222222';
const ORGANIZATION: UserEntity = {
  type: 'organization',
  id: ORGANIZATION_ID,
  name: 'The Example Party With a Long Name',
  confirmed: false
};
const ORGANIZATION_HOME = `/contestant/organization/${ORGANIZATION_ID}`;

const dataRoot = new DataRoot();

/** The facts of an entity that has a nomination, two opinion questions and nothing left to answer. */
const COMPLETE_FACTS: TaskStateInput = {
  entityKnown: true,
  hasNomination: true,
  questionsReady: true,
  unansweredRequiredInfoCount: 0,
  requiredNameMissing: false,
  opinionCount: 2,
  unansweredOpinionCount: 0,
  firstUnansweredOpinionId: undefined
};

/** Every task complete and the preview open. */
const COMPLETE = taskStateOf(COMPLETE_FACTS);
/** No nomination: the nomination to define, the profile and the questions blocked. */
const NO_NOMINATION = taskStateOf({ ...COMPLETE_FACTS, hasNomination: false, questionsReady: false });
/** A nomination, one required info question and both opinion questions unanswered. */
const NOTHING_ANSWERED = taskStateOf({
  ...COMPLETE_FACTS,
  unansweredRequiredInfoCount: 1,
  unansweredOpinionCount: 2,
  firstUnansweredOpinionId: 'q1'
});
/** A nomination, with the question lists not loaded: the state is not known. */
const NOT_LOADED = taskStateOf({ ...COMPLETE_FACTS, questionsReady: false });
/** Nothing is known of the entity: the state lists no task. */
const ENTITY_NOT_KNOWN = taskStateOf({ ...COMPLETE_FACTS, entityKnown: false });
/** An entity that is asked no opinion question, with one required info question unanswered. */
const NO_QUESTIONS_TASK_INFO_MISSING = taskStateOf({
  ...COMPLETE_FACTS,
  opinionCount: 0,
  unansweredRequiredInfoCount: 1
});
/** An entity that is asked no opinion question, with nothing left to answer. */
const NO_QUESTIONS_TASK_COMPLETE = taskStateOf({ ...COMPLETE_FACTS, opinionCount: 0 });

/** What the fake context answers with. Each case sets it before it mounts the menu, and may change it under the mounted menu. */
const state = $state<{
  isAuthenticated: boolean;
  params: Record<string, string>;
  selectedEntity: UserEntity | undefined;
  entities: Array<UserEntity>;
  taskState: TaskState;
}>({
  isAuthenticated: false,
  params: {},
  selectedEntity: undefined,
  entities: [],
  taskState: COMPLETE
});

/** Build a route from the route params of the current page, as the context's `getRoute` does. */
function routeOnCurrentPage(options: RouteOptions): string {
  return buildRoute(options, { params: state.params });
}

/** The context's translation function. A case that needs the arguments of a message replaces it with a spy. */
const translate = vi.hoisted(() => ({ current: (key: string, _params?: Record<string, unknown>): string => key }));

vi.mock('$lib/contexts/contestant', () => ({
  getContestantContext: () => ({
    t: (key: string, params?: Record<string, unknown>) => translate.current(key, params),
    getRoute: { current: routeOnCurrentPage },
    openFeedbackModal: { current: undefined },
    // A project that serves candidates and lets them register with a code, so the signed-out menu holds its registration item.
    appSettings: {
      contestantApp: { entityTypes: ['candidate'], registrationModes: { candidate: [REGISTRATION_MODE.Code] } }
    },
    answersLocked: false,
    // The question lists say that the entity is asked no opinion question and lacks a required info answer, whatever the task state says.
    questionsReady: true,
    opinionQuestions: [],
    unansweredRequiredInfoQuestions: [{ id: 'info-1' }],
    unansweredOpinionQuestions: [],
    get isAuthenticated() {
      return state.isAuthenticated;
    },
    get selectedEntity() {
      return state.selectedEntity;
    },
    get entities() {
      return state.entities;
    },
    get taskState() {
      return state.taskState;
    },
    get previewOpen() {
      return state.taskState.previewOpen;
    },
    get dataRoot() {
      return dataRoot;
    },
    get homeRoute() {
      return routeOnCurrentPage(contestantHomeRoute(state.params));
    }
  })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({ navigation: { close: () => undefined } })
}));

// One locale, so the menu renders no language selection.
vi.mock('$lib/contexts/app', () => ({
  getAppContext: () => ({ t: (key: string) => key, locales: { current: ['en'] }, locale: 'en' })
}));

const ContestantNav = (await import('./ContestantNav.svelte')).default;

/** The test ids of the signed-in items, in the order the menu lists them. */
const HOME = 'contestant-nav-home';
const NOMINATIONS = 'contestant-nav-nominations';
const PROFILE = 'contestant-nav-profile';
const QUESTIONS = 'contestant-nav-questions';
const PREVIEW = 'contestant-nav-preview';
const SETTINGS = 'contestant-nav-settings';
const ENTITY_ITEMS = [NOMINATIONS, PROFILE, QUESTIONS, PREVIEW, SETTINGS];
const ENTITY_GROUP = '[data-testid="contestant-nav-entity-group"]';
const SWITCH = 'contestant-nav-switch-entity';
/** The reason line: its test id, which is also its id. */
const REASON = 'contestant-nav-closed-reason';
/** The class a closed item is dimmed with, and the colour class of an open item that it replaces. */
const DIMMED = '!text-neutral/20';
const UNDIMMED = '!text-neutral';

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  translate.current = (key) => key;
});

/**
 * Mount the menu on a page with the given route params.
 * @param isAuthenticated - Whether the user is signed in.
 * @param params - The route params of the page.
 * @param selectedEntity - The entity of the user's list the URL names, if any.
 * @param entities - The entities the user edits. Default: the selected entity alone, or none.
 * @param taskState - The state of the selected entity's tasks. Default: every task complete.
 * @returns The element the menu is mounted in.
 */
function render({
  isAuthenticated,
  params = {},
  selectedEntity,
  entities = selectedEntity ? [selectedEntity] : [],
  taskState = COMPLETE
}: {
  isAuthenticated: boolean;
  params?: Record<string, string>;
  selectedEntity?: UserEntity;
  entities?: Array<UserEntity>;
  taskState?: TaskState;
}): HTMLElement {
  Object.assign(state, { isAuthenticated, params, selectedEntity, entities, taskState });
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(ContestantNav, { target, props: {} });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/**
 * Mount the menu on the home of an entity the user edits.
 * @param taskState - The state of the entity's tasks.
 * @param entity - The entity. Default: the candidate.
 * @returns The element the menu is mounted in.
 */
function renderOnEntityHome(taskState: TaskState, entity: UserEntity = CANDIDATE): HTMLElement {
  return render({
    isAuthenticated: true,
    params: { entityType: entity.type, entityId: entity.id },
    selectedEntity: entity,
    taskState
  });
}

/** The test id and the link of every signed-in item the menu renders, in document order. */
function signedInItemsOf(target: HTMLElement): Array<[string | null, string | null]> {
  return [...target.querySelectorAll('a[data-testid^="contestant-nav-"]')].map((item) => [
    item.getAttribute('data-testid'),
    item.getAttribute('href')
  ]);
}

/** The link of every item the menu renders, in document order. */
function linksOf(target: HTMLElement): Array<string | null> {
  return [...target.querySelectorAll('a')].map((item) => item.getAttribute('href'));
}

/** The item with the given test id. */
function itemOf(target: HTMLElement, testId: string): HTMLElement {
  const item = target.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  expect(item, `the item ${testId} should be rendered`).not.toBeNull();
  return item!;
}

/** The reason line, or `null` when the menu renders none. */
function reasonLineOf(target: HTMLElement): HTMLElement | null {
  return target.querySelector<HTMLElement>(`[data-testid="${REASON}"]`);
}

/**
 * Assert that an item is closed: it is an unavailable link with no link target, dimmed.
 * @param described - Whether the item names the reason line as its description.
 */
function expectClosed(target: HTMLElement, testId: string, { described }: { described: boolean }): void {
  const item = itemOf(target, testId);
  expect(item.tagName, `${testId} is an anchor`).toBe('A');
  expect(item.getAttribute('aria-disabled'), `${testId} is announced as unavailable`).toBe('true');
  expect(item.getAttribute('role'), `${testId} has the link role`).toBe('link');
  expect(item.hasAttribute('href'), `${testId} has no link target`).toBe(false);
  expect(item.hasAttribute('tabindex'), `${testId} is no tab stop`).toBe(false);
  expect([...item.classList], `${testId} is dimmed`).toContain(DIMMED);
  expect([...item.classList], `${testId} keeps no undimmed colour`).not.toContain(UNDIMMED);
  expect(item.getAttribute('aria-describedby'), `the description of ${testId}`).toBe(described ? REASON : null);
}

/**
 * Assert that an item is open: a link with its target, passed no role, no description and no dimming.
 * @param href - The item's link target.
 */
function expectOpen(target: HTMLElement, testId: string, href: string): void {
  const item = itemOf(target, testId);
  expect(item.getAttribute('href'), `the link target of ${testId}`).toBe(href);
  expect(item.hasAttribute('aria-disabled'), `${testId} is not announced as unavailable`).toBe(false);
  expect(item.hasAttribute('role'), `${testId} is passed no role`).toBe(false);
  expect(item.hasAttribute('aria-describedby'), `${testId} has no description`).toBe(false);
  expect([...item.classList], `${testId} is not dimmed`).not.toContain(DIMMED);
  expect([...item.classList], `${testId} keeps its colour`).toContain(UNDIMMED);
}

/** The text of the badge of the questions item, or `null` when the item has none. */
function questionsBadgeOf(target: HTMLElement): HTMLElement | null {
  return itemOf(target, QUESTIONS).querySelector<HTMLElement>('.badge');
}

/**
 * Assert the reason line: its sentence, its reason, its id, and that it is a list item of its own directly after the preview item's.
 */
function expectReasonLine(target: HTMLElement, { reason, sentence }: { reason: string; sentence: string }): void {
  const line = reasonLineOf(target);
  expect(line, 'the reason line should be rendered').not.toBeNull();
  expect(line!.id).toBe(REASON);
  expect(line!.tagName).toBe('P');
  expect(line!.getAttribute('data-reason')).toBe(reason);
  expect(line!.textContent?.trim()).toBe(sentence);
  const row = line!.parentElement!;
  expect(row.getAttribute('role'), 'the line is a list item of its own').toBe('listitem');
  expect(row.children).toHaveLength(1);
  expect(row.parentElement?.getAttribute('role'), 'the line is in the list of the group').toBe('list');
  expect(
    row.previousElementSibling?.querySelector('[data-testid]')?.getAttribute('data-testid'),
    'the line directly follows the preview item'
  ).toBe(PREVIEW);
}

describe('ContestantNav — signed in on a page whose URL names no entity', () => {
  it.each([
    ['the app root', {}],
    ['a page outside the protected tree', {}],
    ['an entity-less path', { page: 'profile' }]
  ] as Array<[string, Record<string, string>]>)(
    'renders the home item and no entity item on %s, without throwing',
    (_, params) => {
      let target: HTMLElement | undefined;

      expect(() => {
        target = render({ isAuthenticated: true, params });
      }).not.toThrow();

      expect(signedInItemsOf(target!)).toEqual([[HOME, '/contestant']]);
      for (const testId of ENTITY_ITEMS) expect(target!.querySelector(`[data-testid="${testId}"]`)).toBeNull();
      expect(reasonLineOf(target!)).toBeNull();
      expect(linksOf(target!)).toEqual(['/contestant', '/contestant/help', '/contestant/privacy']);
    }
  );

  it('renders no entity item when the URL names an entity the list does not hold', () => {
    const target = render({
      isAuthenticated: true,
      params: { entityType: 'candidate', entityId: CANDIDATE_ID },
      selectedEntity: undefined,
      taskState: NO_NOMINATION
    });

    expect(signedInItemsOf(target)).toEqual([[HOME, ENTITY_HOME]]);
    expect(reasonLineOf(target)).toBeNull();
  });
});

describe('ContestantNav — signed in on a page whose URL names an entity the user edits', () => {
  it.each([
    ['the entity home', {}],
    ['a question page', { questionId: 'q-1' }]
  ] as Array<[string, Record<string, string>]>)('renders the six items in their order on %s', (_, pageParams) => {
    const target = render({
      isAuthenticated: true,
      params: { entityType: 'candidate', entityId: CANDIDATE_ID, ...pageParams },
      selectedEntity: CANDIDATE
    });

    expect(signedInItemsOf(target)).toEqual([
      [HOME, ENTITY_HOME],
      [NOMINATIONS, `${ENTITY_HOME}/nominations`],
      [PROFILE, `${ENTITY_HOME}/profile`],
      [QUESTIONS, `${ENTITY_HOME}/questions`],
      [PREVIEW, `${ENTITY_HOME}/preview`],
      [SETTINGS, `${ENTITY_HOME}/settings`]
    ]);
    expect(linksOf(target).slice(-2)).toEqual(['/contestant/help', '/contestant/privacy']);
  });

  it('names the nominations item with the title of the nominations view', () => {
    const target = renderOnEntityHome(COMPLETE);

    expect(itemOf(target, NOMINATIONS).textContent).toContain('contestantApp.nominations.title');
  });
});

describe('ContestantNav — an entity with no nomination', () => {
  it.each([
    ['a candidate', CANDIDATE, ENTITY_HOME, 'contestantApp.common.closedReason.noNomination.candidate'],
    ['an organization', ORGANIZATION, ORGANIZATION_HOME, 'contestantApp.common.closedReason.noNomination.organization']
  ] as const)(
    'closes the profile, the questions and the preview of %s and says why in one line after them',
    (_, entity, home, sentence) => {
      const target = renderOnEntityHome(NO_NOMINATION, entity);

      // The menu keeps its shape: every item is there, in its place.
      expect(signedInItemsOf(target).map(([testId]) => testId)).toEqual([HOME, ...ENTITY_ITEMS]);
      expectOpen(target, HOME, home);
      expectOpen(target, NOMINATIONS, `${home}/nominations`);
      expectClosed(target, PROFILE, { described: true });
      expectClosed(target, QUESTIONS, { described: true });
      expectClosed(target, PREVIEW, { described: true });
      expectOpen(target, SETTINGS, `${home}/settings`);
      expect(questionsBadgeOf(target), 'a closed questions item has no badge').toBeNull();
      expectReasonLine(target, { reason: 'noNomination', sentence });
      expect(target.querySelectorAll(`[data-testid="${REASON}"]`)).toHaveLength(1);
    }
  );
});

describe('ContestantNav — an entity that has a nomination', () => {
  it('opens the profile and the questions with required info missing, shows the count of unanswered questions and closes the preview', () => {
    const target = renderOnEntityHome(NOTHING_ANSWERED);

    expect(signedInItemsOf(target).map(([testId]) => testId)).toEqual([HOME, ...ENTITY_ITEMS]);
    expectOpen(target, PROFILE, `${ENTITY_HOME}/profile`);
    expectOpen(target, QUESTIONS, `${ENTITY_HOME}/questions`);
    const badge = questionsBadgeOf(target);
    expect(badge, 'the questions item has a badge').not.toBeNull();
    expect(badge!.textContent?.trim()).toBe('2');
    expect([...badge!.classList], 'the badge is in its warning form').toContain('badge-warning');
    expect([...badge!.classList], 'the badge is not greyed').not.toContain('opacity-20');
    expectClosed(target, PREVIEW, { described: true });
    expectReasonLine(target, { reason: 'previewNotReady', sentence: 'contestantApp.common.closedReason.preview' });
  });

  it('closes nothing and renders no reason line when everything is answered', () => {
    const target = renderOnEntityHome(COMPLETE);

    expectOpen(target, PROFILE, `${ENTITY_HOME}/profile`);
    expectOpen(target, QUESTIONS, `${ENTITY_HOME}/questions`);
    expectOpen(target, PREVIEW, `${ENTITY_HOME}/preview`);
    expect(questionsBadgeOf(target), 'nothing is left to count').toBeNull();
    expect(reasonLineOf(target)).toBeNull();
    expect(target.querySelector('[aria-disabled]')).toBeNull();
  });

  it.each([
    ['the question lists are not loaded', NOT_LOADED],
    ['nothing is known of the entity', ENTITY_NOT_KNOWN]
  ] as const)('opens the profile and the questions and closes the preview with no reason while %s', (_, taskState) => {
    const target = renderOnEntityHome(taskState);

    expect(signedInItemsOf(target).map(([testId]) => testId)).toEqual([HOME, ...ENTITY_ITEMS]);
    expectOpen(target, PROFILE, `${ENTITY_HOME}/profile`);
    expectOpen(target, QUESTIONS, `${ENTITY_HOME}/questions`);
    expect(questionsBadgeOf(target)).toBeNull();
    expectClosed(target, PREVIEW, { described: false });
    expect(reasonLineOf(target)).toBeNull();
  });

  it('follows a task state that changes under the mounted menu', () => {
    const target = renderOnEntityHome(NOT_LOADED);
    expectClosed(target, PREVIEW, { described: false });

    state.taskState = NOTHING_ANSWERED;
    flushSync();
    expectClosed(target, PREVIEW, { described: true });
    expect(questionsBadgeOf(target)?.textContent?.trim()).toBe('2');
    expectReasonLine(target, { reason: 'previewNotReady', sentence: 'contestantApp.common.closedReason.preview' });

    state.taskState = COMPLETE;
    flushSync();
    expectOpen(target, PREVIEW, `${ENTITY_HOME}/preview`);
    expect(questionsBadgeOf(target)).toBeNull();
    expect(reasonLineOf(target)).toBeNull();
  });
});

describe('ContestantNav — the questions item of an entity that is asked no opinion question', () => {
  it.each([
    ['a candidate', CANDIDATE, ENTITY_HOME],
    ['an organization', ORGANIZATION, ORGANIZATION_HOME]
  ] as const)(
    'is absent from the markup, and the other items keep their order, for %s with everything answered',
    (_, entity, home) => {
      const target = renderOnEntityHome(NO_QUESTIONS_TASK_COMPLETE, entity);

      expect(target.querySelector(`[data-testid="${QUESTIONS}"]`)).toBeNull();
      expect(linksOf(target)).not.toContain(`${home}/questions`);
      expect(signedInItemsOf(target)).toEqual([
        [HOME, home],
        [NOMINATIONS, `${home}/nominations`],
        [PROFILE, `${home}/profile`],
        [PREVIEW, `${home}/preview`],
        [SETTINGS, `${home}/settings`]
      ]);
      expect(reasonLineOf(target)).toBeNull();
    }
  );

  it('is absent while required info is missing, and the closed preview gives the reason that names no questions', () => {
    const target = renderOnEntityHome(NO_QUESTIONS_TASK_INFO_MISSING);

    expect(target.querySelector(`[data-testid="${QUESTIONS}"]`)).toBeNull();
    expectOpen(target, PROFILE, `${ENTITY_HOME}/profile`);
    expectClosed(target, PREVIEW, { described: true });
    expectReasonLine(target, {
      reason: 'previewNotReady',
      sentence: 'contestantApp.common.closedReason.previewNoQuestions'
    });
  });
});

describe('ContestantNav — the title of the entity group', () => {
  it('names the type and the entity for a user who edits one, and adds no item', () => {
    const target = render({
      isAuthenticated: true,
      params: { entityType: 'candidate', entityId: CANDIDATE_ID },
      selectedEntity: CANDIDATE
    });

    const group = target.querySelector<HTMLElement>(ENTITY_GROUP);
    expect(group, 'the entity group should be marked').not.toBeNull();
    const title = group!.querySelector('h4');
    expect(title?.textContent?.trim()).toBe('contestantApp.entitySelection.current');
    // The title labels the list of the group's items.
    expect(group!.querySelector('[role="list"]')?.getAttribute('aria-labelledby')).toBe(title!.id);
    expect(target.querySelector(`[data-testid="${SWITCH}"]`)).toBeNull();
    expect(signedInItemsOf(target).map(([testId]) => testId)).toEqual([HOME, ...ENTITY_ITEMS]);
    // Every signed-in item is inside the titled group.
    expect(group!.querySelectorAll('a')).toHaveLength(6);
  });

  it.each([
    ['a candidate', CANDIDATE, 'common.candidate.singular'],
    ['an organization', ORGANIZATION, 'common.organization.singular']
  ] as const)('is given the type name and the display name of %s', (_, entity, typeKey) => {
    const t = vi.fn((key: string) => key);
    translate.current = t;

    render({
      isAuthenticated: true,
      params: { entityType: entity.type, entityId: entity.id },
      selectedEntity: entity
    });

    const call = t.mock.calls.find(([key]) => key === 'contestantApp.entitySelection.current') as
      [string, Record<string, string>] | undefined;
    expect(call, 'the title message should be asked for').toBeDefined();
    expect(call![1]).toEqual({ entityType: typeKey, name: userEntityDisplayName(entity, dataRoot) });
    expect(call![1].name).toBe(entity.type === 'candidate' ? 'A B' : 'The Example Party With a Long Name');
  });

  it.each([
    ['the app root', {}, undefined],
    ['an entity the list does not hold', { entityType: 'candidate', entityId: CANDIDATE_ID }, undefined]
  ] as Array<[string, Record<string, string>, undefined]>)('is absent on %s', (_, params, selectedEntity) => {
    const target = render({ isAuthenticated: true, params, selectedEntity, entities: [CANDIDATE, ORGANIZATION] });

    expect(target.querySelector(ENTITY_GROUP)).toBeNull();
    expect(target.querySelector('h4')).toBeNull();
    expect(target.textContent).not.toContain('contestantApp.entitySelection.current');
  });
});

describe('ContestantNav — the switch item', () => {
  it('is the last item of the entity group and links to the app root for a user who edits several entities', () => {
    const target = render({
      isAuthenticated: true,
      params: { entityType: 'organization', entityId: ORGANIZATION_ID },
      selectedEntity: ORGANIZATION,
      entities: [CANDIDATE, ORGANIZATION]
    });

    expect(signedInItemsOf(target)).toEqual([
      [HOME, ORGANIZATION_HOME],
      [NOMINATIONS, `${ORGANIZATION_HOME}/nominations`],
      [PROFILE, `${ORGANIZATION_HOME}/profile`],
      [QUESTIONS, `${ORGANIZATION_HOME}/questions`],
      [PREVIEW, `${ORGANIZATION_HOME}/preview`],
      [SETTINGS, `${ORGANIZATION_HOME}/settings`],
      [SWITCH, '/contestant']
    ]);
    const groupItems = [...target.querySelectorAll(`${ENTITY_GROUP} a`)];
    expect(groupItems.at(-1)?.getAttribute('data-testid')).toBe(SWITCH);
    expect(groupItems.at(-1)?.textContent).toContain('contestantApp.entitySelection.switch');
    expect(linksOf(target).slice(-2)).toEqual(['/contestant/help', '/contestant/privacy']);
  });

  it('is the last item of the entity group, after the reason line, for an entity with no nomination', () => {
    const target = render({
      isAuthenticated: true,
      params: { entityType: 'organization', entityId: ORGANIZATION_ID },
      selectedEntity: ORGANIZATION,
      entities: [CANDIDATE, ORGANIZATION],
      taskState: NO_NOMINATION
    });

    const rows = [...target.querySelectorAll(`${ENTITY_GROUP} [role="listitem"]`)].map((row) =>
      row.querySelector('[data-testid]')?.getAttribute('data-testid')
    );
    expect(rows).toEqual([HOME, NOMINATIONS, PROFILE, QUESTIONS, PREVIEW, REASON, SETTINGS, SWITCH]);
    expectOpen(target, SWITCH, '/contestant');
  });

  it.each([
    ['the app root', {}],
    ['an entity-less path', { page: 'profile' }]
  ] as Array<[string, Record<string, string>]>)(
    'is absent, with the title, on %s although the user edits several entities',
    (_, params) => {
      const target = render({ isAuthenticated: true, params, entities: [CANDIDATE, ORGANIZATION] });

      expect(target.querySelector(`[data-testid="${SWITCH}"]`)).toBeNull();
      expect(target.querySelector(ENTITY_GROUP)).toBeNull();
      expect(signedInItemsOf(target)).toEqual([[HOME, '/contestant']]);
    }
  );

  it('is absent when the URL names an entity the list does not hold, although the list holds several', () => {
    const target = render({
      isAuthenticated: true,
      params: { entityType: 'candidate', entityId: '99999999-9999-4999-8999-999999999999' },
      selectedEntity: undefined,
      entities: [CANDIDATE, ORGANIZATION]
    });

    expect(target.querySelector(`[data-testid="${SWITCH}"]`)).toBeNull();
  });
});

describe('ContestantNav — signed out', () => {
  it('renders none of the signed-in items, and the login, registration, forgotten-password, Help and Privacy links', () => {
    const target = render({ isAuthenticated: false });

    expect(signedInItemsOf(target)).toEqual([]);
    expect(reasonLineOf(target)).toBeNull();
    expect(linksOf(target)).toEqual([
      '/contestant/login',
      '/contestant/register',
      '/contestant/forgot-password',
      '/contestant/help',
      '/contestant/privacy'
    ]);
  });
});

describe('ContestantNav — what the cases above rest on', () => {
  it('a link into the entity pages cannot be built on a page whose URL names no entity', () => {
    Object.assign(state, { isAuthenticated: true, params: {}, selectedEntity: undefined });

    for (const route of [
      'ContestantAppNominations',
      'ContestantAppProfile',
      'ContestantAppQuestions',
      'ContestantAppPreview',
      'ContestantAppSettings'
    ] as const)
      expect(() => routeOnCurrentPage(route)).toThrow(/Missing parameter 'entityType'/);
  });

  it('the states the cases set are the ones their names say', () => {
    expect(NO_NOMINATION.tasks.map(({ id, status }) => [id, status])).toEqual([
      ['nomination', 'incomplete'],
      ['profile', 'blocked'],
      ['questions', 'blocked']
    ]);
    expect(NOTHING_ANSWERED.known && !NOTHING_ANSWERED.previewOpen).toBe(true);
    expect(NOTHING_ANSWERED.tasks.find(({ id }) => id === 'questions')?.count).toBe(2);
    expect(COMPLETE.allComplete && COMPLETE.previewOpen).toBe(true);
    expect(NOT_LOADED.known).toBe(false);
    expect(ENTITY_NOT_KNOWN.tasks).toEqual([]);
    expect(NO_QUESTIONS_TASK_COMPLETE.tasks.map(({ id }) => id)).toEqual(['nomination', 'profile']);
    expect(NO_QUESTIONS_TASK_COMPLETE.previewOpen).toBe(true);
    expect(NO_QUESTIONS_TASK_INFO_MISSING.previewOpen).toBe(false);
  });
});
