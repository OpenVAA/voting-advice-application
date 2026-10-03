import { ENTITY_TYPE, QUESTION_CATEGORY_TYPE } from '@openvaa/data';
import { describe, expect, test } from 'vitest';
import { rollUpQuestionCategories } from './questionRollup';
import type { QuestionCategoryType } from '@openvaa/data';
import type { QuestionRollupTargets } from './questionRollup';

/**
 * Contract guard for the shared question-category rollup (phase 159, requirement REVIEW-CMP-05).
 *
 * The rollup used to be written twice — once in `candidateContext.svelte.ts` and once in `voterContext.svelte.ts` — with three deliberate differences that neither copy documented. This file pins the extracted contract so the three differences stay parameterised instead of quietly collapsing into whichever copy the extraction happened to start from.
 *
 * What a wrong implementation would have produced. Dropping the entity-type scope from the applicable-question lookup (it is passed to two calls, and only one of them is the obvious one) would widen the candidate app's question set past its entity scope while the applicability check still looked correct — a silent over-disclosure with no type error and no failing route. Applying the question filter to only the opinion list would leave hidden informational questions rendering in the voter app. Losing the opinion-matchability guard would let a non-matchable question reach the matching algorithm, where it fails far from its cause. Returning `undefined` rather than four empty collections on an empty category set would crash both callers on cold entry, when the data root is legitimately empty for the first frames.
 *
 * The fixtures are plain objects shaped like the surface the rollup actually reads — the category collection, the applicability predicate, the applicable-question lookup, the category type and the matchability flag — rather than instances of the real data model, so this stays a unit test of the rollup and not of `@openvaa/data`.
 */

type FakeQuestion = { id: string; isMatchable: boolean; hidden: boolean };

type FakeCategory = {
  id: string;
  type: QuestionCategoryType;
  appliesTo(targets: QuestionRollupTargets): boolean;
  getApplicableQuestions(targets: QuestionRollupTargets): Array<FakeQuestion>;
};

/** Every targets object each category method was called with, so a test can prove which arguments reached which call. */
type CallLog = {
  appliesTo: Array<QuestionRollupTargets>;
  getApplicableQuestions: Array<QuestionRollupTargets>;
};

function newCallLog(): CallLog {
  return { appliesTo: [], getApplicableQuestions: [] };
}

function question({
  id,
  isMatchable = true,
  hidden = false
}: {
  id: string;
  isMatchable?: boolean;
  hidden?: boolean;
}): FakeQuestion {
  return { id, isMatchable, hidden };
}

function category({
  id,
  type,
  questions = [],
  applies = true,
  log
}: {
  id: string;
  type: QuestionCategoryType;
  questions?: Array<FakeQuestion>;
  applies?: boolean;
  log: CallLog;
}): FakeCategory {
  return {
    id,
    type,
    appliesTo(targets) {
      log.appliesTo.push(targets);
      return applies;
    },
    getApplicableQuestions(targets) {
      log.getApplicableQuestions.push(targets);
      return questions;
    }
  };
}

/** The voter app's difference: hidden questions are filtered out of BOTH question kinds. */
function notHidden(q: FakeQuestion): boolean {
  return !q.hidden;
}

describe('rollUpQuestionCategories', () => {
  test('splits every applicable category into its informational and opinion groups', () => {
    const log = newCallLog();
    const info = category({
      id: 'info-1',
      type: QUESTION_CATEGORY_TYPE.Info,
      questions: [question({ id: 'i1' }), question({ id: 'i2' })],
      log
    });
    const opinion = category({
      id: 'opinion-1',
      type: QUESTION_CATEGORY_TYPE.Opinion,
      questions: [question({ id: 'o1' })],
      log
    });

    const result = rollUpQuestionCategories({
      dataRoot: { questionCategories: [info, opinion] },
      elections: [],
      constituencies: []
    });

    expect(result.infoCategories).toEqual([info]);
    expect(result.opinionCategories).toEqual([opinion]);
    expect(result.infoQuestions.map((q) => q.id)).toEqual(['i1', 'i2']);
    expect(result.opinionQuestions.map((q) => q.id)).toEqual(['o1']);
  });

  test('passes the entity-type scope into BOTH the applicability check and the applicable-question lookup', () => {
    const log = newCallLog();
    const opinion = category({
      id: 'opinion-1',
      type: QUESTION_CATEGORY_TYPE.Opinion,
      questions: [question({ id: 'o1' })],
      log
    });

    rollUpQuestionCategories({
      dataRoot: { questionCategories: [opinion] },
      elections: [],
      constituencies: [],
      entityType: ENTITY_TYPE.Candidate
    });

    // The scope reaching only `appliesTo` would still produce a plausible-looking category list, so both call logs are asserted, not just the first.
    expect(log.appliesTo.length).toBeGreaterThan(0);
    expect(log.getApplicableQuestions.length).toBeGreaterThan(0);
    for (const targets of [...log.appliesTo, ...log.getApplicableQuestions])
      expect(targets.entityType).toBe(ENTITY_TYPE.Candidate);
  });

  test('omits the entity-type scope when the caller supplies none', () => {
    const log = newCallLog();
    const opinion = category({
      id: 'opinion-1',
      type: QUESTION_CATEGORY_TYPE.Opinion,
      questions: [question({ id: 'o1' })],
      log
    });

    rollUpQuestionCategories({
      dataRoot: { questionCategories: [opinion] },
      elections: [],
      constituencies: []
    });

    for (const targets of [...log.appliesTo, ...log.getApplicableQuestions]) expect(targets.entityType).toBeUndefined();
  });

  test('excludes filtered questions from both the informational and the opinion lists', () => {
    const log = newCallLog();
    const info = category({
      id: 'info-1',
      type: QUESTION_CATEGORY_TYPE.Info,
      questions: [question({ id: 'i1' }), question({ id: 'i-hidden', hidden: true })],
      log
    });
    const opinion = category({
      id: 'opinion-1',
      type: QUESTION_CATEGORY_TYPE.Opinion,
      questions: [question({ id: 'o1' }), question({ id: 'o-hidden', hidden: true })],
      log
    });

    const result = rollUpQuestionCategories({
      dataRoot: { questionCategories: [info, opinion] },
      elections: [],
      constituencies: [],
      questionFilter: notHidden
    });

    expect(result.infoQuestions.map((q) => q.id)).toEqual(['i1']);
    expect(result.opinionQuestions.map((q) => q.id)).toEqual(['o1']);
  });

  test('excludes a category with no applicable questions entirely', () => {
    const log = newCallLog();
    const empty = category({ id: 'info-empty', type: QUESTION_CATEGORY_TYPE.Info, questions: [], log });
    const inapplicable = category({
      id: 'info-inapplicable',
      type: QUESTION_CATEGORY_TYPE.Info,
      questions: [question({ id: 'i1' })],
      applies: false,
      log
    });
    const kept = category({
      id: 'info-kept',
      type: QUESTION_CATEGORY_TYPE.Info,
      questions: [question({ id: 'i2' })],
      log
    });

    const result = rollUpQuestionCategories({
      dataRoot: { questionCategories: [empty, inapplicable, kept] },
      elections: [],
      constituencies: []
    });

    expect(result.infoCategories).toEqual([kept]);
    expect(result.opinionCategories).toEqual([]);
    expect(result.infoQuestions.map((q) => q.id)).toEqual(['i2']);
  });

  test('raises the server error when an opinion category holds a non-matchable question', () => {
    const log = newCallLog();
    const opinion = category({
      id: 'opinion-broken',
      type: QUESTION_CATEGORY_TYPE.Opinion,
      questions: [question({ id: 'o1' }), question({ id: 'o2', isMatchable: false })],
      log
    });

    // SvelteKit's `error()` throws an `HttpError`, which carries its text under `body.message` rather than under `message`, so `toThrow(/…/)` would see an empty string and pass for the wrong reason. Assert the status and the message shape explicitly instead.
    let thrown: unknown;
    try {
      rollUpQuestionCategories({
        dataRoot: { questionCategories: [opinion] },
        elections: [],
        constituencies: []
      });
    } catch (e) {
      thrown = e;
    }

    expect(thrown, 'the non-matchable opinion question was accepted silently').toBeDefined();
    expect(thrown).toMatchObject({
      status: 500,
      body: { message: 'Some opinion questions in category opinion-broken is not matchable.' }
    });
  });

  test('returns four empty collections for an empty category collection and raises nothing', () => {
    const result = rollUpQuestionCategories({
      dataRoot: { questionCategories: [] },
      elections: [],
      constituencies: []
    });

    expect(result.infoCategories).toEqual([]);
    expect(result.opinionCategories).toEqual([]);
    expect(result.infoQuestions).toEqual([]);
    expect(result.opinionQuestions).toEqual([]);
  });
});
