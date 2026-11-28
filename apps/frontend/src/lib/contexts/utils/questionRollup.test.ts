import { log as appLog } from '@openvaa/app-shared';
import { DataRoot, ENTITY_TYPE, QUESTION_CATEGORY_TYPE, QUESTION_TYPE } from '@openvaa/data';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { contestsOfNominations, rollUpQuestionCategories } from './questionRollup';
import type { AnyQuestionVariant, AnyQuestionVariantData, Constituency, Election, EntityType } from '@openvaa/data';
import type { ContestLookup } from './questionRollup';

/**
 * Contract guard for the shared question-category rollup.
 *
 * `contestantContext.svelte.ts` and `voterContext.svelte.ts` both call the rollup, with three deliberate differences. This file pins the contract so the three differences stay parameterised instead of quietly collapsing into one caller's behaviour.
 *
 * What a wrong implementation would have produced. Dropping the entity-type scope from the applicable-question lookup (it is passed to two calls, and only one of them is the obvious one) would widen the contestant app's question set past its entity scope while the category list still looked correct — a silent over-disclosure with no type error and no failing route. Applying the question filter to only the opinion list would leave hidden informational questions rendering in the voter app. Losing the opinion-matchability guard would let a non-matchable question reach the matching algorithm, where it fails far from its cause. Returning `undefined` rather than four empty collections on an empty category set would crash both callers on cold entry, when the data root is legitimately empty for the first frames.
 */

const CHOICES = [
  { id: 'c1', label: 'Disagree', normalizableValue: 1 },
  { id: 'c2', label: 'Agree', normalizableValue: 2 }
];

type CategorySpec = {
  id: string;
  type: (typeof QUESTION_CATEGORY_TYPE)[keyof typeof QUESTION_CATEGORY_TYPE];
  entityType?: Array<EntityType>;
  questions: Array<{ id: string; matchable?: boolean; entityType?: Array<EntityType> }>;
};

/** Build a small `DataRoot` holding the given categories, each question an ordinal (matchable) or a text (non-matchable) question. */
function rootOf(categories: Array<CategorySpec>): DataRoot {
  const root = new DataRoot();
  root.provideQuestionData({
    categories: categories.map(({ id, type, entityType }) => ({ id, name: id, type, entityType })),
    questions: categories.flatMap(({ id: categoryId, questions }) =>
      questions.map(
        ({ id, matchable = true, entityType }) =>
          (matchable
            ? { id, name: id, categoryId, entityType, type: QUESTION_TYPE.SingleChoiceOrdinal, choices: CHOICES }
            : { id, name: id, categoryId, entityType, type: QUESTION_TYPE.Text }) as AnyQuestionVariantData
      )
    )
  });
  return root;
}

function ids(items: Array<{ id: string }>): Array<string> {
  return items.map((i) => i.id);
}

/** The voter app's difference: hidden questions are filtered out of BOTH question kinds. */
function notHidden(q: AnyQuestionVariant): boolean {
  return !q.id.endsWith('-hidden');
}

describe('rollUpQuestionCategories', () => {
  test.each([
    [ENTITY_TYPE.Candidate, ['o-candidate', 'o-any'], ['i-candidate']],
    [ENTITY_TYPE.Organization, ['o-organization', 'o-any'], ['i-organization']]
  ] as const)(
    'returns a question addressed to one entity type for the %s scope alone, and an unscoped question for both',
    (entityType, expectedOpinion, expectedInfo) => {
      const dataRoot = rootOf([
        {
          id: 'opinion-1',
          type: QUESTION_CATEGORY_TYPE.Opinion,
          questions: [
            { id: 'o-candidate', entityType: [ENTITY_TYPE.Candidate] },
            { id: 'o-organization', entityType: [ENTITY_TYPE.Organization] },
            { id: 'o-any' }
          ]
        },
        {
          id: 'info-1',
          type: QUESTION_CATEGORY_TYPE.Info,
          questions: [
            { id: 'i-candidate', entityType: [ENTITY_TYPE.Candidate] },
            { id: 'i-organization', entityType: [ENTITY_TYPE.Organization] }
          ]
        }
      ]);

      const result = rollUpQuestionCategories({ dataRoot, elections: [], constituencies: [], entityType });

      expect(ids(result.opinionQuestions)).toEqual(expectedOpinion);
      expect(ids(result.infoQuestions)).toEqual(expectedInfo);
    }
  );

  test('drops a category that holds no question for the scope, and keeps it for the scope it holds one for', () => {
    const dataRoot = rootOf([
      {
        id: 'opinion-1',
        type: QUESTION_CATEGORY_TYPE.Opinion,
        questions: [{ id: 'o-candidate', entityType: [ENTITY_TYPE.Candidate] }]
      }
    ]);

    const forOrganization = rollUpQuestionCategories({
      dataRoot,
      elections: [],
      constituencies: [],
      entityType: ENTITY_TYPE.Organization
    });
    const forCandidate = rollUpQuestionCategories({
      dataRoot,
      elections: [],
      constituencies: [],
      entityType: ENTITY_TYPE.Candidate
    });

    expect(forOrganization.opinionCategories).toEqual([]);
    expect(forOrganization.opinionQuestions).toEqual([]);
    expect(ids(forCandidate.opinionCategories)).toEqual(['opinion-1']);
    expect(ids(forCandidate.opinionQuestions)).toEqual(['o-candidate']);
  });

  test('splits every applicable category into its informational and opinion groups', () => {
    const dataRoot = rootOf([
      { id: 'info-1', type: QUESTION_CATEGORY_TYPE.Info, questions: [{ id: 'i1' }, { id: 'i2' }] },
      { id: 'opinion-1', type: QUESTION_CATEGORY_TYPE.Opinion, questions: [{ id: 'o1' }] }
    ]);

    const result = rollUpQuestionCategories({ dataRoot, elections: [], constituencies: [] });

    expect(ids(result.infoCategories)).toEqual(['info-1']);
    expect(ids(result.opinionCategories)).toEqual(['opinion-1']);
    expect(ids(result.infoQuestions)).toEqual(['i1', 'i2']);
    expect(ids(result.opinionQuestions)).toEqual(['o1']);
  });

  test('passes the entity-type scope into BOTH the category lookup and the applicable-question lookup', () => {
    const dataRoot = rootOf([{ id: 'opinion-1', type: QUESTION_CATEGORY_TYPE.Opinion, questions: [{ id: 'o1' }] }]);
    const findSpy = vi.spyOn(dataRoot, 'findQuestionCategories');
    const questionSpy = vi.spyOn(dataRoot.getQuestionCategory('opinion-1'), 'getApplicableQuestions');

    rollUpQuestionCategories({ dataRoot, elections: [], constituencies: [], entityType: ENTITY_TYPE.Candidate });

    // The scope reaching only the category lookup would still produce a plausible-looking category list, so both calls are asserted, not just the first.
    expect(findSpy).toHaveBeenCalled();
    expect(questionSpy).toHaveBeenCalled();
    for (const [targets] of [...findSpy.mock.calls, ...questionSpy.mock.calls])
      expect(targets.entityType).toBe(ENTITY_TYPE.Candidate);
  });

  test('omits the entity-type scope when the caller supplies none', () => {
    const dataRoot = rootOf([{ id: 'opinion-1', type: QUESTION_CATEGORY_TYPE.Opinion, questions: [{ id: 'o1' }] }]);
    const findSpy = vi.spyOn(dataRoot, 'findQuestionCategories');
    const questionSpy = vi.spyOn(dataRoot.getQuestionCategory('opinion-1'), 'getApplicableQuestions');

    rollUpQuestionCategories({ dataRoot, elections: [], constituencies: [] });

    for (const [targets] of [...findSpy.mock.calls, ...questionSpy.mock.calls])
      expect(targets.entityType).toBeUndefined();
  });

  test('excludes filtered questions from both the informational and the opinion lists', () => {
    const dataRoot = rootOf([
      { id: 'info-1', type: QUESTION_CATEGORY_TYPE.Info, questions: [{ id: 'i1' }, { id: 'i-hidden' }] },
      { id: 'opinion-1', type: QUESTION_CATEGORY_TYPE.Opinion, questions: [{ id: 'o1' }, { id: 'o-hidden' }] }
    ]);

    const result = rollUpQuestionCategories({ dataRoot, elections: [], constituencies: [], questionFilter: notHidden });

    expect(ids(result.infoQuestions)).toEqual(['i1']);
    expect(ids(result.opinionQuestions)).toEqual(['o1']);
  });

  test('excludes a category with no applicable questions entirely', () => {
    const dataRoot = rootOf([
      { id: 'info-empty', type: QUESTION_CATEGORY_TYPE.Info, questions: [] },
      {
        id: 'info-inapplicable',
        type: QUESTION_CATEGORY_TYPE.Info,
        entityType: [ENTITY_TYPE.Organization],
        questions: [{ id: 'i1' }]
      },
      { id: 'info-kept', type: QUESTION_CATEGORY_TYPE.Info, questions: [{ id: 'i2' }] }
    ]);

    const result = rollUpQuestionCategories({
      dataRoot,
      elections: [],
      constituencies: [],
      entityType: ENTITY_TYPE.Candidate
    });

    expect(ids(result.infoCategories)).toEqual(['info-kept']);
    expect(result.opinionCategories).toEqual([]);
    expect(ids(result.infoQuestions)).toEqual(['i2']);
  });

  test('raises the server error when an opinion category holds a non-matchable question', () => {
    const dataRoot = rootOf([
      {
        id: 'opinion-broken',
        type: QUESTION_CATEGORY_TYPE.Opinion,
        questions: [{ id: 'o1' }, { id: 'o2', matchable: false }]
      }
    ]);

    // SvelteKit's `error()` throws an `HttpError`, which carries its text under `body.message` rather than under `message`, so `toThrow(/…/)` would see an empty string and pass for the wrong reason. Assert the status and the message shape explicitly instead.
    let thrown: unknown;
    try {
      rollUpQuestionCategories({ dataRoot, elections: [], constituencies: [] });
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
    const result = rollUpQuestionCategories({ dataRoot: new DataRoot(), elections: [], constituencies: [] });

    expect(result.infoCategories).toEqual([]);
    expect(result.opinionCategories).toEqual([]);
    expect(result.infoQuestions).toEqual([]);
    expect(result.opinionQuestions).toEqual([]);
  });
});

describe('contestsOfNominations', () => {
  const electionA = { id: 'election-a' } as Election;
  const electionB = { id: 'election-b' } as Election;
  const constituencyA = { id: 'constituency-a' } as Constituency;

  /** A lookup that holds the given objects and throws for any other id, as a data root does. */
  function lookupOf(elections: Array<Election>, constituencies: Array<Constituency>): ContestLookup {
    function find<TObject extends { id: string }>(objects: Array<TObject>, id: string): TObject {
      const found = objects.find((o) => o.id === id);
      if (!found) throw new Error(`no such object: ${id}`);
      return found;
    }
    return {
      getElection: (id) => find(elections, id),
      getConstituency: (id) => find(constituencies, id)
    };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('resolves every id once, in the order the nominations name them', () => {
    const result = contestsOfNominations({
      dataRoot: lookupOf([electionA, electionB], [constituencyA]),
      nominations: [
        { electionId: 'election-b', constituencyId: 'constituency-a' },
        { electionId: 'election-a', constituencyId: 'constituency-a' },
        { electionId: 'election-b', constituencyId: 'constituency-a' }
      ]
    });

    expect(result).toEqual({ elections: [electionB, electionA], constituencies: [constituencyA], unresolved: false });
  });

  test('skips and logs an id the data root does not hold, and keeps the others', () => {
    const logged = vi.spyOn(appLog, 'error').mockImplementation(() => undefined);

    const result = contestsOfNominations({
      dataRoot: lookupOf([electionA], [constituencyA]),
      nominations: [
        { electionId: 'election-unknown', constituencyId: 'constituency-unknown' },
        { electionId: 'election-a', constituencyId: 'constituency-a' }
      ]
    });

    expect(result).toEqual({ elections: [electionA], constituencies: [constituencyA], unresolved: true });
    expect(logged).toHaveBeenCalledTimes(2);
  });
});
