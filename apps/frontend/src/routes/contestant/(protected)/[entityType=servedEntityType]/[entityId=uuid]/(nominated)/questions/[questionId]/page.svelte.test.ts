/**
 * The page of one opinion question of the Contestant App, mounted for real against a fake contestant context, with the real `MainContent` and `Button` below it. The question's heading and its answer input are stubs: the page hands them the question, and nothing they render is read here.
 *
 * What this file holds is the Save button: what it reads and where it leads.
 *
 * 1. **The label, before any save.** "Save and Continue" while a save would lead onward — another question is unanswered, or this is the last unanswered one — and "Save and Return" or "Return" when the save is an edit with no question left.
 * 2. **The target of a stored save.** The first unanswered question while one remains; the profile, or the entity's home, after the last unanswered question was answered; the questions list after an edit with none left.
 * 3. **A save that is not stored.** Nothing navigates, the failure is said, and the label is what it was.
 * 4. **Answers locked.** No Save button.
 * 5. **A save the answers lock refuses.** The page's data is read again, and the page says that answers can no longer be edited rather than that the save failed: when the save rejects with the answers-locked error, and when any failed save is followed by a read that finds answers locked.
 * 6. **The open answer before the answer.** The open answer of a question that allows one can be written while the question is unanswered; Save stays disabled, and the sentence that says why is beside it and describes it. What is written goes to the draft, and nothing is saved.
 *
 * The fake context's task state is the real `taskStateOf` over the facts of one raw state box, behind a getter, as the real accessor is a derived value over the store. A fake save rewrites the box before it resolves, as the real save takes the saved question out of the unanswered ones. A case can therefore tell a page that reads the state after the save, with `wasUnanswered` read before it, from one that reads both at one moment. Messages are their keys, and a route is its name, followed by the question's id where it has one.
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from '$app/state';
import { AnswersLockedError } from '$lib/api/base/answersLockedError';
import { taskStateOf } from '$lib/contestant/tasks/taskState';

/** A question as the page reads one. */
type FakeQuestion = {
  id: string;
  text: string;
  info: string;
  category: { id: string };
  customData: object;
};

/** Everything a case decides of what the page reads from the contestant context. */
type Box = {
  answersLocked: boolean;
  hasUnsaved: boolean;
  /** The answers of the store's current data by question id: the saved ones with the draft. */
  answers: Record<string, { value: unknown }>;
  opinionQuestions: Array<FakeQuestion>;
  /** The opinion questions with no saved answer. */
  unansweredOpinionQuestions: Array<FakeQuestion>;
  /** The required info questions with no saved answer: one is enough to leave the profile incomplete. */
  unansweredRequiredInfoQuestions: Array<{ id: string }>;
};

/** A route as the page hands one to the route builder. */
type RouteArgument = string | { route: string; questionId?: string };

function question(id: string): FakeQuestion {
  return { id, text: `Question ${id}`, info: '', category: { id: 'category' }, customData: {} };
}

const FIRST = question('q-first');
const SECOND = question('q-second');
const QUESTIONS = [FIRST, SECOND];
const REQUIRED_INFO = { id: 'q-required-info' };

const EMPTY_BOX: Box = {
  answersLocked: false,
  hasUnsaved: false,
  answers: {},
  opinionQuestions: QUESTIONS,
  unansweredOpinionQuestions: [],
  unansweredRequiredInfoQuestions: []
};

let box = $state.raw<Box>(EMPTY_BOX);

const { getQuestion, setAnswer, save, resetUnsaved, goto, invalidateAll } = vi.hoisted(() => ({
  getQuestion: vi.fn(),
  setAnswer: vi.fn(),
  save: vi.fn(),
  resetUnsaved: vi.fn(),
  goto: vi.fn(),
  invalidateAll: vi.fn()
}));

const context = {
  t: (key: string) => key,
  getRoute: {
    current: (route: RouteArgument) =>
      typeof route === 'string'
        ? `/route/${route}`
        : `/route/${route.route}${route.questionId ? `/${route.questionId}` : ''}`
  },
  appSettings: { contestantApp: { questions: { hideVideo: false, hideHero: false } } },
  dataRoot: { getQuestion },
  questionBlocks: { blocks: [] },
  nominations: [{ id: 'nomination' }],
  userData: {
    get current() {
      return { entity: { answers: box.answers } };
    },
    get hasUnsaved() {
      return box.hasUnsaved;
    },
    setAnswer,
    save,
    resetUnsaved
  },
  get answersLocked() {
    return box.answersLocked;
  },
  get opinionQuestions() {
    return box.opinionQuestions;
  },
  get unansweredOpinionQuestions() {
    return box.unansweredOpinionQuestions;
  },
  get unansweredRequiredInfoQuestions() {
    return box.unansweredRequiredInfoQuestions;
  },
  /** The state of an entity that has a nomination and whose question lists are loaded, over the box's saved facts. */
  get taskState() {
    return taskStateOf({
      entityKnown: true,
      hasNomination: true,
      questionsReady: true,
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
    video: { hasContent: false, load: () => undefined },
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

// The heading reads the app's contexts and the answer input a question of the data model. Each is replaced by a component that renders nothing.
vi.mock('$lib/dynamic-components/questionHeading', () => ({ QuestionHeading: () => undefined }));
vi.mock('$lib/components/questions', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  OpinionQuestionInput: () => undefined
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

const SAVE = '[data-testid="contestant-questions-save"]';
const RETURN = '[data-testid="contestant-questions-return"]';
const LOCKED_NOTE = '[data-testid="contestant-answers-locked-warning"]';

const SAVE_AND_CONTINUE = 'common.saveAndContinue';
const SAVE_AND_RETURN = 'common.saveAndReturn';
const RETURN_LABEL = 'common.return';
const SAVE_FAILED = 'contestantApp.error.saveFailed';

const QUESTION_ROUTE = '/route/ContestantAppQuestion';
const LIST_ROUTE = '/route/ContestantAppQuestions';
const PROFILE_ROUTE = '/route/ContestantAppProfile';
const HOME_ROUTE = '/route/ContestantAppEntityHome';

/** An answer the store holds for a question, saved or drafted. */
const ANSWER = { value: 'choice' };

let teardown: Array<() => void> = [];

beforeEach(() => {
  vi.spyOn(log, 'error').mockImplementation(() => undefined);
  getQuestion.mockImplementation((id: string) => {
    const found = QUESTIONS.find((candidate) => candidate.id === id);
    if (!found) throw new Error(`Question with id ${id} not found`);
    return found;
  });
  goto.mockResolvedValue(undefined);
  invalidateAll.mockResolvedValue(undefined);
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  box = EMPTY_BOX;
  page.params = {};
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

/** Mount the page of `shown` for a state of the context. The store holds an answer to the question, so the Save button is enabled. */
function render(shown: FakeQuestion, state: Partial<Box>): HTMLElement {
  box = { ...EMPTY_BOX, ...state, answers: { [shown.id]: ANSWER, ...state.answers } };
  page.params = { questionId: shown.id };
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

function saveOf(target: HTMLElement): HTMLButtonElement {
  const button = target.querySelector<HTMLButtonElement>(SAVE);
  expect(button, 'the Save button should be rendered').not.toBeNull();
  return button!;
}

/** Let the submit handler's awaited calls settle, then apply the state they wrote. */
async function settle(): Promise<void> {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
  flushSync();
}

/** Press Save and let the handler run as far as it can. */
async function pressSave(target: HTMLElement): Promise<void> {
  saveOf(target).click();
  await settle();
}

/**
 * Make the store's save a stored one. Before it resolves, the saved data holds the answer to `saved`: the question is no longer among the unanswered ones, and nothing is unsaved.
 */
function storeOnSave(saved: FakeQuestion): void {
  save.mockImplementation(async () => {
    box = {
      ...box,
      hasUnsaved: false,
      unansweredOpinionQuestions: box.unansweredOpinionQuestions.filter((candidate) => candidate.id !== saved.id)
    };
    return { type: 'success' };
  });
}

describe('question page — the label of the Save button', () => {
  it.each([
    ['the first of two unanswered questions', FIRST],
    ['the last of two unanswered questions', SECOND]
  ])('reads "Save and Continue" on %s', (_name, shown) => {
    const target = render(shown, { hasUnsaved: true, unansweredOpinionQuestions: [FIRST, SECOND] });

    expect(saveOf(target).textContent).toContain(SAVE_AND_CONTINUE);
  });

  it('reads "Save and Continue" on an answered question while another is unanswered', () => {
    const target = render(FIRST, { hasUnsaved: true, unansweredOpinionQuestions: [SECOND] });

    expect(saveOf(target).textContent).toContain(SAVE_AND_CONTINUE);
  });

  it.each([
    ['incomplete', [REQUIRED_INFO]],
    ['complete', []]
  ])('reads "Save and Continue" on the only unanswered question while the profile is %s', (_name, requiredInfo) => {
    const target = render(SECOND, {
      hasUnsaved: true,
      unansweredOpinionQuestions: [SECOND],
      unansweredRequiredInfoQuestions: requiredInfo
    });

    expect(saveOf(target).textContent).toContain(SAVE_AND_CONTINUE);
  });

  it('reads "Save and Return" on an answered question with an unsaved change when none is unanswered', () => {
    const target = render(FIRST, { hasUnsaved: true, unansweredOpinionQuestions: [] });

    expect(saveOf(target).textContent).toContain(SAVE_AND_RETURN);
  });

  it('reads "Return" on an answered question with nothing unsaved when none is unanswered', () => {
    const target = render(FIRST, { hasUnsaved: false, unansweredOpinionQuestions: [] });

    expect(saveOf(target).textContent).toContain(RETURN_LABEL);
    expect(saveOf(target).textContent).not.toContain(SAVE_AND_RETURN);
    expect(saveOf(target).textContent).not.toContain(SAVE_AND_CONTINUE);
  });
});

describe('question page — where a stored save leads', () => {
  it.each([
    ['complete', []],
    ['incomplete', [REQUIRED_INFO]]
  ])(
    'leads to the other unanswered question once the save has taken this one out of the unanswered ones, with the profile %s',
    async (_name, requiredInfo) => {
      storeOnSave(FIRST);
      const target = render(FIRST, {
        hasUnsaved: true,
        unansweredOpinionQuestions: [FIRST, SECOND],
        unansweredRequiredInfoQuestions: requiredInfo
      });

      await pressSave(target);

      expect(save).toHaveBeenCalledTimes(1);
      expect(goto).toHaveBeenCalledTimes(1);
      expect(goto).toHaveBeenCalledWith(`${QUESTION_ROUTE}/${SECOND.id}`);
    }
  );

  it('leads to the first unanswered question after an edit of an answered one', async () => {
    storeOnSave(SECOND);
    const target = render(SECOND, { hasUnsaved: true, unansweredOpinionQuestions: [FIRST] });

    await pressSave(target);

    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(`${QUESTION_ROUTE}/${FIRST.id}`);
  });

  it('leads to the profile after the last unanswered question while the profile is incomplete, although the save empties the unanswered ones before it resolves', async () => {
    storeOnSave(SECOND);
    const target = render(SECOND, {
      hasUnsaved: true,
      unansweredOpinionQuestions: [SECOND],
      unansweredRequiredInfoQuestions: [REQUIRED_INFO]
    });

    await pressSave(target);

    expect(box.unansweredOpinionQuestions).toEqual([]);
    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(PROFILE_ROUTE);
  });

  it('leads home after the last unanswered question when nothing else is left, and not to the questions list: `wasUnanswered` is read before the save empties the unanswered ones', async () => {
    storeOnSave(SECOND);
    const target = render(SECOND, { hasUnsaved: true, unansweredOpinionQuestions: [SECOND] });

    await pressSave(target);

    expect(box.unansweredOpinionQuestions).toEqual([]);
    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(HOME_ROUTE);
    expect(goto).not.toHaveBeenCalledWith(LIST_ROUTE);
  });

  it('leads back to the questions list after an edit of an answered question when none is unanswered', async () => {
    storeOnSave(FIRST);
    const target = render(FIRST, { hasUnsaved: true, unansweredOpinionQuestions: [] });

    await pressSave(target);

    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(LIST_ROUTE);
  });
});

describe('question page — a save that is not stored', () => {
  it('stays, says that the save failed and keeps its label when the store reports a failure', async () => {
    save.mockResolvedValue({ type: 'failure' });
    const target = render(SECOND, { hasUnsaved: true, unansweredOpinionQuestions: [SECOND] });
    expect(saveOf(target).textContent).toContain(SAVE_AND_CONTINUE);

    await pressSave(target);

    expect(save).toHaveBeenCalledTimes(1);
    expect(goto).not.toHaveBeenCalled();
    expect(target.textContent).toContain(SAVE_FAILED);
    expect(saveOf(target).textContent).toContain(SAVE_AND_CONTINUE);
    expect(saveOf(target).disabled).toBe(false);
  });

  it('stays, says that the save failed and keeps its label when the save rejects', async () => {
    save.mockRejectedValue(new Error('the write was refused'));
    const target = render(SECOND, { hasUnsaved: true, unansweredOpinionQuestions: [SECOND] });

    await pressSave(target);

    expect(goto).not.toHaveBeenCalled();
    expect(target.textContent).toContain(SAVE_FAILED);
    expect(target.textContent).not.toContain('the write was refused');
    expect(saveOf(target).textContent).toContain(SAVE_AND_CONTINUE);
  });
});

describe('question page — while answers are locked', () => {
  it('renders no Save button, and a Return button that leads to the questions list', () => {
    const target = render(FIRST, { answersLocked: true, unansweredOpinionQuestions: [SECOND] });

    expect(target.querySelector(SAVE)).toBeNull();
    const back = target.querySelector<HTMLAnchorElement>(RETURN);
    expect(back, 'the Return button should be rendered').not.toBeNull();
    expect(back!.getAttribute('href')).toBe(LIST_ROUTE);
    expect(back!.textContent).toContain(RETURN_LABEL);
  });
});

describe('question page — the open answer before the answer', () => {
  /** An opinion question that takes an open answer in one text field. */
  const OPEN = { ...question('q-open'), customData: { allowOpen: true, disableMultilingual: true } };
  const OPEN_QUESTIONS = [OPEN, SECOND];
  const COMMENT = '[data-testid="contestant-questions-comment"]';
  const SAVE_REASON = '[data-testid="contestant-questions-save-reason"]';
  const ANSWER_FIRST = 'contestantApp.questions.answerQuestionFirst';

  beforeEach(() => {
    getQuestion.mockImplementation((id: string) => {
      const found = OPEN_QUESTIONS.find((candidate) => candidate.id === id);
      if (!found) throw new Error(`Question with id ${id} not found`);
      return found;
    });
  });

  /** Mount the page of the open question, with no answer chosen unless `answered`. */
  function renderOpen({ answered = false, answersLocked = false } = {}): HTMLElement {
    return render(OPEN, {
      answersLocked,
      opinionQuestions: OPEN_QUESTIONS,
      unansweredOpinionQuestions: answered ? [SECOND] : OPEN_QUESTIONS,
      answers: answered ? {} : { [OPEN.id]: { value: undefined } }
    });
  }

  function commentOf(target: HTMLElement): HTMLTextAreaElement {
    const comment = target.querySelector<HTMLTextAreaElement>(COMMENT);
    expect(comment, 'the open answer should be rendered').not.toBeNull();
    return comment!;
  }

  it('leaves the open answer editable while the question is unanswered, keeps Save disabled and says why beside it', () => {
    const target = renderOpen();

    const comment = commentOf(target);
    expect(comment.disabled).toBe(false);
    expect(comment.getAttribute('placeholder') ?? '').not.toContain(ANSWER_FIRST);

    const save = saveOf(target);
    expect(save.disabled).toBe(true);
    const reason = target.querySelector<HTMLElement>(SAVE_REASON);
    expect(reason, 'the reason Save is disabled should be rendered').not.toBeNull();
    expect(reason!.textContent?.trim()).toBe(ANSWER_FIRST);
    expect(save.getAttribute('aria-describedby')?.split(' ')).toContain(reason!.id);
  });

  it('hands an open answer written first to the draft, and saves nothing', async () => {
    const target = renderOpen();

    const comment = commentOf(target);
    // A field that is disabled cannot be written in, though a change event dispatched to it is still handled.
    expect(comment.disabled).toBe(false);
    comment.value = 'Because';
    comment.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    saveOf(target).click();
    await settle();

    expect(setAnswer).toHaveBeenCalledTimes(1);
    expect(setAnswer).toHaveBeenCalledWith(OPEN.id, { info: 'Because' });
    expect(save).not.toHaveBeenCalled();
  });

  it('says no reason beside Save once the question is answered', () => {
    const target = renderOpen({ answered: true });

    expect(commentOf(target).disabled).toBe(false);
    expect(saveOf(target).disabled).toBe(false);
    expect(target.querySelector(SAVE_REASON)).toBeNull();
    expect(saveOf(target).hasAttribute('aria-describedby')).toBe(false);
  });

  it('locks the open answer while answers are locked, and says no reason', () => {
    const target = renderOpen({ answersLocked: true });

    expect(commentOf(target).disabled).toBe(true);
    expect(target.querySelector(SAVE_REASON)).toBeNull();
  });
});

describe('question page — a save the answers lock refuses', () => {
  /** Make the next read of the page's data find answers locked, as a read after the lock came on does. */
  function lockOnRead(): void {
    invalidateAll.mockImplementation(async () => {
      box = { ...box, answersLocked: true };
    });
  }

  it('reads the data again and says that answers are locked, not that the save failed, when the save rejects with the answers-locked error', async () => {
    save.mockRejectedValue(new AnswersLockedError());
    const target = render(SECOND, { hasUnsaved: true, unansweredOpinionQuestions: [SECOND] });
    expect(target.querySelector(LOCKED_NOTE)).toBeNull();

    await pressSave(target);

    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(goto).not.toHaveBeenCalled();
    expect(target.querySelector(LOCKED_NOTE)).not.toBeNull();
    expect(target.textContent).not.toContain(SAVE_FAILED);
    expect(target.querySelector(SAVE)).toBeNull();
  });

  it.each([
    ['rejects', () => save.mockRejectedValue(new Error('the write was refused'))],
    ['reports a failure', () => save.mockResolvedValue({ type: 'failure' })]
  ])(
    'says that answers are locked, not that the save failed, when the save %s and the data read again finds answers locked',
    async (_name, failSave) => {
      failSave();
      lockOnRead();
      const target = render(SECOND, { hasUnsaved: true, unansweredOpinionQuestions: [SECOND] });

      await pressSave(target);

      expect(invalidateAll).toHaveBeenCalledTimes(1);
      expect(goto).not.toHaveBeenCalled();
      expect(target.querySelector(LOCKED_NOTE)).not.toBeNull();
      expect(target.textContent).not.toContain(SAVE_FAILED);
    }
  );

  it('reads the data again after a failed save, and says that the save failed when answers are not locked', async () => {
    save.mockResolvedValue({ type: 'failure' });
    const target = render(SECOND, { hasUnsaved: true, unansweredOpinionQuestions: [SECOND] });

    await pressSave(target);

    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(target.querySelector(LOCKED_NOTE)).toBeNull();
    expect(target.textContent).toContain(SAVE_FAILED);
  });
});
