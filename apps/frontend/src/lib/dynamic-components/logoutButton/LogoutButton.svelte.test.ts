/**
 * `LogoutButton`, mounted for real with the app's sign-out and its warning passed as props, with the real `Button` and `TimedModal` below it.
 *
 * The cases of the Contestant App pass the warning the Contestant App passes, `contestantLogoutWarning` over a fake contestant context, read through a getter so that it follows the context as the app's `$derived` does. One case at the end passes what the Admin App passes: a `redirectTo` and no warning.
 *
 * What this file holds: when the button opens its modal before logging out. It does so for the entity that is loaded, while answers are not locked, when the profile or the questions task is incomplete with a count of what is left: that count is what the modal's sentences say. A blocked task, the nomination and a profile that lacks nothing a sentence can count open nothing, and the user is logged out at once. It also does so whenever a guard of unsaved edits is active, and then what the modal says, and what each of its answers does to the guard. A navigation closes the modal before SvelteKit writes the new page, so the header reads no page's guard across the route change.
 *
 * The two cookies that keep the count are the real module's, written into jsdom's cookie jar: the modal writes both with one id when it opens, every close removes them, and a sign-out the modal starts finds them gone.
 *
 * The fake context's tasks, its lists and the store's saved data are rune state behind getters, as the real accessors are. In every case the unanswered lists say the opposite of the tasks, so a button that decided by the lists would do the opposite of what the case expects.
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cookieValues } from '$lib/auth/logoutDeadline';
import { isNavigationHeld, registerNavigationGuard } from '$lib/components/preventNavigation/navigationGuards';
import { contestantLogoutWarning } from '$lib/contestant/utils/logoutWarning';
import { COOKIE } from '$lib/cookies';
import { buildRoute } from '$lib/routes';
import type { Mock } from 'vitest';
import type { Task } from '$lib/contestant/tasks/taskState';
import type { ContestantLogoutWarningSource } from '$lib/contestant/utils/logoutWarning';

/** What the button registers with `onNavigate` and with `afterNavigate`, the fake `goto` and the fake page it moves. */
const { afterNavigateCallbacks, fakePage, goto, onNavigateCallbacks } = vi.hoisted(() => {
  const fakePage = { url: new URL('http://localhost/admin') };
  return {
    afterNavigateCallbacks: [] as Array<() => void>,
    fakePage,
    goto: vi.fn(async (href: string) => {
      fakePage.url = new URL(href, 'http://localhost');
    }),
    onNavigateCallbacks: [] as Array<() => void>
  };
});

vi.mock('$app/state', () => ({ page: fakePage }));

vi.mock('$app/navigation', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  goto,
  afterNavigate: (callback: () => void) => {
    afterNavigateCallbacks.push(callback);
  },
  onNavigate: (callback: () => void) => {
    onNavigateCallbacks.push(callback);
  }
}));

const QUESTIONS = [{ id: 'q1' }, { id: 'q2' }];

/** The three tasks of an entity that has a nomination, each complete. */
const NOMINATION: Task = { id: 'nomination', status: 'complete', route: { route: 'ContestantAppNominations' } };
const PROFILE: Task = { id: 'profile', status: 'complete', route: { route: 'ContestantAppProfile' } };
const OPINIONS: Task = { id: 'questions', status: 'complete', route: { route: 'ContestantAppQuestions' } };

const state = $state<{
  savedEntityData: { answers: Record<string, unknown> } | undefined;
  answersLocked: boolean;
  tasks: Array<Task>;
  unansweredOpinionQuestions: Array<{ id: string }>;
  unansweredRequiredInfoQuestions: Array<{ id: string }>;
}>({
  savedEntityData: undefined,
  answersLocked: false,
  tasks: [],
  unansweredOpinionQuestions: [],
  unansweredRequiredInfoQuestions: []
});

const logout = vi.fn(async (): Promise<void> => undefined);

/** Whether the fake `t` shows its parameters after the key. A group that reads a message's parameters sets it. */
let tShowsParameters = false;

/**
 * What the fake `t` returns while it shows its parameters.
 * @param key - The message's key.
 * @param parameters - The message's parameters.
 * @returns The key and the parameters.
 */
function saidWith(key: string, parameters: Record<string, unknown>): string {
  return `${key} ${JSON.stringify(parameters)}`;
}

/** The fake contestant context the Contestant App's warning is read from. Its lists and the store's saved data are rune state behind getters, as the real accessors are. */
const contestantCtx = {
  appSettings: { entities: {} },
  selectedEntity: undefined,
  userData: {
    get savedEntityData() {
      return state.savedEntityData;
    }
  },
  get answersLocked() {
    return state.answersLocked;
  },
  get taskState() {
    return { tasks: state.tasks };
  },
  get unansweredOpinionQuestions() {
    return state.unansweredOpinionQuestions;
  },
  get unansweredRequiredInfoQuestions() {
    return state.unansweredRequiredInfoQuestions;
  }
} as unknown as ContestantLogoutWarningSource;

/**
 * The props the Contestant App passes: its sign-out and its warning, read live.
 * @param props - Further properties.
 * @returns The props.
 */
function contestantProps(props: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    logout,
    get warning() {
      return contestantLogoutWarning(contestantCtx);
    },
    ...props
  };
}

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({
    t: (key: string, parameters?: Record<string, unknown>) =>
      tShowsParameters && parameters ? saidWith(key, parameters) : key,
    darkMode: { current: false }
  })
}));

// jsdom has no `window.matchMedia`, and `svelte/motion` reads it when the modal is imported. The stub answers "no preference".
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

const { LogoutButton } = await import('.');

const proto = HTMLDialogElement.prototype as HTMLDialogElement & Record<string, unknown>;
const original = { showModal: proto.showModal, close: proto.close };

beforeAll(() => {
  // jsdom implements neither method.
  proto.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  proto.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
});

afterAll(() => {
  proto.showModal = original.showModal;
  proto.close = original.close;
});

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  afterNavigateCallbacks.length = 0;
  onNavigateCallbacks.length = 0;
  logout.mockClear();
  state.savedEntityData = undefined;
  state.answersLocked = false;
  state.tasks = [];
  state.unansweredOpinionQuestions = [];
  state.unansweredRequiredInfoQuestions = [];
});

/**
 * Set the tasks of the entity, and make the unanswered lists say the opposite of what the case expects of the button.
 * @param tasks - The entity's tasks.
 * @param listsSay - What the unanswered lists hold: every question, or none.
 */
function setTasks(tasks: Array<Task>, { listsSay }: { listsSay: 'everything is left' | 'nothing is left' }): void {
  state.tasks = tasks;
  const lists = listsSay === 'everything is left' ? QUESTIONS : [];
  state.unansweredOpinionQuestions = lists;
  state.unansweredRequiredInfoQuestions = lists;
}

/**
 * Make a client navigation in SvelteKit's order, for a component that stays mounted across it: the `onNavigate` callbacks, the write of the new page, its flush, and the `afterNavigate` callbacks.
 * @param writePage - What the new page changes, which runs where SvelteKit writes it.
 */
function navigate(writePage: () => void = () => undefined): void {
  expect(
    onNavigateCallbacks.length + afterNavigateCallbacks.length,
    'the button should listen for navigations'
  ).toBeGreaterThan(0);
  for (const callback of onNavigateCallbacks) callback();
  writePage();
  flushSync();
  for (const callback of afterNavigateCallbacks) callback();
  flushSync();
}

/**
 * Mount the button, press it and return the element it was mounted into.
 * @param props - The button's further properties.
 */
async function pressLogout(props: { logoutModalTimer?: number } = {}): Promise<HTMLElement> {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(LogoutButton, {
    target,
    props: contestantProps({ 'data-testid': 'logout', ...props }) as never
  });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  const button = target.querySelector<HTMLButtonElement>('[data-testid="logout"]');
  expect(button, 'the logout button should be rendered').not.toBeNull();
  expect(button!.disabled, 'the button is enabled once its modal is bound').toBe(false);
  button!.click();
  await Promise.resolve();
  flushSync();
  return target;
}

/** Assert that the user was logged out and no modal was opened. */
function expectLoggedOutAtOnce(target: HTMLElement): void {
  expect(logout).toHaveBeenCalledTimes(1);
  expect(target.querySelector('dialog[open]')).toBeNull();
}

/** Assert that the modal was opened and the user was not logged out. */
function expectAsked(target: HTMLElement): void {
  expect(logout).not.toHaveBeenCalled();
  expect(target.querySelector('dialog[open]')).not.toBeNull();
}

/** How long the fake clock is moved: past the button's default count of 30 seconds. */
const PAST_THE_COUNT_MS = 31_000;

/** The open dialog, which the case expects to be there. */
function openDialog(target: HTMLElement): HTMLDialogElement {
  const dialog = target.querySelector<HTMLDialogElement>('dialog[open]');
  expect(dialog, 'the modal should be open').not.toBeNull();
  return dialog!;
}

/** The button of the open dialog with this text. */
function dialogButton(target: HTMLElement, text: string): HTMLButtonElement {
  const found = [...openDialog(target).querySelectorAll('button')].find((b) => b.textContent?.includes(text));
  expect(found, `the modal should have a button with ${text}`).toBeDefined();
  return found!;
}

/** Move the clock past the count and let what it started run. */
async function passTheCount(): Promise<void> {
  vi.advanceTimersByTime(PAST_THE_COUNT_MS);
  await settle();
}

/** Let a settled promise's reactions run, and the component update. */
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
  flushSync();
}

/** A promise the case settles, for a sign-out held in flight. */
function held(): { promise: Promise<void>; resolve: () => void; reject: (reason: Error) => void } {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** The four ways a user closes the open modal, each a choice to stay: Continue, the ✕, Escape and a close the platform makes. */
const CLOSES: Array<[string, (target: HTMLElement) => void]> = [
  ['Continue', (target) => dialogButton(target, 'contestantApp.logoutModal.continue').click()],
  ['the close button', (target) => dialogButton(target, 'common.closeDialog').click()],
  ['Escape', () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))],
  [
    'a close the platform makes',
    (target) => {
      const dialog = openDialog(target);
      dialog.removeAttribute('open');
      dialog.dispatchEvent(new Event('cancel'));
      dialog.dispatchEvent(new Event('close'));
    }
  ]
];

describe('LogoutButton — no entity is loaded', () => {
  it('logs out at once and opens no modal, although tasks are incomplete with a count', async () => {
    setTasks(
      [NOMINATION, { ...PROFILE, status: 'incomplete', count: 1 }, { ...OPINIONS, status: 'incomplete', count: 2 }],
      { listsSay: 'everything is left' }
    );

    expectLoggedOutAtOnce(await pressLogout());
  });

  it('asks `logout` to carry no reason to the login page', async () => {
    setTasks([NOMINATION, PROFILE, OPINIONS], { listsSay: 'nothing is left' });

    await pressLogout();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledWith();
  });
});

describe('LogoutButton — an entity is loaded', () => {
  it('opens the modal and does not log out while the profile is incomplete with a count', async () => {
    state.savedEntityData = { answers: {} };
    setTasks([NOMINATION, { ...PROFILE, status: 'incomplete', count: 1 }, OPINIONS], { listsSay: 'nothing is left' });

    expectAsked(await pressLogout());
  });

  it('opens the modal and does not log out while the questions are incomplete with a count', async () => {
    state.savedEntityData = { answers: {} };
    setTasks([NOMINATION, PROFILE, { ...OPINIONS, status: 'incomplete', count: 2 }], { listsSay: 'nothing is left' });

    expectAsked(await pressLogout());
  });

  it('logs out at once when the profile is incomplete with nothing to count', async () => {
    state.savedEntityData = { answers: {} };
    setTasks([NOMINATION, { ...PROFILE, status: 'incomplete' }, OPINIONS], { listsSay: 'everything is left' });

    expectLoggedOutAtOnce(await pressLogout());
  });

  it('logs out at once when the nomination is incomplete and the other tasks are blocked', async () => {
    state.savedEntityData = { answers: {} };
    setTasks(
      [
        { ...NOMINATION, status: 'incomplete' },
        { ...PROFILE, status: 'blocked' },
        { ...OPINIONS, status: 'blocked' }
      ],
      { listsSay: 'everything is left' }
    );

    expectLoggedOutAtOnce(await pressLogout());
  });

  it('logs out at once when the tasks have no status yet', async () => {
    state.savedEntityData = { answers: {} };
    setTasks([NOMINATION, { ...PROFILE, status: undefined }, { ...OPINIONS, status: undefined }], {
      listsSay: 'everything is left'
    });

    expectLoggedOutAtOnce(await pressLogout());
  });

  it('logs out at once when every task is complete', async () => {
    state.savedEntityData = { answers: {} };
    setTasks([NOMINATION, PROFILE, OPINIONS], { listsSay: 'everything is left' });

    expectLoggedOutAtOnce(await pressLogout());
  });

  it('logs out at once when answers are locked, although tasks are incomplete with a count', async () => {
    state.savedEntityData = { answers: {} };
    state.answersLocked = true;
    setTasks(
      [NOMINATION, { ...PROFILE, status: 'incomplete', count: 1 }, { ...OPINIONS, status: 'incomplete', count: 2 }],
      { listsSay: 'everything is left' }
    );

    expectLoggedOutAtOnce(await pressLogout());
  });
});

describe('LogoutButton — a navigation', () => {
  beforeEach(() => {
    // Only the count's timer functions and the wall clock it reads are faked. Leaving the microtask queue real keeps `flushSync()` behaving as it does in production.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('closes an open modal, and the count no longer logs the user out', async () => {
    state.savedEntityData = { answers: {} };
    setTasks([NOMINATION, { ...PROFILE, status: 'incomplete', count: 1 }, OPINIONS], { listsSay: 'nothing is left' });
    const target = await pressLogout();
    expectAsked(target);

    navigate();
    expect(target.querySelector('dialog[open]')).toBeNull();

    vi.advanceTimersByTime(PAST_THE_COUNT_MS);
    await Promise.resolve();
    expect(logout).not.toHaveBeenCalled();
  });

  it('leaves a closed modal as it was: the dialog keeps its hidden class', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(LogoutButton, { target, props: contestantProps() as never });
    flushSync();
    teardown.push(() => {
      unmount(component);
      target.remove();
    });
    const dialog = target.querySelector('dialog');
    expect(dialog?.classList.contains('hidden')).toBe(true);

    navigate();

    expect(dialog?.classList.contains('hidden')).toBe(true);
    expect(logout).not.toHaveBeenCalled();
  });
});

describe('LogoutButton — a failed logout', () => {
  it('logs a logout that rejects on the direct path, where no modal asks first', async () => {
    const logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    logout.mockRejectedValueOnce(new Error('navigation failed'));

    await pressLogout();
    for (let i = 0; i < 5; i += 1) await Promise.resolve();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledTimes(1);
    logError.mockRestore();
  });
});

describe('LogoutButton — a page with a guard', () => {
  const UNSAVED = 'common.logoutUnsavedChanges';
  const COUNTED = 'contestantApp.logoutModal.questionsLeft';
  const INGRESS = 'contestantApp.logoutModal.ingress';
  const TITLE_LOGOUT = 'common.logout';
  const TITLE_MISSING = 'contestantApp.logoutModal.title';

  const removeGuards: Array<() => void> = [];
  let keep: Mock<() => void>;
  let discard: Mock<() => void>;

  beforeEach(() => {
    // Only the count's timer functions and the wall clock it reads are faked. Leaving the microtask queue real keeps `flushSync()` behaving as it does in production.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
    state.savedEntityData = { answers: {} };
    setTasks([NOMINATION, { ...PROFILE, status: 'incomplete', count: 1 }, OPINIONS], { listsSay: 'nothing is left' });
    keep = vi.fn();
    discard = vi.fn();
  });

  afterEach(() => {
    for (const remove of removeGuards.splice(0)) remove();
    vi.useRealTimers();
  });

  /** Register a guard. Its `keep` and `discard` are the case's spies. */
  function registerGuard(isActive: () => boolean): void {
    removeGuards.push(registerNavigationGuard({ isActive, keep, discard }));
  }

  /** Make the tasks hold nothing to count, while the unanswered lists say the opposite. */
  function nothingCounted(): void {
    setTasks([NOMINATION, PROFILE, OPINIONS], { listsSay: 'everything is left' });
  }

  /** What the open dialog says: its title and its visible paragraphs, those outside a `hidden` element. */
  function modalSays(target: HTMLElement): { title: string | undefined; body: Array<string | undefined> } {
    const dialog = openDialog(target);
    return {
      title: dialog.querySelector('h2')?.textContent?.trim(),
      body: [...dialog.querySelectorAll('p')].filter((p) => !p.closest('[hidden]')).map((p) => p.textContent?.trim())
    };
  }

  describe('what it says', () => {
    it('with an active guard and no counted task a press opens the modal, with the sentence on unsaved changes under the plain title', async () => {
      registerGuard(() => true);
      nothingCounted();

      const target = await pressLogout();

      expectAsked(target);
      expect(modalSays(target)).toEqual({ title: TITLE_LOGOUT, body: [UNSAVED, INGRESS] });
    });

    it('with an active guard and a counted task it says both, under the plain title', async () => {
      registerGuard(() => true);

      const target = await pressLogout();

      expectAsked(target);
      expect(modalSays(target)).toEqual({ title: TITLE_LOGOUT, body: [UNSAVED, COUNTED, INGRESS] });
    });

    it('with an inactive guard and a counted task it says the count alone, under its own title', async () => {
      registerGuard(() => false);

      const target = await pressLogout();

      expectAsked(target);
      expect(modalSays(target)).toEqual({ title: TITLE_MISSING, body: [COUNTED, INGRESS] });
    });

    it('with an inactive guard and no counted task a press opens nothing, and the user is logged out at once', async () => {
      registerGuard(() => false);
      nothingCounted();

      expectLoggedOutAtOnce(await pressLogout());
    });

    it("a guard that becomes active during the count shows its sentence, and the count's end calls `logout` once", async () => {
      let active = $state(false);
      registerGuard(() => active);

      const target = await pressLogout();
      expect(modalSays(target)).toEqual({ title: TITLE_MISSING, body: [COUNTED, INGRESS] });

      active = true;
      flushSync();
      expect(modalSays(target)).toEqual({ title: TITLE_LOGOUT, body: [UNSAVED, COUNTED, INGRESS] });

      await passTheCount();
      expect(logout).toHaveBeenCalledTimes(1);
      expect(keep).not.toHaveBeenCalled();
    });

    it('a guard that registers while the modal is open shows its sentence', async () => {
      const target = await pressLogout();
      expect(modalSays(target).body).toEqual([COUNTED, INGRESS]);

      registerGuard(() => true);
      flushSync();

      expect(modalSays(target)).toEqual({ title: TITLE_LOGOUT, body: [UNSAVED, COUNTED, INGRESS] });
    });

    it("a guard that goes inactive during the count with no counted task leaves the plain title and the ingress alone, and the count's end calls `logout` once", async () => {
      let active = $state(true);
      registerGuard(() => active);
      nothingCounted();

      const target = await pressLogout();
      expect(modalSays(target).body).toEqual([UNSAVED, INGRESS]);

      active = false;
      flushSync();
      expect(modalSays(target)).toEqual({ title: TITLE_LOGOUT, body: [INGRESS] });

      await passTheCount();
      expect(logout).toHaveBeenCalledTimes(1);
    });

    it('a counted task that settles during the count with no guard leaves the plain title and the ingress alone', async () => {
      const target = await pressLogout();
      expect(modalSays(target).title).toBe(TITLE_MISSING);

      nothingCounted();
      flushSync();

      expect(modalSays(target)).toEqual({ title: TITLE_LOGOUT, body: [INGRESS] });
    });
  });

  describe('what the dialog is named by', () => {
    /** The accessible name the open dialog carries as its `aria-label`. */
    function nameOf(target: HTMLElement): string | null {
      return openDialog(target).getAttribute('aria-label');
    }

    it('with a guard and no counted task it is the unsaved sentence, under the plain visible title', async () => {
      registerGuard(() => true);
      nothingCounted();

      const target = await pressLogout();

      expect(nameOf(target)).toBe(UNSAVED);
      expect(modalSays(target).title).toBe(TITLE_LOGOUT);
    });

    it('with a guard and a counted task it is the unsaved sentence, under the plain visible title', async () => {
      registerGuard(() => true);

      const target = await pressLogout();

      expect(nameOf(target)).toBe(UNSAVED);
      expect(modalSays(target).title).toBe(TITLE_LOGOUT);
    });

    it('with no guard and a counted task it is the title that says data is missing', async () => {
      registerGuard(() => false);

      const target = await pressLogout();

      expect(nameOf(target)).toBe(TITLE_MISSING);
    });

    it('a guard that goes inactive behind the modal gives the dialog its title back as its name', async () => {
      let active = $state(true);
      registerGuard(() => active);
      nothingCounted();

      const target = await pressLogout();
      expect(nameOf(target)).toBe(UNSAVED);

      active = false;
      flushSync();

      expect(nameOf(target)).toBe(TITLE_LOGOUT);
    });
  });

  describe('what the dialog is described by', () => {
    /** The count's full length, by the button's default. */
    const FULL_LENGTH = 30;
    const UNSAVED_SENTENCE = UNSAVED;
    const COUNTED_SENTENCE = saidWith(COUNTED, { opinionQuestionsLeft: 0 });

    /** The ingress with this many seconds. */
    function ingressAt(timeLeft: number): string {
      return saidWith(INGRESS, { timeLeft });
    }

    /** The element the dialog's `aria-describedby` names, which the case expects to be inside the dialog. */
    function descriptionOf(dialog: HTMLDialogElement): HTMLElement {
      const id = dialog.getAttribute('aria-describedby');
      expect(id, 'the dialog should name its description').toBeTruthy();
      const named = document.querySelectorAll<HTMLElement>(`[id="${id}"]`);
      expect(named.length, 'the id should name one element').toBe(1);
      expect(dialog.contains(named[0]), 'the description should be inside its dialog').toBe(true);
      return named[0];
    }

    /** The sentences of the open dialog's description. */
    function describedAs(target: HTMLElement): Array<string | undefined> {
      return [...descriptionOf(openDialog(target)).querySelectorAll('p')].map((p) => p.textContent?.trim());
    }

    beforeEach(() => {
      tShowsParameters = true;
    });

    afterEach(() => {
      tShowsParameters = false;
    });

    it('names one element, inside the dialog, carrying `hidden`', async () => {
      registerGuard(() => true);

      const target = await pressLogout();

      expect(descriptionOf(openDialog(target)).hasAttribute('hidden')).toBe(true);
    });

    it("with a guard and no counted task it holds the ingress at the count's full length, and not the unsaved sentence that names the dialog", async () => {
      registerGuard(() => true);
      nothingCounted();

      const target = await pressLogout();

      expect(describedAs(target)).toEqual([ingressAt(FULL_LENGTH)]);
    });

    it('with a guard and a counted task it holds the count of what is left and the ingress, and not the unsaved sentence', async () => {
      registerGuard(() => true);

      const target = await pressLogout();

      expect(describedAs(target)).toEqual([COUNTED_SENTENCE, ingressAt(FULL_LENGTH)]);
    });

    it('with no guard and a counted task it holds the count of what is left and the ingress', async () => {
      registerGuard(() => false);

      const target = await pressLogout();

      expect(describedAs(target)).toEqual([COUNTED_SENTENCE, ingressAt(FULL_LENGTH)]);
    });

    it('with a guard that goes inactive behind the modal it holds the ingress alone, and the visible body loses the unsaved sentence', async () => {
      let active = $state(true);
      registerGuard(() => active);
      nothingCounted();

      const target = await pressLogout();
      expect(describedAs(target)).toEqual([ingressAt(FULL_LENGTH)]);
      expect(modalSays(target).body).toEqual([UNSAVED_SENTENCE, ingressAt(FULL_LENGTH)]);

      active = false;
      flushSync();

      expect(describedAs(target)).toEqual([ingressAt(FULL_LENGTH)]);
      expect(modalSays(target).body).toEqual([ingressAt(FULL_LENGTH)]);
    });

    it('its ingress says the length the button was given', async () => {
      registerGuard(() => true);
      nothingCounted();

      const target = await pressLogout({ logoutModalTimer: 12 });

      expect(describedAs(target)).toEqual([ingressAt(12)]);
    });

    it('the visible ingress lies outside it', async () => {
      registerGuard(() => true);
      nothingCounted();

      const target = await pressLogout();

      const dialog = openDialog(target);
      const description = descriptionOf(dialog);
      const visibleIngress = [...dialog.querySelectorAll('p')].filter(
        (p) => p.textContent?.includes(INGRESS) && !description.contains(p)
      );
      expect(visibleIngress).toHaveLength(1);
    });

    it('two buttons mounted together have two ids, each naming an element inside its own dialog', async () => {
      const first = await pressLogout();
      const second = await pressLogout();

      const firstDialog = first.querySelector<HTMLDialogElement>('dialog');
      const secondDialog = second.querySelector<HTMLDialogElement>('dialog');
      expect(firstDialog?.getAttribute('aria-describedby')).toBeTruthy();
      expect(firstDialog?.getAttribute('aria-describedby')).not.toBe(secondDialog?.getAttribute('aria-describedby'));
      expect(descriptionOf(firstDialog!).closest('dialog')).toBe(firstDialog);
      expect(descriptionOf(secondDialog!).closest('dialog')).toBe(secondDialog);
    });
  });

  describe('what its answers do', () => {
    it.each(CLOSES)('%s closes it, runs `keep` once and calls no `logout`', async (_name, close) => {
      registerGuard(() => true);
      const target = await pressLogout();

      close(target);
      flushSync();

      expect(target.querySelector('dialog[open]')).toBeNull();
      expect(keep).toHaveBeenCalledTimes(1);
      expect(discard).not.toHaveBeenCalled();
      expect(logout).not.toHaveBeenCalled();

      await passTheCount();
      expect(logout).not.toHaveBeenCalled();
    });

    it("the modal's Log out calls `logout` once and runs no `keep`", async () => {
      registerGuard(() => true);
      const target = await pressLogout();

      dialogButton(target, 'common.logout').click();
      await settle();

      expect(logout).toHaveBeenCalledTimes(1);
      expect(keep).not.toHaveBeenCalled();
      expect(target.querySelector('dialog[open]')).toBeNull();
    });

    it("the count's end calls `logout` once and runs no `keep`", async () => {
      registerGuard(() => true);
      const target = await pressLogout();

      await passTheCount();

      expect(logout).toHaveBeenCalledTimes(1);
      expect(keep).not.toHaveBeenCalled();
      expect(target.querySelector('dialog[open]')).toBeNull();
    });

    it("the count's end asks `logout` to carry `loggedOutAutomatically` to the login page", async () => {
      registerGuard(() => true);
      await pressLogout();

      await passTheCount();

      expect(logout).toHaveBeenCalledTimes(1);
      expect(logout).toHaveBeenCalledWith({ reason: 'loggedOutAutomatically' });
    });

    it("the modal's Log out asks `logout` to carry no reason", async () => {
      registerGuard(() => true);
      const target = await pressLogout();

      dialogButton(target, 'common.logout').click();
      await settle();

      expect(logout).toHaveBeenCalledTimes(1);
      expect(logout).toHaveBeenCalledWith();
    });

    it("with the modal's Log out in flight, that button is disabled, a second click adds no call, and the count's end adds none", async () => {
      registerGuard(() => true);
      const signOut = held();
      logout.mockReturnValueOnce(signOut.promise);
      const target = await pressLogout();
      const button = dialogButton(target, 'common.logout');

      button.click();
      await settle();
      expect(logout).toHaveBeenCalledTimes(1);
      expect(button.disabled).toBe(true);

      button.click();
      await settle();
      expect(logout).toHaveBeenCalledTimes(1);

      await passTheCount();
      expect(logout).toHaveBeenCalledTimes(1);
      expect(keep).not.toHaveBeenCalled();

      signOut.resolve();
      await settle();
      expect(logout).toHaveBeenCalledTimes(1);
    });

    it("while the modal's Log out is in flight Continue is disabled and that button shows its loading state; after a rejection the modal is closed, and opened again its Continue is enabled", async () => {
      const logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
      registerGuard(() => true);
      const signOut = held();
      logout.mockReturnValueOnce(signOut.promise);
      const target = await pressLogout();

      dialogButton(target, 'common.logout').click();
      await settle();
      expect(dialogButton(target, 'contestantApp.logoutModal.continue').disabled).toBe(true);
      expect(dialogButton(target, 'common.loading').disabled).toBe(true);

      signOut.reject(new Error('the sign-out failed'));
      await settle();
      expect(logError).toHaveBeenCalledTimes(1);
      expect(target.querySelector('dialog[open]')).toBeNull();
      expect(keep).not.toHaveBeenCalled();

      target.querySelector<HTMLButtonElement>('[data-testid="logout"]')!.click();
      await settle();
      expect(dialogButton(target, 'contestantApp.logoutModal.continue').disabled).toBe(false);
      logError.mockRestore();
    });

    it('a press while a logout runs opens no modal', async () => {
      nothingCounted();
      const signOut = held();
      logout.mockReturnValueOnce(signOut.promise);
      const target = await pressLogout();
      expect(logout).toHaveBeenCalledTimes(1);

      registerGuard(() => true);
      target.querySelector<HTMLButtonElement>('[data-testid="logout"]')!.click();
      await settle();

      expect(target.querySelector('dialog[open]')).toBeNull();
      expect(logout).toHaveBeenCalledTimes(1);

      signOut.resolve();
      await settle();
    });

    it('a navigation closes it, runs no `keep`, and the count no longer logs the user out', async () => {
      registerGuard(() => true);
      const target = await pressLogout();

      navigate();

      expect(target.querySelector('dialog[open]')).toBeNull();
      expect(keep).not.toHaveBeenCalled();

      await passTheCount();
      expect(logout).not.toHaveBeenCalled();
    });

    it('a navigation that invalidates the guard throws nothing out of the header, closes it, runs no `keep`, and the count no longer logs the user out', async () => {
      let routeGone = $state(false);
      registerGuard(() => {
        if (routeGone) throw new Error('the route holds no question');
        return true;
      });
      const target = await pressLogout();

      navigate(() => (routeGone = true));

      expect(target.querySelector('dialog[open]')).toBeNull();
      expect(keep).not.toHaveBeenCalled();

      await passTheCount();
      expect(logout).not.toHaveBeenCalled();
    });
  });
});

describe("LogoutButton — the deadline's cookie", () => {
  beforeEach(() => {
    // Only the count's timer functions and the wall clock it reads are faked. Leaving the microtask queue real keeps `flushSync()` behaving as it does in production.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
    state.savedEntityData = { answers: {} };
    setTasks([NOMINATION, { ...PROFILE, status: 'incomplete', count: 1 }, OPINIONS], { listsSay: 'nothing is left' });
    expireCountCookies();
  });

  afterEach(() => {
    expireCountCookies();
    vi.useRealTimers();
  });

  /** What the page's two cookies of the count hold: every value of each. */
  function countCookies(): { pending: Array<string>; deadline: Array<string> } {
    return {
      pending: cookieValues(document.cookie, COOKIE.logoutPending),
      deadline: cookieValues(document.cookie, COOKIE.logoutDeadline)
    };
  }

  /** Neither cookie of the count. */
  const NO_COUNT = { pending: [], deadline: [] };

  /** Expire both cookies of the count, whoever wrote them. */
  function expireCountCookies(): void {
    for (const name of [COOKIE.logoutPending, COOKIE.logoutDeadline]) {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
  }

  /** Press the button, assert that the modal opened, and assert that both cookies hold one id of the count. */
  async function openWithDeadline(): Promise<HTMLElement> {
    const target = await pressLogout();
    expectAsked(target);
    const { pending, deadline } = countCookies();
    expect(pending, 'the modal should keep its count in the cookies').toHaveLength(1);
    expect(pending[0]).toMatch(/^[0-9a-f]{32}$/);
    expect(deadline).toEqual(pending);
    return target;
  }

  /** Make `logout` record what the cookies hold at the moment it is called, and answer as `answer` does. */
  function recordDeadlineAtLogout(answer: () => Promise<void> = async () => undefined): {
    atCall: Array<ReturnType<typeof countCookies>>;
  } {
    const record = { atCall: [] as Array<ReturnType<typeof countCookies>> };
    logout.mockImplementationOnce(async () => {
      record.atCall.push(countCookies());
      return answer();
    });
    return record;
  }

  it('opening the modal writes both cookies with one id of its count', async () => {
    expect(countCookies()).toEqual(NO_COUNT);

    await openWithDeadline();
  });

  it.each(CLOSES)('%s removes it', async (_name, close) => {
    const target = await openWithDeadline();

    close(target);
    flushSync();

    expect(target.querySelector('dialog[open]')).toBeNull();
    expect(countCookies()).toEqual(NO_COUNT);
  });

  it('a navigation that closes the modal removes it', async () => {
    const target = await openWithDeadline();

    navigate();

    expect(target.querySelector('dialog[open]')).toBeNull();
    expect(countCookies()).toEqual(NO_COUNT);
  });

  it("the modal's Log out finds it gone when `logout` is called", async () => {
    const record = recordDeadlineAtLogout();
    const target = await openWithDeadline();

    dialogButton(target, 'common.logout').click();
    await settle();

    expect(record.atCall).toEqual([NO_COUNT]);
    expect(countCookies()).toEqual(NO_COUNT);
  });

  it("the count's end finds it gone when `logout` is called", async () => {
    const record = recordDeadlineAtLogout();
    await openWithDeadline();

    await passTheCount();

    expect(record.atCall).toEqual([NO_COUNT]);
    expect(countCookies()).toEqual(NO_COUNT);
  });

  it("a count's end whose `logout` rejects leaves no cookie after the rejection and writes none later", async () => {
    const logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const record = recordDeadlineAtLogout(async () => {
      throw new Error('the sign-out failed');
    });
    const target = await openWithDeadline();

    await passTheCount();
    expect(record.atCall).toEqual([NO_COUNT]);
    expect(logError).toHaveBeenCalledTimes(1);
    expect(target.querySelector('dialog[open]')).toBeNull();
    expect(countCookies()).toEqual(NO_COUNT);

    await passTheCount();
    expect(countCookies()).toEqual(NO_COUNT);
    expect(logout).toHaveBeenCalledTimes(1);
    logError.mockRestore();
  });
});

describe('LogoutButton — an app whose logout does not navigate', () => {
  it('signs out once on one press, with no reason, and then leaves to the route it is given', async () => {
    const appLogout = vi.fn(async (): Promise<void> => undefined);
    fakePage.url = new URL('http://localhost/admin');
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(LogoutButton, {
      target,
      props: { logout: appLogout, redirectTo: 'AdminAppLogin', 'data-testid': 'app-logout' } as never
    });
    flushSync();
    teardown.push(() => {
      unmount(component);
      target.remove();
    });

    target.querySelector<HTMLButtonElement>('[data-testid="app-logout"]')!.click();
    await settle();

    expect(appLogout).toHaveBeenCalledTimes(1);
    expect(appLogout.mock.calls[0]).toEqual([]);
    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto.mock.calls[0][0]).toBe(buildRoute({ route: 'AdminAppLogin' }));
    expect(target.querySelector('dialog[open]')).toBeNull();
    goto.mockClear();
  });

  it('holds no navigation while that sign-out runs, so the app navigates as it would', async () => {
    const pending = held();
    const appLogout = vi.fn(() => pending.promise);
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(LogoutButton, {
      target,
      props: { logout: appLogout, redirectTo: 'AdminAppLogin', 'data-testid': 'app-logout' } as never
    });
    flushSync();
    teardown.push(() => {
      unmount(component);
      target.remove();
    });

    target.querySelector<HTMLButtonElement>('[data-testid="app-logout"]')!.click();
    await settle();
    expect(appLogout).toHaveBeenCalledTimes(1);
    expect(isNavigationHeld(), 'a navigation would wait for the sign-out').toBe(false);

    const logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    pending.reject(new Error('the sign-out failed'));
    await settle();
    expect(goto).not.toHaveBeenCalled();
    logError.mockRestore();
  });

  it('holds navigations while the sign-out of an app whose logout navigates runs', async () => {
    const pending = held();
    logout.mockImplementationOnce(() => pending.promise);
    await pressLogout();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(isNavigationHeld()).toBe(true);
    pending.resolve();
    await settle();
    expect(isNavigationHeld()).toBe(false);
  });
});
