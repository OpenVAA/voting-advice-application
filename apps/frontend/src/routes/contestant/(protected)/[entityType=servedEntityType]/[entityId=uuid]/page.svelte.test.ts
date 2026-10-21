/**
 * The home page of an entity of the Contestant App, mounted for real against a fake contestant context, with the real `MainContent`, `Button` and `LogoutButton` below it.
 *
 * The home is the entity's task list: an ordered list of the nomination, the profile and the questions, each row saying its status, with the preview entry under it, one sentence that says why a closed entry is closed, and one main action. What this file holds, by the state of the entity's tasks:
 *
 * 1. **No nomination.** The nomination to define, the other two rows blocked, the preview closed, and the reason. The nomination row and the main action lead where the task state says: to the nominations view, or to the editor's entry.
 * 2. **A nomination, before the question lists are known.** The nomination complete, the other two rows with no status, nothing said of what is left, and the places of the two sentences held.
 * 3. **A nomination and something incomplete.** The counts, the open questions, the closed preview with its own reason, and the main action to the first incomplete task.
 * 4. **Every task complete.** The ready title, the hero and the tip, the open preview, and the main action to the preview.
 * 5. **The locks.** The note while answers are locked, with the sentence that says the entity is hidden from voters, and nothing that differs while nominations are locked.
 * 6. **The greeting**, and a page that follows the task state when it changes.
 *
 * The fake context's members are reactive behind getters over one raw state box, as the real accessors are, and its store holds no entity: the page needs nothing from it. A message is its key, followed by its parameters where it has any. The task state is built by the application's own `taskStateOf`, so a case mounts the page against a state the context can hold.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import opinionDrawing from '$lib/components/icon/svg/custom/opinion';
import checkDrawing from '$lib/components/icon/svg/material/check';
import profileDrawing from '$lib/components/icon/svg/material/face';
import nominationDrawing from '$lib/components/icon/svg/material/how_to_vote';
import lockDrawing from '$lib/components/icon/svg/material/lock';
import { taskStateOf } from '$lib/contestant/tasks';
import type { UserEntity } from '$lib/api/base/dataWriter.type';
import type { TaskState, TaskStateInput } from '$lib/contestant/tasks';

/** Everything the page and the components below it read from the contestant context. */
type Box = {
  selectedEntity: UserEntity | undefined;
  answersLocked: boolean;
  nominationsLocked: boolean;
  /** The state of the entity's tasks, as the context derives it. */
  taskState: TaskState;
  unansweredOpinionQuestions: Array<{ id: string }>;
  unansweredRequiredInfoQuestions: Array<{ id: string }>;
  hideIfMissingAnswers: { candidate: boolean; organization: boolean };
};

/** What is known of an entity that has a nomination before its question lists are loaded, while nominations cannot be edited. */
const NOMINATED_FACTS: TaskStateInput = {
  entityKnown: true,
  hasNomination: true,
  nominationsEditable: false,
  questionsReady: false,
  unansweredRequiredInfoCount: 0,
  requiredNameMissing: false,
  opinionCount: 0,
  unansweredOpinionCount: 0,
  firstUnansweredOpinionId: undefined
};

/** An entity that has a nomination, whose question lists are loaded: two opinion questions, and nothing unanswered. */
const LOADED_FACTS: TaskStateInput = { ...NOMINATED_FACTS, questionsReady: true, opinionCount: 2 };

const EMPTY_BOX: Box = {
  selectedEntity: undefined,
  answersLocked: false,
  nominationsLocked: false,
  taskState: taskStateOf(NOMINATED_FACTS),
  unansweredOpinionQuestions: [],
  unansweredRequiredInfoQuestions: [],
  hideIfMissingAnswers: { candidate: false, organization: false }
};

let box = $state.raw<Box>(EMPTY_BOX);

/** A message as the fake translation function renders it: its key, and its parameters where it has any. */
function message(key: string, params?: Record<string, unknown>): string {
  if (!params) return key;
  const rendered = Object.entries(params)
    .map(([name, value]) => `${name}=${String(value)}`)
    .join(',');
  return `${key}(${rendered})`;
}

const context = {
  t: message,
  getRoute: {
    current: (route: string | { route: string }) => `/route/${typeof route === 'string' ? route : route.route}`
  },
  logout: async () => undefined,
  userData: { current: undefined, savedEntityData: undefined },
  // The question lists themselves are never loaded here. Every case's expectation follows from the task state, so a page that read a list in its place would find nothing in it.
  questionsReady: false,
  opinionQuestions: [],
  get appSettings() {
    return { entities: { hideIfMissingAnswers: box.hideIfMissingAnswers } };
  },
  get selectedEntity() {
    return box.selectedEntity;
  },
  get answersLocked() {
    return box.answersLocked;
  },
  get nominationsLocked() {
    return box.nominationsLocked;
  },
  get taskState() {
    return box.taskState;
  },
  get previewOpen() {
    return box.taskState.previewOpen;
  },
  get profileComplete() {
    return box.taskState.allComplete;
  },
  get unansweredOpinionQuestions() {
    return box.unansweredOpinionQuestions;
  },
  get unansweredRequiredInfoQuestions() {
    return box.unansweredRequiredInfoQuestions;
  }
};

vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));
vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({ video: { hasContent: false }, setRouteTitle: () => undefined })
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

const STATUS = '[data-testid="contestant-home-status"]';
const TIP = '[data-testid="contestant-home-tip"]';
const PROFILE_BUTTON = '[data-testid="contestant-home-profile"]';
const QUESTIONS_BUTTON = '[data-testid="contestant-home-questions"]';
const PREVIEW_BUTTON = '[data-testid="contestant-home-preview"]';
const LOCKED_WARNING = '[data-testid="contestant-answers-locked-warning"]';
const TASK_LIST = '[data-testid="contestant-home-tasks"]';
const TASK_ROW = '[data-testid="contestant-home-task"]';
const TASK_BADGE = '[data-testid="contestant-home-task-badge"]';
const NOMINATION_BUTTON = '[data-testid="contestant-home-nomination"]';
const CLOSED_REASON = '[data-testid="contestant-home-closed-reason"]';
const MAIN_ACTION = '[data-testid="contestant-home-continue"]';

const SUPPORT_BUTTON = '[data-testid="contestant-contact-support"]';

/** A paragraph that holds the place of a sentence the page does not show yet. */
const PLACEHOLDER = 'p.invisible';

/** The key of the sentence that says the entity is hidden from voters. */
const HIDDEN_SENTENCE = 'contestantApp.common.isHiddenBecauseMissing';

/** The key of the sentence that says answers can no longer be edited. */
const LOCKED_SENTENCE = 'contestantApp.common.editingNotAllowed';

const ENTITY_ID = '11111111-1111-4111-8111-111111111111';

/** A candidate as the list of the user's entities holds it. */
const CANDIDATE: Pick<Box, 'selectedEntity'> = {
  selectedEntity: { type: 'candidate', id: ENTITY_ID, firstName: 'Ada', lastName: 'Alpha', confirmed: false }
};

/** An organization, likewise. */
const PARTY: Pick<Box, 'selectedEntity'> = {
  selectedEntity: { type: 'organization', id: ENTITY_ID, name: 'Esimerkkipuolue', confirmed: false }
};

/** The entity is known and has no nomination, while nominations cannot be edited. */
const NO_NOMINATION: Pick<Box, 'taskState'> = {
  taskState: taskStateOf({ ...NOMINATED_FACTS, hasNomination: false })
};

/** The entity is known and has no nomination, while nominations can be edited. */
const NO_NOMINATION_EDITABLE: Pick<Box, 'taskState'> = {
  taskState: taskStateOf({ ...NOMINATED_FACTS, hasNomination: false, nominationsEditable: true })
};

/** A nomination, and the question lists not loaded. */
const PENDING: Pick<Box, 'taskState'> = { taskState: taskStateOf(NOMINATED_FACTS) };

/** A nomination, three required info questions unanswered and both opinion questions unanswered. */
const NOTHING_FILLED: Pick<Box, 'taskState'> = {
  taskState: taskStateOf({
    ...LOADED_FACTS,
    unansweredRequiredInfoCount: 3,
    unansweredOpinionCount: 2,
    firstUnansweredOpinionId: 'q1'
  })
};

/** A nomination, the required info answered and one opinion question unanswered. */
const QUESTIONS_LEFT: Pick<Box, 'taskState'> = {
  taskState: taskStateOf({ ...LOADED_FACTS, unansweredOpinionCount: 1, firstUnansweredOpinionId: 'q2' })
};

/** A nomination and every question answered, with only a required name missing. */
const NAME_MISSING: Pick<Box, 'taskState'> = {
  taskState: taskStateOf({ ...LOADED_FACTS, requiredNameMissing: true })
};

/** A nomination, no opinion question asked, and one required info question unanswered. */
const NO_QUESTIONS_ASKED: Pick<Box, 'taskState'> = {
  taskState: taskStateOf({ ...LOADED_FACTS, opinionCount: 0, unansweredRequiredInfoCount: 1 })
};

/** A nomination and nothing left to do. */
const ALL_COMPLETE: Pick<Box, 'taskState'> = { taskState: taskStateOf(LOADED_FACTS) };

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  box = EMPTY_BOX;
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

/** An element the page must render. */
function shown(target: ParentNode, selector: string): HTMLElement {
  const element = target.querySelector<HTMLElement>(selector);
  expect(element, `${selector} should be rendered`).not.toBeNull();
  return element!;
}

/** The markup an icon holds once its drawing is loaded. */
function iconMarkup(drawing: string): string {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.innerHTML = drawing;
  return svg.innerHTML;
}

/** Whether `later` comes after `earlier` in reading order. */
function follows(later: Node, earlier: Node): boolean {
  return (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}

/** What each row of the list says of its task, in order. */
function statusesOf(target: ParentNode): Array<[string | null, string | null]> {
  return Array.from(shown(target, TASK_LIST).querySelectorAll<HTMLElement>(TASK_ROW)).map((row) => [
    row.getAttribute('data-task'),
    row.getAttribute('data-status')
  ]);
}

/** The status sentences inside an element, as text. */
function sentencesOf(element: ParentNode): Array<string | undefined> {
  return Array.from(element.querySelectorAll('.sr-only')).map((sentence) => sentence.textContent?.trim());
}

/** The page's content and its main action, as markup. */
function contentMarkupOf(target: HTMLElement): string {
  return shown(target, TASK_LIST).parentElement!.innerHTML + shown(target, MAIN_ACTION).outerHTML;
}

describe('the contestant home page — an entity with no nomination', () => {
  /** A candidate with no nomination. */
  const CANDIDATE_NONE: Partial<Box> = { selectedEntity: CANDIDATE.selectedEntity, ...NO_NOMINATION };

  /** An organization with no nomination. */
  const PARTY_NONE: Partial<Box> = { selectedEntity: PARTY.selectedEntity, ...NO_NOMINATION };

  /** Each entity type with the name it is greeted by. */
  const BY_TYPE = [
    ['a candidate', CANDIDATE_NONE, 'candidate', 'Ada'],
    ['an organization', PARTY_NONE, 'organization', 'Esimerkkipuolue']
  ] as const;

  /** The two rows that are closed while the entity has no nomination, with the keys of their labels. */
  const BLOCKED_ROWS = [
    ['profile', PROFILE_BUTTON, 'contestantApp.home.basicInfo'],
    ['questions', QUESTIONS_BUTTON, 'contestantApp.home.questions']
  ] as const;

  it.each(BY_TYPE)(
    'greets %s by the name of the selected entity, under one heading and no hero',
    (_, state, __, name) => {
      const target = render(state);

      const headings = target.querySelectorAll('h1');
      expect(headings).toHaveLength(1);
      expect(headings[0].textContent).toBe(`contestantApp.common.greeting(username=${name})`);
      expect(target.querySelector('figure')).toBeNull();
    }
  );

  it.each(BY_TYPE)('explains to %s what a nomination is, in no words or colour of an error', (_, state, type) => {
    const target = render(state);

    const status = shown(target, STATUS);
    expect(status.textContent?.trim()).toBe(`contestantApp.home.ingress.noNomination.${type}`);
    expect(status.className).not.toMatch(/warning|error/);
    expect(target.textContent).not.toContain('dynamic.error');
    expect(target.textContent).not.toContain('error.');
    expect(target.querySelector('[data-testid="contestant-home-tip"]')).toBeNull();
  });

  it('lists the three tasks in order in a named ordered list that says it is ready', () => {
    const target = render(CANDIDATE_NONE);

    const list = shown(target, TASK_LIST);
    expect(list.tagName).toBe('OL');
    expect(list.getAttribute('role')).toBe('list');
    expect(list.getAttribute('aria-label')).toBe('contestantApp.home.tasksLabel');
    expect(list.getAttribute('data-task-state')).toBe('ready');
    const rows = Array.from(list.querySelectorAll<HTMLElement>(TASK_ROW));
    expect(rows.map((row) => row.tagName)).toEqual(['LI', 'LI', 'LI']);
    expect(rows.every((row) => row.parentElement === list)).toBe(true);
    expect(rows.map((row) => row.getAttribute('data-task'))).toEqual(['nomination', 'profile', 'questions']);
    expect(rows.map((row) => row.getAttribute('data-status'))).toEqual(['incomplete', 'blocked', 'blocked']);
  });

  it('shows the nomination as a link to the nominations view that is not completed, with a mark hidden from assistive technology', async () => {
    const target = render(CANDIDATE_NONE);

    const button = shown(target, NOMINATION_BUTTON);
    expect(button.getAttribute('href')).toBe('/route/ContestantAppNominations');
    expect(button.getAttribute('aria-disabled')).toBeNull();
    expect(button.getAttribute('aria-describedby')).toBeNull();
    expect(button.textContent).toContain('contestantApp.home.nomination.enter');
    const badge = shown(button, TASK_BADGE);
    expect(badge.getAttribute('aria-hidden')).toBe('true');
    expect(badge.textContent?.trim()).toBe('!');
    const sentences = button.querySelectorAll('.sr-only');
    expect(sentences).toHaveLength(1);
    expect(sentences[0].textContent?.trim()).toBe('contestantApp.home.taskStatus.incomplete');
    await vi.dynamicImportSettled();
    expect(button.querySelector('svg')?.innerHTML).toBe(iconMarkup(nominationDrawing));
  });

  it.each(BLOCKED_ROWS)(
    'shows the %s row as a locked button with no target that says it is not available and why',
    async (task, selector, label) => {
      const target = render(CANDIDATE_NONE);

      const button = shown(target, selector);
      expect(button.closest(TASK_ROW)?.getAttribute('data-task')).toBe(task);
      expect(button.getAttribute('role')).toBe('button');
      expect(button.hasAttribute('href')).toBe(false);
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.getAttribute('tabindex')).toBe('-1');
      expect(button.textContent).toContain(`${label}.enter`);
      expect(button.querySelector(TASK_BADGE)).toBeNull();
      const sentences = button.querySelectorAll('.sr-only');
      expect(sentences).toHaveLength(1);
      expect(sentences[0].textContent?.trim()).toBe('contestantApp.home.taskStatus.blocked');
      const reason = shown(target, CLOSED_REASON);
      expect(reason.id).not.toBe('');
      expect(button.getAttribute('aria-describedby')).toBe(reason.id);
      await vi.dynamicImportSettled();
      expect(button.querySelector('svg')?.innerHTML).toBe(iconMarkup(lockDrawing));
    }
  );

  it('shows the preview entry under the list, closed and described by the reason', () => {
    const target = render(CANDIDATE_NONE);

    const list = shown(target, TASK_LIST);
    const preview = shown(target, PREVIEW_BUTTON);
    expect(list.contains(preview)).toBe(false);
    expect(follows(preview, list)).toBe(true);
    expect(preview.getAttribute('data-preview')).toBe('closed');
    expect(preview.hasAttribute('href')).toBe(false);
    expect(preview.getAttribute('aria-disabled')).toBe('true');
    expect(preview.getAttribute('aria-describedby')).toBe(shown(target, CLOSED_REASON).id);
  });

  it.each(BY_TYPE)(
    'tells %s why the entries are closed, after them and in no colour of a warning',
    (_, state, type) => {
      const target = render(state);

      const reasons = target.querySelectorAll<HTMLElement>(CLOSED_REASON);
      expect(reasons).toHaveLength(1);
      expect(reasons[0].textContent?.trim()).toBe(`contestantApp.common.closedReason.noNomination.${type}`);
      expect(reasons[0].getAttribute('data-reason')).toBe('noNomination');
      expect(reasons[0].className).not.toMatch(/warning|error/);
      expect(follows(reasons[0], shown(target, PREVIEW_BUTTON))).toBe(true);
    }
  );

  it('offers one main action, labelled as the nomination row, that leads to the nominations view', () => {
    const target = render(CANDIDATE_NONE);

    const actions = target.querySelectorAll<HTMLElement>(MAIN_ACTION);
    expect(actions).toHaveLength(1);
    expect(actions[0].textContent).toContain('contestantApp.home.nomination.enter');
    expect(actions[0].getAttribute('href')).toBe('/route/ContestantAppNominations');
    expect(actions[0].getAttribute('data-next-step')).toBe('nomination');
  });

  it.each([
    ['a candidate', CANDIDATE.selectedEntity],
    ['an organization', PARTY.selectedEntity]
  ])(
    "leads the nomination row and the main action to the editor's entry for %s while the task state says so, with the labels and markers they have otherwise",
    (_, selectedEntity) => {
      const target = render({ selectedEntity, ...NO_NOMINATION_EDITABLE });

      const row = shown(target, NOMINATION_BUTTON);
      expect(row.getAttribute('href')).toBe('/route/ContestantAppNominationElections');
      expect(row.textContent).toContain('contestantApp.home.nomination.enter');
      const action = shown(target, MAIN_ACTION);
      expect(action.getAttribute('href')).toBe('/route/ContestantAppNominationElections');
      expect(action.textContent).toContain('contestantApp.home.nomination.enter');
      expect(action.getAttribute('data-next-step')).toBe('nomination');
      expect(statusesOf(target)).toEqual([
        ['nomination', 'incomplete'],
        ['profile', 'blocked'],
        ['questions', 'blocked']
      ]);
    }
  );

  it('differs from the home whose first task leads to the nominations view in those two addresses alone', () => {
    /** The page's content and its main action, as markup. */
    function markupOf(target: HTMLElement): string {
      return shown(target, TASK_LIST).parentElement!.innerHTML + shown(target, MAIN_ACTION).outerHTML;
    }
    const toView = markupOf(render(CANDIDATE_NONE));
    const toEditor = markupOf(render({ selectedEntity: CANDIDATE.selectedEntity, ...NO_NOMINATION_EDITABLE }));

    expect(toEditor).not.toBe(toView);
    expect(toEditor.replaceAll('/route/ContestantAppNominationElections', '/route/ContestantAppNominations')).toBe(
      toView
    );
  });

  it('with answers locked shows the note with its first sentence alone, and the closed rows take their view labels', () => {
    const target = render({
      ...PARTY_NONE,
      answersLocked: true,
      hideIfMissingAnswers: { candidate: true, organization: true },
      unansweredRequiredInfoQuestions: [{ id: 'info-1' }]
    });

    const note = shown(target, LOCKED_WARNING);
    expect(note.getAttribute('data-reason')).toBe('answersLocked');
    expect(note.textContent).toContain(LOCKED_SENTENCE);
    expect(note.textContent).not.toContain(HIDDEN_SENTENCE);
    expect(shown(target, PROFILE_BUTTON).textContent).toContain('contestantApp.home.basicInfo.view');
    expect(shown(target, QUESTIONS_BUTTON).textContent).toContain('contestantApp.home.questions.view');
    expect(shown(target, NOMINATION_BUTTON).textContent).toContain('contestantApp.home.nomination.enter');
    expect(shown(target, MAIN_ACTION).textContent).toContain('contestantApp.home.nomination.enter');
  });

  it('is the same with nominations locked as with them unlocked', () => {
    /** The page's content and its main action, as markup. */
    function markupOf(target: HTMLElement): string {
      return shown(target, TASK_LIST).parentElement!.innerHTML + shown(target, MAIN_ACTION).outerHTML;
    }
    const unlocked = markupOf(render(CANDIDATE_NONE));
    const locked = markupOf(render({ ...CANDIDATE_NONE, nominationsLocked: true }));

    expect(locked).toBe(unlocked);
  });

  it('puts every status sentence inside a button, and no view-transition name on what it renders', () => {
    const target = render(CANDIDATE_NONE);

    const list = shown(target, TASK_LIST);
    for (const row of list.querySelectorAll<HTMLElement>(TASK_ROW)) {
      expect(row.children).toHaveLength(1);
      expect(row.children[0].getAttribute('role')).toBe('button');
      expect(row.textContent).toBe(row.children[0].textContent);
    }
    const sentences = Array.from(list.querySelectorAll('.sr-only'));
    expect(sentences).toHaveLength(3);
    expect(sentences.every((sentence) => sentence.closest('[role="button"]') !== null)).toBe(true);
    const heading = shown(target, 'h1');
    const named = Array.from(target.querySelectorAll<HTMLElement>('[style*="view-transition-name"]'));
    expect(named.filter((element) => !element.contains(heading))).toEqual([]);
  });
});

describe('the contestant home page — an entity that has a nomination, before its question lists are known', () => {
  /** The two rows whose status is not known, with their routes, the keys of their labels and their own icons. */
  const PENDING_ROWS = [
    ['profile', PROFILE_BUTTON, 'ContestantAppProfile', 'contestantApp.home.basicInfo.enter', profileDrawing],
    ['questions', QUESTIONS_BUTTON, 'ContestantAppQuestions', 'contestantApp.home.questions.enter', opinionDrawing]
  ] as const;

  it('says the list is pending, with the nomination complete and the other two rows not known', () => {
    const target = render({ ...CANDIDATE, ...PENDING });

    expect(shown(target, TASK_LIST).getAttribute('data-task-state')).toBe('pending');
    expect(statusesOf(target)).toEqual([
      ['nomination', 'complete'],
      ['profile', 'pending'],
      ['questions', 'pending']
    ]);
  });

  it('shows the nomination row as a completed link to the nominations view, with a check and no badge', async () => {
    const target = render({ ...CANDIDATE, ...PENDING });

    const button = shown(target, NOMINATION_BUTTON);
    expect(button.getAttribute('href')).toBe('/route/ContestantAppNominations');
    expect(button.getAttribute('aria-disabled')).toBeNull();
    expect(button.textContent).toContain('contestantApp.home.nomination.view');
    expect(button.querySelector(TASK_BADGE)).toBeNull();
    expect(sentencesOf(button)).toEqual(['contestantApp.home.taskStatus.complete']);
    await vi.dynamicImportSettled();
    expect(button.querySelector('svg')?.innerHTML).toBe(iconMarkup(checkDrawing));
  });

  it.each(PENDING_ROWS)(
    'shows the %s row as a link with its own icon, no badge and no status sentence',
    async (task, selector, route, label, drawing) => {
      const target = render({ ...CANDIDATE, ...PENDING });

      const button = shown(target, selector);
      expect(button.closest(TASK_ROW)?.getAttribute('data-task')).toBe(task);
      expect(button.closest(TASK_ROW)?.getAttribute('data-status')).toBe('pending');
      expect(button.getAttribute('href')).toBe(`/route/${route}`);
      expect(button.getAttribute('aria-disabled')).toBeNull();
      expect(button.getAttribute('aria-describedby')).toBeNull();
      expect(button.textContent).toContain(label);
      expect(button.querySelector(TASK_BADGE)).toBeNull();
      expect(sentencesOf(button)).toEqual([]);
      await vi.dynamicImportSettled();
      expect(button.querySelector('svg')?.innerHTML).toBe(iconMarkup(drawing));
    }
  );

  it('shows the preview entry disabled, with no description', () => {
    const target = render({ ...CANDIDATE, ...PENDING });

    const preview = shown(target, PREVIEW_BUTTON);
    expect(preview.getAttribute('data-preview')).toBe('closed');
    expect(preview.hasAttribute('href')).toBe(false);
    expect(preview.getAttribute('aria-disabled')).toBe('true');
    expect(preview.getAttribute('aria-describedby')).toBeNull();
  });

  it('shows no explanation, tip or reason, and holds the places of two sentences with paragraphs hidden from everyone', () => {
    const target = render({ ...PARTY, ...PENDING });

    expect(target.querySelector(STATUS)).toBeNull();
    expect(target.querySelector(TIP)).toBeNull();
    expect(target.querySelector(CLOSED_REASON)).toBeNull();
    expect(target.querySelector('#contestant-home-closed-reason')).toBeNull();
    const holders = Array.from(target.querySelectorAll<HTMLElement>(PLACEHOLDER));
    expect(holders).toHaveLength(2);
    for (const holder of holders) {
      expect(holder.getAttribute('aria-hidden')).toBe('true');
      expect(holder.hasAttribute('data-testid')).toBe(false);
      expect(holder.id).toBe('');
    }
    const [explanation, reason] = holders;
    expect(explanation.textContent?.trim()).toBe('contestantApp.home.ingress.notDone.organization');
    expect(explanation.className).toContain('text-center');
    expect(follows(shown(target, TASK_LIST), explanation)).toBe(true);
    expect(reason.textContent?.trim()).toBe('contestantApp.common.closedReason.preview');
    expect(reason.className).toContain('small-info');
    expect(follows(reason, shown(target, PREVIEW_BUTTON))).toBe(true);
  });

  it('offers one main action that is disabled in its loading form and names no next step', () => {
    const target = render({ ...CANDIDATE, ...PENDING });

    const actions = target.querySelectorAll<HTMLElement>(MAIN_ACTION);
    expect(actions).toHaveLength(1);
    expect(actions[0].tagName).toBe('BUTTON');
    expect((actions[0] as HTMLButtonElement).disabled).toBe(true);
    expect(actions[0].hasAttribute('href')).toBe(false);
    expect(actions[0].hasAttribute('data-next-step')).toBe(false);
    expect(actions[0].textContent).toContain('common.loading');
    expect(actions[0].textContent).not.toContain('contestantApp.home');
  });

  it.each([
    ['a candidate', CANDIDATE, 'Ada'],
    ['an organization', PARTY, 'Esimerkkipuolue']
  ] as const)('greets %s by the name of the selected entity, under one heading and no hero', (_, entity, name) => {
    const target = render({ ...entity, ...PENDING });

    const headings = target.querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe(`contestantApp.common.greeting(username=${name})`);
    expect(target.querySelector('figure')).toBeNull();
    expect(target.textContent).not.toContain('contestantApp.home.ready');
  });

  it('with answers locked shows the note with its first sentence alone', () => {
    const target = render({
      ...CANDIDATE,
      ...PENDING,
      answersLocked: true,
      hideIfMissingAnswers: { candidate: true, organization: true }
    });

    const note = shown(target, LOCKED_WARNING);
    expect(note.textContent).toContain(LOCKED_SENTENCE);
    expect(note.textContent).not.toContain(HIDDEN_SENTENCE);
  });
});

describe('the contestant home page — an entity that has a nomination and something left to do', () => {
  it('lists the three tasks in a ready list, the nomination complete and the other two not', () => {
    const target = render({ ...CANDIDATE, ...NOTHING_FILLED });

    expect(shown(target, TASK_LIST).getAttribute('data-task-state')).toBe('ready');
    expect(statusesOf(target)).toEqual([
      ['nomination', 'complete'],
      ['profile', 'incomplete'],
      ['questions', 'incomplete']
    ]);
    expect(target.querySelectorAll(PLACEHOLDER)).toHaveLength(0);
  });

  it.each([
    ['profile', PROFILE_BUTTON, 'ContestantAppProfile', 'contestantApp.home.basicInfo.enter', 3],
    ['questions', QUESTIONS_BUTTON, 'ContestantAppQuestions', 'contestantApp.home.questions.enter', 2]
  ] as const)(
    'shows the %s row as an open link with its count in a hidden badge and in the sentence of its name',
    (_, selector, route, label, count) => {
      const target = render({ ...CANDIDATE, ...NOTHING_FILLED });

      const button = shown(target, selector);
      expect(button.getAttribute('role')).toBe('button');
      expect(button.getAttribute('href')).toBe(`/route/${route}`);
      expect(button.getAttribute('aria-disabled')).toBeNull();
      expect(button.getAttribute('tabindex')).toBe('0');
      expect(button.getAttribute('aria-describedby')).toBeNull();
      expect(button.textContent).toContain(label);
      const badge = shown(button, TASK_BADGE);
      expect(badge.getAttribute('aria-hidden')).toBe('true');
      expect(badge.textContent?.trim()).toBe(String(count));
      expect(sentencesOf(button)).toEqual([`contestantApp.home.taskStatus.incompleteCount(count=${count})`]);
    }
  );

  it('shows the preview entry closed and described by its own reason, which follows it in no colour of a warning', () => {
    const target = render({ ...CANDIDATE, ...NOTHING_FILLED });

    const preview = shown(target, PREVIEW_BUTTON);
    expect(preview.getAttribute('data-preview')).toBe('closed');
    expect(preview.getAttribute('role')).toBe('button');
    expect(preview.hasAttribute('href')).toBe(false);
    expect(preview.getAttribute('aria-disabled')).toBe('true');
    expect(preview.getAttribute('tabindex')).toBe('-1');
    const reasons = target.querySelectorAll<HTMLElement>(CLOSED_REASON);
    expect(reasons).toHaveLength(1);
    expect(reasons[0].id).not.toBe('');
    expect(preview.getAttribute('aria-describedby')).toBe(reasons[0].id);
    expect(reasons[0].getAttribute('data-reason')).toBe('previewNotReady');
    expect(reasons[0].textContent?.trim()).toBe('contestantApp.common.closedReason.preview');
    expect(reasons[0].className).not.toMatch(/warning|error/);
    expect(follows(reasons[0], preview)).toBe(true);
  });

  it.each([
    ['a candidate', CANDIDATE, 'candidate', 'Ada'],
    ['an organization', PARTY, 'organization', 'Esimerkkipuolue']
  ] as const)('greets %s and says what is left, with no hero and no tip', (_, entity, type, name) => {
    const target = render({ ...entity, ...NOTHING_FILLED });

    expect(target.querySelectorAll('h1')).toHaveLength(1);
    expect(shown(target, 'h1').textContent).toBe(`contestantApp.common.greeting(username=${name})`);
    expect(shown(target, STATUS).textContent?.trim()).toBe(`contestantApp.home.ingress.notDone.${type}`);
    expect(follows(shown(target, TASK_LIST), shown(target, STATUS))).toBe(true);
    expect(target.querySelector(TIP)).toBeNull();
    expect(target.querySelector('figure')).toBeNull();
  });

  it('offers one main action, labelled as the profile row, that leads to the profile', () => {
    const target = render({ ...CANDIDATE, ...NOTHING_FILLED });

    const actions = target.querySelectorAll<HTMLElement>(MAIN_ACTION);
    expect(actions).toHaveLength(1);
    expect(actions[0].textContent).toContain('contestantApp.home.basicInfo.enter');
    expect(actions[0].getAttribute('href')).toBe('/route/ContestantAppProfile');
    expect(actions[0].getAttribute('data-next-step')).toBe('profile');
  });

  it('with only the questions left, shows the profile complete and leads the main action to the questions list', async () => {
    const target = render({ ...CANDIDATE, ...QUESTIONS_LEFT });

    expect(statusesOf(target)).toEqual([
      ['nomination', 'complete'],
      ['profile', 'complete'],
      ['questions', 'incomplete']
    ]);
    const profile = shown(target, PROFILE_BUTTON);
    expect(profile.textContent).toContain('contestantApp.home.basicInfo.edit');
    expect(profile.querySelector(TASK_BADGE)).toBeNull();
    expect(sentencesOf(profile)).toEqual(['contestantApp.home.taskStatus.complete']);
    const action = shown(target, MAIN_ACTION);
    expect(action.textContent).toContain('contestantApp.home.questions.enter');
    expect(action.getAttribute('href')).toBe('/route/ContestantAppQuestions');
    expect(action.getAttribute('data-next-step')).toBe('questions');
    expect(shown(target, CLOSED_REASON).getAttribute('data-reason')).toBe('previewNotReady');
    await vi.dynamicImportSettled();
    expect(profile.querySelector('svg')?.innerHTML).toBe(iconMarkup(checkDrawing));
  });

  it('marks a profile that lacks only its name with an exclamation mark and a sentence without a count, and leaves the preview open', () => {
    const target = render({ ...PARTY, ...NAME_MISSING });

    expect(statusesOf(target)).toEqual([
      ['nomination', 'complete'],
      ['profile', 'incomplete'],
      ['questions', 'complete']
    ]);
    const profile = shown(target, PROFILE_BUTTON);
    const badge = shown(profile, TASK_BADGE);
    expect(badge.getAttribute('aria-hidden')).toBe('true');
    expect(badge.textContent?.trim()).toBe('!');
    expect(sentencesOf(profile)).toEqual(['contestantApp.home.taskStatus.incomplete']);
    const preview = shown(target, PREVIEW_BUTTON);
    expect(preview.getAttribute('data-preview')).toBe('open');
    expect(preview.getAttribute('href')).toBe('/route/ContestantAppPreview');
    expect(preview.getAttribute('aria-disabled')).toBeNull();
    expect(preview.getAttribute('aria-describedby')).toBeNull();
    expect(target.querySelector(CLOSED_REASON)).toBeNull();
    expect(shown(target, STATUS).textContent?.trim()).toBe('contestantApp.home.ingress.notDone.organization');
    expect(shown(target, MAIN_ACTION).getAttribute('data-next-step')).toBe('profile');
  });

  it.each([
    ['a candidate', CANDIDATE, 'candidate'],
    ['an organization', PARTY, 'organization']
  ] as const)(
    'for %s that is asked no opinion question lists two tasks and names no questions in what it says',
    (_, entity, type) => {
      const target = render({ ...entity, ...NO_QUESTIONS_ASKED });

      expect(statusesOf(target)).toEqual([
        ['nomination', 'complete'],
        ['profile', 'incomplete']
      ]);
      expect(target.querySelector(QUESTIONS_BUTTON)).toBeNull();
      expect(shown(shown(target, PROFILE_BUTTON), TASK_BADGE).textContent?.trim()).toBe('1');
      expect(shown(target, STATUS).textContent?.trim()).toBe(`contestantApp.home.ingress.notDoneNoQuestions.${type}`);
      const reason = shown(target, CLOSED_REASON);
      expect(reason.getAttribute('data-reason')).toBe('previewNotReady');
      expect(reason.textContent?.trim()).toBe('contestantApp.common.closedReason.previewNoQuestions');
      expect(shown(target, PREVIEW_BUTTON).getAttribute('aria-describedby')).toBe(reason.id);
    }
  );

  it('puts every status sentence inside a button, and no view-transition name on what it renders', () => {
    const target = render({ ...CANDIDATE, ...NOTHING_FILLED });

    const list = shown(target, TASK_LIST);
    for (const row of list.querySelectorAll<HTMLElement>(TASK_ROW)) {
      expect(row.children).toHaveLength(1);
      expect(row.children[0].getAttribute('role')).toBe('button');
      expect(row.textContent).toBe(row.children[0].textContent);
    }
    const sentences = Array.from(list.querySelectorAll('.sr-only'));
    expect(sentences).toHaveLength(3);
    expect(sentences.every((sentence) => sentence.closest('[role="button"]') !== null)).toBe(true);
    const heading = shown(target, 'h1');
    const named = Array.from(target.querySelectorAll<HTMLElement>('[style*="view-transition-name"]'));
    expect(named.filter((element) => !element.contains(heading))).toEqual([]);
  });
});

describe('the contestant home page — every task complete', () => {
  it.each([
    ['a candidate', CANDIDATE, 'Ada'],
    ['an organization', PARTY, 'Esimerkkipuolue']
  ] as const)(
    'tells %s it is ready under a title that names no one, with the success emoji and the tip',
    (_, entity, name) => {
      const target = render({ ...entity, ...ALL_COMPLETE });

      const headings = target.querySelectorAll('h1');
      expect(headings).toHaveLength(1);
      expect(headings[0].textContent).toBe('contestantApp.home.ready');
      expect(target.textContent).not.toContain(name);
      expect(shown(target, 'figure').textContent).toContain('dynamic.success.heroEmoji');
      expect(shown(target, STATUS).textContent?.trim()).toBe('contestantApp.home.ingress.ready');
      const tip = shown(target, TIP);
      expect(tip.textContent?.trim()).toBe('contestantApp.home.previewTip');
      expect(follows(tip, shown(target, STATUS))).toBe(true);
      expect(follows(shown(target, TASK_LIST), tip)).toBe(true);
    }
  );

  it('shows three completed rows, each with a check, its completed label and no badge', async () => {
    const target = render({ ...CANDIDATE, ...ALL_COMPLETE });

    expect(shown(target, TASK_LIST).getAttribute('data-task-state')).toBe('ready');
    expect(statusesOf(target)).toEqual([
      ['nomination', 'complete'],
      ['profile', 'complete'],
      ['questions', 'complete']
    ]);
    expect(target.querySelector(TASK_BADGE)).toBeNull();
    expect(sentencesOf(shown(target, TASK_LIST))).toEqual([
      'contestantApp.home.taskStatus.complete',
      'contestantApp.home.taskStatus.complete',
      'contestantApp.home.taskStatus.complete'
    ]);
    expect(shown(target, NOMINATION_BUTTON).textContent).toContain('contestantApp.home.nomination.view');
    expect(shown(target, PROFILE_BUTTON).textContent).toContain('contestantApp.home.basicInfo.edit');
    expect(shown(target, QUESTIONS_BUTTON).textContent).toContain('contestantApp.home.questions.edit');
    await vi.dynamicImportSettled();
    for (const selector of [NOMINATION_BUTTON, PROFILE_BUTTON, QUESTIONS_BUTTON]) {
      expect(shown(target, selector).querySelector('svg')?.innerHTML).toBe(iconMarkup(checkDrawing));
    }
  });

  it('shows the preview entry open, with no reason sentence and nothing holding its place', () => {
    const target = render({ ...CANDIDATE, ...ALL_COMPLETE });

    const preview = shown(target, PREVIEW_BUTTON);
    expect(preview.getAttribute('data-preview')).toBe('open');
    expect(preview.getAttribute('href')).toBe('/route/ContestantAppPreview');
    expect(preview.getAttribute('aria-disabled')).toBeNull();
    expect(preview.getAttribute('aria-describedby')).toBeNull();
    expect(target.querySelector(CLOSED_REASON)).toBeNull();
    expect(target.querySelectorAll(PLACEHOLDER)).toHaveLength(0);
  });

  it('offers one main action, labelled as the preview, that leads to it', () => {
    const target = render({ ...CANDIDATE, ...ALL_COMPLETE });

    const actions = target.querySelectorAll<HTMLElement>(MAIN_ACTION);
    expect(actions).toHaveLength(1);
    expect(actions[0].textContent).toContain('contestantApp.home.preview');
    expect(actions[0].getAttribute('href')).toBe('/route/ContestantAppPreview');
    expect(actions[0].getAttribute('data-next-step')).toBe('preview');
  });

  it('is ready with two rows for an entity that is asked no opinion question', () => {
    const target = render({ ...PARTY, taskState: taskStateOf({ ...LOADED_FACTS, opinionCount: 0 }) });

    expect(shown(target, 'h1').textContent).toBe('contestantApp.home.ready');
    expect(statusesOf(target)).toEqual([
      ['nomination', 'complete'],
      ['profile', 'complete']
    ]);
    expect(shown(target, MAIN_ACTION).getAttribute('data-next-step')).toBe('preview');
  });
});

describe('the contestant home page — the locks, for an entity that has a nomination', () => {
  /** Required info is answered and an opinion question is not: only the setting decides whether the entity is hidden. */
  const LOCKED_WITH_AN_UNANSWERED_OPINION: Partial<Box> = { ...QUESTIONS_LEFT, answersLocked: true };

  it('with answers locked shows the note with both sentences and one support button, and the rows take their view labels', () => {
    const target = render({ ...CANDIDATE, ...NOTHING_FILLED, answersLocked: true });

    const notes = target.querySelectorAll<HTMLElement>(LOCKED_WARNING);
    expect(notes).toHaveLength(1);
    expect(notes[0].getAttribute('data-reason')).toBe('answersLocked');
    const text = notes[0].textContent ?? '';
    expect(text.indexOf(LOCKED_SENTENCE)).toBeGreaterThanOrEqual(0);
    expect(text.indexOf(LOCKED_SENTENCE)).toBeLessThan(text.indexOf(HIDDEN_SENTENCE));
    expect(text.indexOf(HIDDEN_SENTENCE)).toBeLessThan(text.indexOf('contestantApp.common.contactSupport'));
    expect(notes[0].querySelectorAll(SUPPORT_BUTTON)).toHaveLength(1);
    expect(target.querySelectorAll(SUPPORT_BUTTON)).toHaveLength(1);
    expect(shown(target, PROFILE_BUTTON).textContent).toContain('contestantApp.home.basicInfo.view');
    expect(shown(target, QUESTIONS_BUTTON).textContent).toContain('contestantApp.home.questions.view');
    expect(shown(target, NOMINATION_BUTTON).textContent).toContain('contestantApp.home.nomination.view');
    const action = shown(target, MAIN_ACTION);
    expect(action.textContent).toContain('contestantApp.home.basicInfo.view');
    expect(action.getAttribute('data-next-step')).toBe('profile');
    expect(shown(shown(target, PROFILE_BUTTON), TASK_BADGE).textContent?.trim()).toBe('3');
  });

  it.each([
    ['a candidate', CANDIDATE, { candidate: true, organization: false }, true],
    ['a candidate', CANDIDATE, { candidate: false, organization: true }, false],
    ['an organization', PARTY, { candidate: false, organization: true }, true],
    ['an organization', PARTY, { candidate: true, organization: false }, false]
  ] as const)(
    'the sentence that says %s is hidden from voters follows the key of its own type (%#)',
    (_, entity, hideIfMissingAnswers, hidden) => {
      const target = render({ ...entity, ...LOCKED_WITH_AN_UNANSWERED_OPINION, hideIfMissingAnswers });

      const warning = shown(target, LOCKED_WARNING);
      expect(warning.textContent).toContain(LOCKED_SENTENCE);
      expect(warning.textContent?.includes(HIDDEN_SENTENCE)).toBe(hidden);
    }
  );

  it('the hidden sentence is shown whatever the setting holds while required info is unanswered', () => {
    const target = render({ ...PARTY, ...NO_QUESTIONS_ASKED, answersLocked: true });

    expect(shown(target, LOCKED_WARNING).textContent).toContain(HIDDEN_SENTENCE);
  });

  it('the hidden sentence is absent once every task is complete', () => {
    const target = render({
      ...CANDIDATE,
      ...ALL_COMPLETE,
      answersLocked: true,
      hideIfMissingAnswers: { candidate: true, organization: true }
    });

    const note = shown(target, LOCKED_WARNING);
    expect(note.textContent).toContain(LOCKED_SENTENCE);
    expect(note.textContent).not.toContain(HIDDEN_SENTENCE);
    expect(shown(target, 'h1').textContent).toBe('contestantApp.home.ready');
  });

  it('the note is absent, with no support button, while answers are not locked', () => {
    const target = render({ ...CANDIDATE, ...NOTHING_FILLED, answersLocked: false });

    expect(target.querySelector(LOCKED_WARNING)).toBeNull();
    expect(target.querySelector(SUPPORT_BUTTON)).toBeNull();
  });

  it.each([
    ['something left to do', NOTHING_FILLED],
    ['every task complete', ALL_COMPLETE]
  ] as const)('with nominations locked the home with %s is the same as with them unlocked', (_, state) => {
    const unlocked = contentMarkupOf(render({ ...CANDIDATE, ...state }));
    const locked = contentMarkupOf(render({ ...CANDIDATE, ...state, nominationsLocked: true }));

    expect(locked).toBe(unlocked);
    expect(locked).toContain('contestantApp.home.nomination.view');
  });
});

describe('the contestant home page — a task state that changes under the mounted page', () => {
  it('goes from the pending frame to what is left, and from there to ready', () => {
    const target = render({ ...CANDIDATE, ...PENDING });
    expect(target.querySelector(STATUS)).toBeNull();
    expect(shown(target, MAIN_ACTION).hasAttribute('data-next-step')).toBe(false);

    box = { ...box, ...NOTHING_FILLED };
    flushSync();

    expect(shown(target, TASK_LIST).getAttribute('data-task-state')).toBe('ready');
    expect(shown(target, STATUS).textContent?.trim()).toBe('contestantApp.home.ingress.notDone.candidate');
    expect(target.querySelectorAll(PLACEHOLDER)).toHaveLength(0);
    expect(shown(target, CLOSED_REASON).getAttribute('data-reason')).toBe('previewNotReady');
    expect(shown(target, MAIN_ACTION).getAttribute('data-next-step')).toBe('profile');
    expect(shown(target, 'h1').textContent).toBe('contestantApp.common.greeting(username=Ada)');

    box = { ...box, ...ALL_COMPLETE };
    flushSync();

    expect(shown(target, 'h1').textContent).toBe('contestantApp.home.ready');
    expect(shown(target, PREVIEW_BUTTON).getAttribute('data-preview')).toBe('open');
    expect(target.querySelector(CLOSED_REASON)).toBeNull();
    expect(target.querySelector(TASK_BADGE)).toBeNull();
    expect(shown(target, MAIN_ACTION).getAttribute('data-next-step')).toBe('preview');
  });

  it('shows blocked rows with no count once the entity is one with no nomination, after one whose tasks carried counts', () => {
    const target = render({ ...CANDIDATE, ...NOTHING_FILLED });
    expect(target.querySelectorAll(TASK_BADGE)).toHaveLength(2);

    box = { ...box, ...PARTY, ...NO_NOMINATION };
    flushSync();

    expect(statusesOf(target)).toEqual([
      ['nomination', 'incomplete'],
      ['profile', 'blocked'],
      ['questions', 'blocked']
    ]);
    expect(shown(target, PROFILE_BUTTON).querySelector(TASK_BADGE)).toBeNull();
    expect(shown(target, QUESTIONS_BUTTON).querySelector(TASK_BADGE)).toBeNull();
    expect(shown(target, CLOSED_REASON).getAttribute('data-reason')).toBe('noNomination');
    expect(shown(target, 'h1').textContent).toBe('contestantApp.common.greeting(username=Esimerkkipuolue)');
    expect(shown(target, STATUS).textContent?.trim()).toBe('contestantApp.home.ingress.noNomination.organization');
  });
});
