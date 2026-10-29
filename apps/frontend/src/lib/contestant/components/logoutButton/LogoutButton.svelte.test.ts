/**
 * `LogoutButton`, mounted for real against a fake contestant context, with the real `Button` and `TimedModal` below it.
 *
 * What this file holds: when the button asks before logging out. It asks about the entity that is loaded, while answers are not locked, and only when the profile or the questions task is incomplete with a count of what is left: that count is what the modal's sentences say. A blocked task, the nomination and a profile that lacks nothing a sentence can count ask nothing, and the user is logged out at once.
 *
 * The fake context's tasks, its lists and the store's saved data are rune state behind getters, as the real accessors are. In every case the unanswered lists say the opposite of the tasks, so a button that decided by the lists would do the opposite of what the case expects.
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Task } from '$lib/contestant/tasks/taskState';

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

const logout = vi.fn(async () => undefined);

vi.mock('$lib/contexts/contestant', () => ({
  getContestantContext: () => ({
    t: (key: string) => key,
    logout,
    appSettings: { entities: {} },
    userData: {
      get savedEntityData() {
        return state.savedEntityData;
      }
    },
    get answersLocked() {
      return state.answersLocked;
    },
    get tasks() {
      return state.tasks;
    },
    get unansweredOpinionQuestions() {
      return state.unansweredOpinionQuestions;
    },
    get unansweredRequiredInfoQuestions() {
      return state.unansweredRequiredInfoQuestions;
    }
  })
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
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

/** Mount the button, press it and return the element it was mounted into. */
async function pressLogout(): Promise<HTMLElement> {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(LogoutButton, { target, props: { 'data-testid': 'logout' } as never });
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

describe('LogoutButton — no entity is loaded', () => {
  it('logs out at once and opens no modal, although tasks are incomplete with a count', async () => {
    setTasks(
      [NOMINATION, { ...PROFILE, status: 'incomplete', count: 1 }, { ...OPINIONS, status: 'incomplete', count: 2 }],
      { listsSay: 'everything is left' }
    );

    expectLoggedOutAtOnce(await pressLogout());
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
