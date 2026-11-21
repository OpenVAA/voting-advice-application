/**
 * `contestantLogoutWarning`: what the Contestant App's Log out warns about, read from the contestant context.
 *
 * What this file holds:
 *
 * 1. **No warning** while no entity's saved data is loaded, while answers are locked, and while no `profile` or `questions` task is incomplete with a count: a complete task, a task without a count or with a count of 0, a blocked one and the nomination task each give none.
 * 2. **A warning** for an incomplete `profile` or `questions` task with a count: the two counts the modal's sentences read, from the unanswered lists, and whether the entity is hidden from voters while it has unanswered opinion questions.
 * 3. **The reads are made at the call.** The context's accessors are read when the function is called, so a caller that calls it inside a tracking scope follows them.
 */

import { describe, expect, it } from 'vitest';
import { contestantLogoutWarning } from './logoutWarning';
import type { Task } from '$lib/contestant/tasks/taskState';
import type { ContestantLogoutWarningSource } from './logoutWarning';

const PROFILE_LEFT: Task = {
  id: 'profile',
  status: 'incomplete',
  count: 2,
  route: { route: 'ContestantAppProfile' }
};
const QUESTIONS_LEFT: Task = {
  id: 'questions',
  status: 'incomplete',
  count: 3,
  route: { route: 'ContestantAppQuestions' }
};

/**
 * A fake contestant context with the members the function reads.
 * @param overrides - What differs from an entity with an incomplete questions task, one unanswered info question and two unanswered opinion questions.
 * @returns The fake.
 */
function source(
  overrides: Partial<Record<keyof ContestantLogoutWarningSource, unknown>> = {}
): ContestantLogoutWarningSource {
  return {
    userData: { savedEntityData: { answers: {} } },
    answersLocked: false,
    taskState: { tasks: [QUESTIONS_LEFT] },
    unansweredOpinionQuestions: [{ id: 'o1' }, { id: 'o2' }],
    unansweredRequiredInfoQuestions: [{ id: 'i1' }],
    selectedEntity: { type: 'candidate' },
    appSettings: { entities: { hideIfMissingAnswers: { candidate: true } } },
    ...overrides
  } as unknown as ContestantLogoutWarningSource;
}

describe('contestantLogoutWarning — no warning', () => {
  it('gives none while no entity’s saved data is loaded', () => {
    expect(contestantLogoutWarning(source({ userData: { savedEntityData: undefined } }))).toBeUndefined();
  });

  it('gives none while answers are locked', () => {
    expect(contestantLogoutWarning(source({ answersLocked: true }))).toBeUndefined();
  });

  it.each<[string, Array<Task>]>([
    ['no task', []],
    ['a complete questions task', [{ ...QUESTIONS_LEFT, status: 'complete' }]],
    ['an incomplete task with no count', [{ ...PROFILE_LEFT, count: undefined }]],
    ['an incomplete task with a count of 0', [{ ...QUESTIONS_LEFT, count: 0 }]],
    ['a blocked questions task', [{ ...QUESTIONS_LEFT, status: 'blocked' } as Task]],
    ['an incomplete nomination task with a count', [{ ...PROFILE_LEFT, id: 'nomination' } as Task]]
  ])('gives none for %s', (_, tasks) => {
    expect(contestantLogoutWarning(source({ taskState: { tasks } }))).toBeUndefined();
  });
});

describe('contestantLogoutWarning — a warning', () => {
  it('gives the two counts and the hidden flag for an incomplete questions task', () => {
    expect(contestantLogoutWarning(source())).toEqual({
      opinionQuestionsLeft: 2,
      infoQuestionsLeft: 1,
      hiddenIfMissing: true
    });
  });

  it('gives a warning for an incomplete profile task', () => {
    expect(contestantLogoutWarning(source({ taskState: { tasks: [PROFILE_LEFT] } }))).toEqual({
      opinionQuestionsLeft: 2,
      infoQuestionsLeft: 1,
      hiddenIfMissing: true
    });
  });

  it('gives no info question left for the branch that says only how many opinion questions are left', () => {
    expect(contestantLogoutWarning(source({ unansweredRequiredInfoQuestions: [] }))).toEqual({
      opinionQuestionsLeft: 2,
      infoQuestionsLeft: 0,
      hiddenIfMissing: true
    });
  });

  it('says the entity is not hidden when the settings do not hide its type', () => {
    expect(contestantLogoutWarning(source({ appSettings: { entities: {} } }))?.hiddenIfMissing).toBe(false);
  });

  it('reads the hidden flag of the selected entity’s type', () => {
    expect(contestantLogoutWarning(source({ selectedEntity: { type: 'organization' } }))?.hiddenIfMissing).toBe(false);
  });
});

describe('contestantLogoutWarning — the reads', () => {
  it('reads the context’s accessors at the call, so a changed accessor changes the answer', () => {
    let locked = false;
    const live = source();
    Object.defineProperty(live, 'answersLocked', { get: () => locked });

    expect(contestantLogoutWarning(live)).toBeDefined();
    locked = true;
    expect(contestantLogoutWarning(live)).toBeUndefined();
  });
});
